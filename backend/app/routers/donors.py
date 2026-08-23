"""
Donor API router.

GET  /api/donors/me
PUT  /api/donors/me
PUT  /api/donors/availability
GET  /api/donors/requests
POST /api/donors/requests/{id}/accept
POST /api/donors/requests/{id}/decline
GET  /api/donors/donations
GET  /api/donors/rewards

DB columns used (verified):
    Donor: id, userId, bloodGroup, city, address,
           availabilityStatus, lastDonationDate, createdAt, updatedAt
    Donation: id, donorId, bloodBankId, hospitalId, bloodGroup,
              units, donationDate, status, createdAt
    BloodRequest: id, patientId, hospitalId, bloodGroup,
                  unitsRequired, urgency, status, city, notes
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.deps import get_donor_user
from ..models.user import User
from ..models.profiles import Donor
from ..models.blood import BloodRequest, Donation
from ..models.enums import RequestStatus, UserStatus
from ..schemas.donor import (
    DonorProfileUpdate, DonorProfileResponse,
    AvailabilityUpdate, DonationResponse, RewardResponse,
)
from ..schemas.patient import BloodRequestResponse
from ..utils.helpers import label_to_bg, bg_to_label, fmt_datetime, fmt_date
from ..utils.blood_compat import RED_CELL_COMPATIBILITY
from ..services.audit_service import log_action
from ..services.notification_service import notify_donor_accepted
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Donors"])


# ---------------------------------------------------------------------------
# Response builders
# ---------------------------------------------------------------------------

def _donor_response(donor: Donor) -> DonorProfileResponse:
    return DonorProfileResponse(
        id=donor.id,
        user_id=donor.user_id,
        blood_group=bg_to_label(donor.blood_group) if donor.blood_group else None,
        city=donor.city,
        # Map actual DB column availabilityStatus → schema field availability
        availability=donor.availability_status,
        last_donation_date=fmt_date(donor.last_donation_date),
        next_eligible_date=None,          # no such DB column
        health_status="Unknown",          # no such DB column
        verification_status="PENDING",    # no such DB column
        total_donations=0,                # no such DB column
        reward_points=0,                  # no such DB column
        name=donor.user.full_name if donor.user else None,
        email=donor.user.email if donor.user else None,
        phone=donor.user.phone if donor.user else None,
        created_at=fmt_datetime(donor.created_at),
    )


def _request_response(req: BloodRequest) -> BloodRequestResponse:
    hospital_name = req.hospital.hospital_name if req.hospital else None
    patient_name = req.patient.user.full_name if (req.patient and req.patient.user) else None
    return BloodRequestResponse(
        id=req.id,
        blood_group=bg_to_label(req.blood_group),
        units_required=req.units_required,
        urgency=req.urgency,
        city=req.city,
        status=req.status.value,
        hospital_name=hospital_name,
        patient_name=patient_name,
        medical_notes=req.notes,
        contact_number=None,
        created_at=fmt_datetime(req.created_at) or "",
        updated_at=fmt_datetime(req.updated_at) or "",
    )


# ---------------------------------------------------------------------------
# Donor profile
# ---------------------------------------------------------------------------

@router.get("/donors/me", response_model=DonorProfileResponse)
def get_donor_profile(
    current_user: User = Depends(get_donor_user),
    db: Session = Depends(get_db),
):
    donor = db.query(Donor).filter(Donor.user_id == current_user.id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found.")
    return _donor_response(donor)


@router.put("/donors/me", response_model=DonorProfileResponse)
def update_donor_profile(
    body: DonorProfileUpdate,
    current_user: User = Depends(get_donor_user),
    db: Session = Depends(get_db),
):
    donor = db.query(Donor).filter(Donor.user_id == current_user.id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found.")

    if body.blood_group is not None:
        bg = label_to_bg(body.blood_group)
        if bg is None:
            raise HTTPException(status_code=400, detail=f"Invalid blood group: {body.blood_group}")
        donor.blood_group = bg
    if body.city is not None:
        donor.city = body.city.strip()
    if body.address is not None:
        donor.address = body.address.strip()
    if body.availability is not None:
        donor.availability_status = body.availability   # correct DB column
    # health_status not in DB — silently ignore

    db.commit()
    db.refresh(donor)
    return _donor_response(donor)


@router.put("/donors/availability", response_model=DonorProfileResponse)
def update_availability(
    body: AvailabilityUpdate,
    request: Request,
    current_user: User = Depends(get_donor_user),
    db: Session = Depends(get_db),
):
    donor = db.query(Donor).filter(Donor.user_id == current_user.id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found.")

    donor.availability_status = body.available    # correct DB column name
    log_action(
        db, "UPDATE_AVAILABILITY",
        user_id=current_user.id, entity="Donor", entity_id=donor.id,
        extra={"available": body.available},
        ip_address=request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(donor)
    return _donor_response(donor)


# ---------------------------------------------------------------------------
# Donor's blood request feed
# ---------------------------------------------------------------------------

@router.get("/donors/requests", response_model=list[BloodRequestResponse])
def get_donor_requests(
    current_user: User = Depends(get_donor_user),
    db: Session = Depends(get_db),
):
    """Return open blood requests compatible with this donor's blood group."""
    donor = db.query(Donor).filter(Donor.user_id == current_user.id).first()
    if not donor or not donor.blood_group:
        return []

    # Find all recipient blood groups this donor can donate to
    compatible_recipients = [
        recipient
        for recipient, donors_set in RED_CELL_COMPATIBILITY.items()
        if donor.blood_group in donors_set
    ]

    # Active statuses in the real DB enum: PENDING, ACCEPTED, PROCESSING
    active_statuses = [
        RequestStatus.PENDING,
        RequestStatus.ACCEPTED,
        RequestStatus.PROCESSING,
    ]

    rows = (
        db.query(BloodRequest)
        .filter(
            BloodRequest.status.in_(active_statuses),
            BloodRequest.blood_group.in_(compatible_recipients),
        )
        .order_by(BloodRequest.created_at.desc())
        .limit(50)
        .all()
    )
    return [_request_response(r) for r in rows]


