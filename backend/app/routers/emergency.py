"""
Emergency Request API router.

POST /api/emergency-requests
GET  /api/emergency-requests
GET  /api/emergency-requests/my
GET  /api/emergency-requests/{id}
GET  /api/emergency-requests/{id}/matches
PUT  /api/emergency-requests/{id}/status
POST /api/emergency-requests/{id}/cancel

DB Table:
    "EmergencyRequest": id, requesterId, hospitalId, bloodGroup, unitsRequired,
                        city, urgency, status, createdAt, updatedAt
"""
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..core.database import get_db
from ..core.deps import get_current_user
from ..models.user import User
from ..models.profiles import Patient, Hospital, Donor, BloodBank
from ..models.blood import BloodInventory
from ..models.emergency import EmergencyRequest
from ..models.enums import EmergencyStatus, UserRole, UserStatus, BloodGroup
from ..schemas.emergency import (
    EmergencyRequestCreate,
    EmergencyRequestResponse,
    EmergencyRequestDetailResponse,
    EmergencyStatusUpdate,
)
from ..utils.helpers import label_to_bg, bg_to_label, fmt_datetime
from ..utils.blood_compat import get_compatible_donors
from ..services.audit_service import log_action
from ..services.notification_service import create_notification, TYPE_EMERGENCY
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/emergency-requests", tags=["Emergency Requests"])


def _emergency_response(req: EmergencyRequest) -> EmergencyRequestResponse:
    hospital_name = req.hospital.hospital_name if req.hospital else None
    requester_name = (
        req.requester.user.full_name
        if (req.requester and req.requester.user)
        else None
    )
    requester_phone = (
        req.requester.user.phone
        if (req.requester and req.requester.user)
        else None
    )

    return EmergencyRequestResponse(
        id=req.id,
        requester_id=req.requester_id,
        hospital_id=req.hospital_id,
        hospital_name=hospital_name,
        requester_name=requester_name,
        requester_phone=requester_phone,
        blood_group=bg_to_label(req.blood_group),
        units_required=req.units_required,
        city=req.city,
        urgency=req.urgency,
        status=req.status.value,
        created_at=fmt_datetime(req.created_at) or "",
        updated_at=fmt_datetime(req.updated_at) or "",
    )


from ..core.state_machine import validate_emergency_transition
from ..middleware.rate_limit import limiter

