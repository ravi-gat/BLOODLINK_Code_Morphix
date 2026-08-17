"""
Patient API router.

GET  /api/patients/me
PUT  /api/patients/me
POST /api/blood-requests
GET  /api/blood-requests/my
GET  /api/blood-requests/{id}
POST /api/blood-requests/{id}/cancel
GET  /api/patients/nearby-donors

DB columns used:
    Patient: id, userId, bloodGroup, city, address
    BloodRequest: id, patientId, hospitalId, bloodGroup, unitsRequired,
                  urgency, status, city, notes, createdAt, updatedAt
    Donor: id, userId, bloodGroup, city, availabilityStatus, lastDonationDate
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.deps import get_patient_user, get_current_user
from ..models.user import User
from ..models.profiles import Patient, Donor
from ..models.blood import BloodRequest
from ..models.enums import RequestStatus, UserRole, BloodGroup
from ..schemas.patient import (
    PatientProfileUpdate, PatientProfileResponse,
    BloodRequestCreate, BloodRequestResponse,
)
from ..schemas.donor import DonorPublicResponse
from ..utils.helpers import label_to_bg, bg_to_label, fmt_datetime, fmt_date
from ..services.audit_service import log_action
from ..services.notification_service import notify_emergency_request
from ..ai.matching import find_and_rank_donors
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Patients"])


# ---------------------------------------------------------------------------
# Response builders
# ---------------------------------------------------------------------------

def _patient_response(patient: Patient) -> PatientProfileResponse:
    return PatientProfileResponse(
        id=patient.id,
        user_id=patient.user_id,
        blood_group=bg_to_label(patient.blood_group) if patient.blood_group else None,
        city=patient.city,
        address=patient.address,
        # emergency_contact and medical_notes don't exist in DB — omit
        name=patient.user.full_name if patient.user else None,
        email=patient.user.email if patient.user else None,
        phone=patient.user.phone if patient.user else None,
        created_at=fmt_datetime(patient.created_at),
    )


def _request_response(req: BloodRequest) -> BloodRequestResponse:
    # req.notes is the real column (not medical_notes / contact_number etc.)
    hospital_name = req.hospital.hospital_name if req.hospital else None
    patient_name = req.patient.user.full_name if (req.patient and req.patient.user) else None
    return BloodRequestResponse(
        id=req.id,
        blood_group=bg_to_label(req.blood_group),
        units_required=req.units_required,
        urgency=req.urgency,          # already a plain string
        city=req.city,
        status=req.status.value,
        hospital_name=hospital_name,
        patient_name=patient_name,
        medical_notes=req.notes,      # expose 'notes' as 'medical_notes' in API
        contact_number=None,          # DB has no contact_number column
        created_at=fmt_datetime(req.created_at) or "",
        updated_at=fmt_datetime(req.updated_at) or "",
    )


# ---------------------------------------------------------------------------
# Patient profile
# ---------------------------------------------------------------------------

@router.get("/patients/me", response_model=PatientProfileResponse)
def get_patient_profile(
    current_user: User = Depends(get_patient_user),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found.")
    return _patient_response(patient)


@router.put("/patients/me", response_model=PatientProfileResponse)
def update_patient_profile(
    body: PatientProfileUpdate,
    current_user: User = Depends(get_patient_user),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found.")

    if body.blood_group is not None:
        bg = label_to_bg(body.blood_group)
        if bg is None:
            raise HTTPException(status_code=400, detail=f"Invalid blood group: {body.blood_group}")
        patient.blood_group = bg
    if body.city is not None:
        patient.city = body.city.strip()
    if body.address is not None:
        patient.address = body.address.strip()
    # emergency_contact and medical_notes have no DB column — silently ignore

    db.commit()
    db.refresh(patient)
    return _patient_response(patient)


# ---------------------------------------------------------------------------
# Blood requests
# ---------------------------------------------------------------------------

@router.post("/blood-requests", response_model=BloodRequestResponse, status_code=201)
def create_blood_request(
    body: BloodRequestCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a blood request. Accessible by patients and hospitals."""
    if current_user.role not in (UserRole.PATIENT, UserRole.HOSPITAL):
        raise HTTPException(
            status_code=403,
            detail="Only patients and hospitals can create blood requests.",
        )

    bg = label_to_bg(body.blood_group)
    if bg is None:
        raise HTTPException(status_code=400, detail=f"Invalid blood group: {body.blood_group}")

    # Validate urgency against accepted values (VARCHAR column)
    valid_urgency = {"Critical", "High", "Moderate", "Low"}
    urgency = body.urgency if body.urgency in valid_urgency else "High"

    patient_id = None
    hospital_id = None

    if current_user.role == UserRole.PATIENT:
        p = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if p:
            patient_id = p.id
    elif current_user.role == UserRole.HOSPITAL:
        from ..models.profiles import Hospital
        h = db.query(Hospital).filter(Hospital.user_id == current_user.id).first()
        if h:
            hospital_id = h.id

    blood_req = BloodRequest(
        id=str(uuid.uuid4()).replace("-", ""),
        patient_id=patient_id,
        hospital_id=hospital_id,
        blood_group=bg,
        units_required=body.units_required,
        urgency=urgency,
        city=body.city.strip(),
        status=RequestStatus.PENDING,
        notes=body.medical_notes,    # store in the actual 'notes' column
    )
    db.add(blood_req)
    db.flush()

    # Run donor matching (in-memory — no DonorMatch table)
    try:
        matches = find_and_rank_donors(db, blood_req)
        if matches:
            blood_req.status = RequestStatus.ACCEPTED  # closest valid status
            matched_donor_ids = [m.donor_id for m in matches[:10]]
            notify_emergency_request(db, blood_req, matched_donor_ids)
    except Exception as exc:
        logger.error(f"Matching error for request {blood_req.id}: {exc}")
        # Leave status as PENDING — don't break request creation

    log_action(
        db, "CREATE_BLOOD_REQUEST",
        user_id=current_user.id, entity="BloodRequest", entity_id=blood_req.id,
        ip_address=request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(blood_req)
    return _request_response(blood_req)


@router.get("/blood-requests/my", response_model=list[BloodRequestResponse])
def get_my_requests(
    current_user: User = Depends(get_patient_user),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        return []
    rows = (
        db.query(BloodRequest)
        .filter(BloodRequest.patient_id == patient.id)
        .order_by(BloodRequest.created_at.desc())
        .all()
    )
    return [_request_response(r) for r in rows]


@router.get("/blood-requests/{request_id}", response_model=BloodRequestResponse)
def get_blood_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Blood request not found.")
    return _request_response(req)


@router.post("/blood-requests/{request_id}/cancel", response_model=BloodRequestResponse)
def cancel_blood_request(
    request_id: str,
    request: Request,
    current_user: User = Depends(get_patient_user),
    db: Session = Depends(get_db),
):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Blood request not found.")

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient or req.patient_id != patient.id:
        raise HTTPException(status_code=403, detail="You can only cancel your own requests.")

    # DB RequestStatus: PENDING ACCEPTED PROCESSING FULFILLED REJECTED CANCELLED
    if req.status == RequestStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Request is already cancelled.")
    if req.status == RequestStatus.FULFILLED:
        raise HTTPException(status_code=400, detail="A fulfilled request cannot be cancelled.")

    req.status = RequestStatus.CANCELLED
    log_action(
        db, "CANCEL_BLOOD_REQUEST",
        user_id=current_user.id, entity="BloodRequest", entity_id=req.id,
        ip_address=request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(req)
    return _request_response(req)


# ---------------------------------------------------------------------------
# Nearby donors
# ---------------------------------------------------------------------------

@router.get("/patients/nearby-donors", response_model=list[DonorPublicResponse])
def get_nearby_donors(
    blood_group: str = None,
    city: str = None,
    current_user: User = Depends(get_patient_user),
    db: Session = Depends(get_db),
):
    """Return available donors, optionally filtered by blood group and city."""
    from ..models.enums import UserStatus

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    search_city = city or (patient.city if patient else None)

    query = (
        db.query(Donor)
        .join(User, Donor.user_id == User.id)
        .filter(
            User.status == UserStatus.ACTIVE,
            Donor.availability_status == True,    # actual DB column
        )
    )
    if blood_group:
        bg = label_to_bg(blood_group)
        if bg:
            query = query.filter(Donor.blood_group == bg)
    if search_city:
        query = query.filter(Donor.city.ilike(f"%{search_city}%"))

    donors = query.limit(20).all()
    return [
        DonorPublicResponse(
            id=d.id,
            blood_group=bg_to_label(d.blood_group) if d.blood_group else None,
            city=d.city,
            availability=d.availability_status,   # map to schema field
            total_donations=0,                     # no such column in DB
            name=d.user.full_name if d.user else None,
            last_donation_date=fmt_date(d.last_donation_date),
            next_eligible_date=None,               # no such column in DB
        )
        for d in donors
    ]