@router.post("/donors/requests/{request_id}/accept")
def accept_request(
    request_id: str,
    req: Request,
    current_user: User = Depends(get_donor_user),
    db: Session = Depends(get_db),
):
    """Donor accepts a blood request — sets status to PROCESSING."""
    donor = db.query(Donor).filter(Donor.user_id == current_user.id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found.")

    blood_req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not blood_req:
        raise HTTPException(status_code=404, detail="Blood request not found.")

    from ..core.state_machine import validate_request_transition
    validate_request_transition(blood_req.status, RequestStatus.PROCESSING)

    # Advance to PROCESSING (the closest valid DB status to "donor accepted")
    blood_req.status = RequestStatus.PROCESSING
    notify_donor_accepted(db, blood_req, donor)
    log_action(
        db, "ACCEPT_REQUEST",
        user_id=current_user.id, entity="BloodRequest", entity_id=request_id,
        ip_address=req.client.host if req.client else None,
    )
    db.commit()
    return {"success": True, "message": "You have accepted this request. Please proceed to the hospital."}


@router.post("/donors/requests/{request_id}/decline")
def decline_request(
    request_id: str,
    req: Request,
    current_user: User = Depends(get_donor_user),
    db: Session = Depends(get_db),
):
    """Donor declines a blood request."""
    donor = db.query(Donor).filter(Donor.user_id == current_user.id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found.")

    blood_req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not blood_req:
        raise HTTPException(status_code=404, detail="Blood request not found.")

    # No DonorMatch table — just log the decline
    log_action(
        db, "DECLINE_REQUEST",
        user_id=current_user.id, entity="BloodRequest", entity_id=request_id,
        ip_address=req.client.host if req.client else None,
    )
    db.commit()
    return {"success": True, "message": "You have declined this request."}


# ---------------------------------------------------------------------------
# Donation history
# ---------------------------------------------------------------------------

@router.get("/donors/donations", response_model=list[DonationResponse])
def get_donor_donations(
    current_user: User = Depends(get_donor_user),
    db: Session = Depends(get_db),
):
    donor = db.query(Donor).filter(Donor.user_id == current_user.id).first()
    if not donor:
        return []

    rows = (
        db.query(Donation)
        .filter(Donation.donor_id == donor.id)
        .order_by(Donation.donation_date.desc())
        .all()
    )
    return [
        DonationResponse(
            id=d.id,
            blood_group=bg_to_label(d.blood_group),
            units=d.units,
            component_type="Whole Blood",        # no component_type column in DB
            donation_date=fmt_date(d.donation_date) or "",
            status=d.status,                     # VARCHAR — use as-is
            hospital_name=d.hospital.hospital_name if d.hospital else None,
            blood_bank_name=d.blood_bank.name if d.blood_bank else None,  # DB col is 'name'
            notes=None,                          # no notes column in Donation
            created_at=fmt_datetime(d.created_at) or "",
        )
        for d in rows
    ]


# ---------------------------------------------------------------------------
# Rewards  (no rewards table in DB — return stub response)
# ---------------------------------------------------------------------------

@router.get("/donors/rewards")
def get_donor_rewards(
    current_user: User = Depends(get_donor_user),
    db: Session = Depends(get_db),
):
    """
    Rewards table does not exist in the current database.
    Returns a stub response with zero points.
    Implement when the rewards table has been added via a Prisma migration.
    """
    donor = db.query(Donor).filter(Donor.user_id == current_user.id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found.")

    return {
        "success": True,
        "data": {
            "points": 0,
            "level": "Bronze",
            "transactions": [],
            "_note": "Rewards table not yet available in the database.",
        },
    }