@router.post("", response_model=EmergencyRequestResponse, status_code=201)
@limiter.limit("15/minute")
def create_emergency_request(
    request: Request,
    body: EmergencyRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create an urgent emergency blood request.
    Allowed roles: PATIENT, HOSPITAL, ADMIN.
    """
    if current_user.role not in (UserRole.PATIENT, UserRole.HOSPITAL, UserRole.ADMIN):
        raise HTTPException(
            status_code=403,
            detail="Only patients, hospitals, or admins can raise emergency blood requests.",
        )

    bg = label_to_bg(body.blood_group)
    if bg is None:
        raise HTTPException(status_code=400, detail=f"Invalid blood group: {body.blood_group}")

    requester_patient = None
    hospital_id = body.hospital_id

    if current_user.role == UserRole.PATIENT:
        requester_patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not requester_patient:
            raise HTTPException(status_code=404, detail="Patient profile not found.")
    elif current_user.role == UserRole.HOSPITAL:
        h = db.query(Hospital).filter(Hospital.user_id == current_user.id).first()
        if h:
            hospital_id = h.id
        # Find any existing patient or use first patient associated with this request
        requester_patient = db.query(Patient).first()
        if not requester_patient:
            raise HTTPException(status_code=400, detail="No patient profile available to associate with request.")
    elif current_user.role == UserRole.ADMIN:
        requester_patient = db.query(Patient).first()
        if not requester_patient:
            raise HTTPException(status_code=400, detail="No patient profile available to associate with request.")

    valid_urgencies = {"CRITICAL", "URGENT", "Critical", "Urgent", "High", "HIGH"}
    urgency = body.urgency if (body.urgency and body.urgency in valid_urgencies) else "Critical"

    emergency_req = EmergencyRequest(
        id=str(uuid.uuid4()).replace("-", ""),
        requester_id=requester_patient.id,
        hospital_id=hospital_id,
        blood_group=bg,
        units_required=body.units_required,
        city=body.city.strip(),
        urgency=urgency,
        status=EmergencyStatus.ACTIVE,
    )
    db.add(emergency_req)
    db.flush()

    # Find matching donors in the same city with compatible blood group
    compatible_bgs = get_compatible_donors(bg)
    matched_donors = (
        db.query(Donor)
        .join(User, Donor.user_id == User.id)
        .filter(
            Donor.blood_group.in_(compatible_bgs),
            Donor.availability_status == True,
            User.status == UserStatus.ACTIVE,
        )
        .limit(20)
        .all()
    )

    # Notify matched donors
    bg_str = bg_to_label(bg)
    for donor in matched_donors:
        try:
            create_notification(
                db=db,
                user_id=donor.user_id,
                title="🚨 EMERGENCY BLOOD REQUEST",
                message=(
                    f"CRITICAL: {body.units_required} unit(s) of {bg_str} blood required urgently "
                    f"in {emergency_req.city}. Can you donate?"
                ),
                notification_type=TYPE_EMERGENCY,
            )
        except Exception as e:
            logger.error(f"Failed to send emergency notification to donor {donor.id}: {e}")

    log_action(
        db,
        "CREATE_EMERGENCY_REQUEST",
        user_id=current_user.id,
        entity="EmergencyRequest",
        entity_id=emergency_req.id,
        extra={"units": body.units_required, "blood_group": bg_str, "city": emergency_req.city},
        ip_address=request.client.host if request.client else None,
    )

    db.commit()
    db.refresh(emergency_req)
    return _emergency_response(emergency_req)


@router.get("", response_model=List[EmergencyRequestResponse])
def list_emergency_requests(
    status: Optional[str] = None,
    city: Optional[str] = None,
    blood_group: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List emergency requests with optional filters."""
    query = db.query(EmergencyRequest)

    if status:
        try:
            enum_status = EmergencyStatus[status.upper()]
            query = query.filter(EmergencyRequest.status == enum_status)
        except KeyError:
            pass

    if city:
        query = query.filter(EmergencyRequest.city.ilike(f"%{city.strip()}%"))

    if blood_group:
        bg = label_to_bg(blood_group)
        if bg:
            query = query.filter(EmergencyRequest.blood_group == bg)

    rows = query.order_by(desc(EmergencyRequest.created_at)).limit(100).all()
    return [_emergency_response(r) for r in rows]


@router.get("/my", response_model=List[EmergencyRequestResponse])
def get_my_emergency_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List emergency requests created by the current user."""
    if current_user.role == UserRole.PATIENT:
        p = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not p:
            return []
        rows = (
            db.query(EmergencyRequest)
            .filter(EmergencyRequest.requester_id == p.id)
            .order_by(desc(EmergencyRequest.created_at))
            .all()
        )
        return [_emergency_response(r) for r in rows]
    elif current_user.role == UserRole.HOSPITAL:
        h = db.query(Hospital).filter(Hospital.user_id == current_user.id).first()
        if not h:
            return []
        rows = (
            db.query(EmergencyRequest)
            .filter(EmergencyRequest.hospital_id == h.id)
            .order_by(desc(EmergencyRequest.created_at))
            .all()
        )
        return [_emergency_response(r) for r in rows]
    elif current_user.role == UserRole.ADMIN:
        rows = db.query(EmergencyRequest).order_by(desc(EmergencyRequest.created_at)).limit(50).all()
        return [_emergency_response(r) for r in rows]

    return []


@router.get("/{request_id}", response_model=EmergencyRequestResponse)
def get_emergency_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Emergency request not found.")
    return _emergency_response(req)


@router.get("/{request_id}/matches")
def get_emergency_matches(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return matching donors and blood banks with available stock for this emergency request."""
    req = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Emergency request not found.")

    compatible_bgs = get_compatible_donors(req.blood_group)

    # 1. Matching donors in nearby / same city
    donors = (
        db.query(Donor)
        .join(User, Donor.user_id == User.id)
        .filter(
            Donor.blood_group.in_(compatible_bgs),
            Donor.availability_status == True,
            User.status == UserStatus.ACTIVE,
        )
        .limit(30)
        .all()
    )

    donor_matches = []
    for d in donors:
        is_same_city = (d.city or "").lower() == (req.city or "").lower()
        donor_matches.append({
            "type": "DONOR",
            "donor_id": d.id,
            "name": d.user.full_name if d.user else "Anonymous Donor",
            "blood_group": bg_to_label(d.blood_group),
            "city": d.city,
            "same_city": is_same_city,
            "availability": d.availability_status,
            "last_donation_date": fmt_datetime(d.last_donation_date) if d.last_donation_date else None,
            "match_score": 95 if (is_same_city and d.blood_group == req.blood_group) else (85 if is_same_city else 70),
        })

    # Sort donors by match score
    donor_matches.sort(key=lambda x: x["match_score"], reverse=True)

    # 2. Blood banks with available stock
    inventory_items = (
        db.query(BloodInventory)
        .join(BloodBank, BloodInventory.blood_bank_id == BloodBank.id)
        .filter(
            BloodInventory.blood_group.in_(compatible_bgs),
            BloodInventory.units_available > 0,
        )
        .all()
    )

    bank_matches = []
    for item in inventory_items:
        bank_matches.append({
            "type": "BLOOD_BANK",
            "blood_bank_id": item.blood_bank.id,
            "blood_bank_name": item.blood_bank.name,
            "blood_group": bg_to_label(item.blood_group),
            "units_available": item.units_available,
            "city": item.blood_bank.city,
            "same_city": (item.blood_bank.city or "").lower() == (req.city or "").lower(),
        })

    return {
        "emergency_request": _emergency_response(req),
        "compatible_blood_groups": [bg_to_label(b) for b in compatible_bgs],
        "matched_donors": donor_matches,
        "blood_banks_with_stock": bank_matches,
        "total_donors_found": len(donor_matches),
        "total_banks_found": len(bank_matches),
    }


@router.put("/{request_id}/status", response_model=EmergencyRequestResponse)
def update_emergency_status(
    request_id: str,
    body: EmergencyStatusUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update emergency request status (ACTIVE, MATCHED, FULFILLED, CANCELLED, EXPIRED)."""
    req = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Emergency request not found.")

    try:
        new_status = EmergencyStatus[body.status.upper()]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status: {body.status}. Must be one of {[s.value for s in EmergencyStatus]}",
        )

    validate_emergency_transition(req.status, new_status)
    req.status = new_status
    log_action(
        db,
        "UPDATE_EMERGENCY_STATUS",
        user_id=current_user.id,
        entity="EmergencyRequest",
        entity_id=req.id,
        extra={"new_status": new_status.value, "notes": body.notes},
        ip_address=request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(req)
    return _emergency_response(req)


@router.post("/{request_id}/cancel", response_model=EmergencyRequestResponse)
def cancel_emergency_request(
    request_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel an active emergency request with ownership validation."""
    req = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Emergency request not found.")

    # Ownership check: Patients can only cancel their own; Hospitals only their own; Admin can cancel any
    if current_user.role != UserRole.ADMIN:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        hospital = db.query(Hospital).filter(Hospital.user_id == current_user.id).first()
        is_owner = (
            (patient and req.requester_id == patient.id) or
            (hospital and req.hospital_id == hospital.id)
        )
        if not is_owner:
            raise HTTPException(status_code=403, detail="You do not have permission to cancel this emergency request.")

    validate_emergency_transition(req.status, EmergencyStatus.CANCELLED)
    req.status = EmergencyStatus.CANCELLED
    log_action(
        db,
        "CANCEL_EMERGENCY_REQUEST",
        user_id=current_user.id,
        entity="EmergencyRequest",
        entity_id=req.id,
        ip_address=request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(req)
    return _emergency_response(req)
