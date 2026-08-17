"""
Hospital API router.

GET    /api/hospitals/me
PUT    /api/hospitals/me
GET    /api/hospitals/inventory
POST   /api/hospitals/inventory
PUT    /api/hospitals/inventory/{id}
DELETE /api/hospitals/inventory/{id}
GET    /api/hospitals/requests
PUT    /api/hospitals/requests/{id}/approve
PUT    /api/hospitals/requests/{id}/reject
GET    /api/hospitals/appointments
GET    /api/hospitals/analytics

DB columns used (verified):
    Hospital: id, userId, hospitalName, registrationNumber, city, address
    BloodInventory: id, bloodBankId, bloodGroup, unitsAvailable,
                    unitsReserved, expiryDate, updatedAt
                    NOTE: No hospitalId column exists in BloodInventory.
    BloodRequest: id, patientId, hospitalId, bloodGroup, unitsRequired,
                  urgency, status, city, notes, createdAt, updatedAt
"""
import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..core.database import get_db
from ..core.deps import get_hospital_user
from ..models.user import User
from ..models.profiles import Hospital, BloodBank
from ..models.blood import BloodRequest, BloodInventory
from ..models.enums import RequestStatus, BloodGroup
from ..schemas.hospital import (
    HospitalProfileUpdate, HospitalProfileResponse,
    InventoryCreate, InventoryUpdate, InventoryResponse,
    RequestStatusUpdate, AppointmentResponse,
)
from ..schemas.patient import BloodRequestResponse
from ..utils.helpers import label_to_bg, bg_to_label, fmt_datetime, fmt_date
from ..services.audit_service import log_action
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Hospitals"])


# ---------------------------------------------------------------------------
# Response builders
# ---------------------------------------------------------------------------

def _hospital_response(h: Hospital) -> HospitalProfileResponse:
    return HospitalProfileResponse(
        id=h.id,
        user_id=h.user_id,
        hospital_name=h.hospital_name,
        registration_number=h.registration_number,
        address=h.address,
        city=h.city,
        phone=None,                  # no phone column in Hospital table
        verification_status="PENDING",  # no verification_status column
        created_at=fmt_datetime(h.created_at),
    )


def _inventory_response(item: BloodInventory) -> InventoryResponse:
    # expiry_date is a DateTime in the DB (Prisma maps DateTime to timestamp)
    return InventoryResponse(
        id=item.id,
        blood_group=bg_to_label(item.blood_group),
        component_type="Whole Blood",      # no component_type column in DB
        units_available=item.units_available,
        expiry_date=fmt_date(item.expiry_date),
        notes=None,                        # no notes column in BloodInventory
        updated_at=fmt_datetime(item.updated_at) or "",
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
# Hospital profile
# ---------------------------------------------------------------------------

@router.get("/hospitals/me", response_model=HospitalProfileResponse)
def get_hospital_profile(
    current_user: User = Depends(get_hospital_user),
    db: Session = Depends(get_db),
):
    hospital = db.query(Hospital).filter(Hospital.user_id == current_user.id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital profile not found.")
    return _hospital_response(hospital)


@router.put("/hospitals/me", response_model=HospitalProfileResponse)
def update_hospital_profile(
    body: HospitalProfileUpdate,
    current_user: User = Depends(get_hospital_user),
    db: Session = Depends(get_db),
):
    hospital = db.query(Hospital).filter(Hospital.user_id == current_user.id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital profile not found.")

    if body.hospital_name is not None:
        hospital.hospital_name = body.hospital_name.strip()
    if body.address is not None:
        hospital.address = body.address.strip()
    if body.city is not None:
        hospital.city = body.city.strip()
    # phone and verification_status not in DB — silently ignore

    db.commit()
    db.refresh(hospital)
    return _hospital_response(hospital)


# ---------------------------------------------------------------------------
# Inventory
# NOTE: BloodInventory has no hospitalId column.  A hospital's "own"
# inventory is the inventory rows for their associated blood bank
# (if any), or we return an empty list.  Hospitals use this endpoint
# to view inventory linked to their blood bank partner.
# ---------------------------------------------------------------------------

@router.get("/hospitals/inventory", response_model=list[InventoryResponse])
def get_hospital_inventory(
    current_user: User = Depends(get_hospital_user),
    db: Session = Depends(get_db),
):
    """
    BloodInventory has no hospitalId FK — inventory belongs to BloodBanks.
    Returns all inventory rows so the hospital can see available supply.
    """
    items = db.query(BloodInventory).order_by(BloodInventory.blood_group).all()
    return [_inventory_response(i) for i in items]


@router.post("/hospitals/inventory", response_model=InventoryResponse, status_code=201)
def add_hospital_inventory(
    body: InventoryCreate,
    req: Request,
    current_user: User = Depends(get_hospital_user),
    db: Session = Depends(get_db),
):
    """
    Hospitals can add inventory entries on behalf of a blood bank.
    The blood bank must already exist.  A default 'house' blood bank
    is used if the hospital has no linked blood bank in the system.
    """
    bg = label_to_bg(body.blood_group)
    if bg is None:
        raise HTTPException(status_code=400, detail=f"Invalid blood group: {body.blood_group}")

    # Find or use first available blood bank as the owner
    hospital = db.query(Hospital).filter(Hospital.user_id == current_user.id).first()
    # Try to find a blood bank in the same city
    blood_bank = None
    if hospital:
        blood_bank = db.query(BloodBank).filter(
            BloodBank.city.ilike(hospital.city or "")
        ).first()
    if blood_bank is None:
        blood_bank = db.query(BloodBank).first()
    if blood_bank is None:
        raise HTTPException(
            status_code=400,
            detail="No blood bank found. A blood bank must exist before adding inventory.",
        )

    expiry: date | None = body.expiry_date  # already a date from schema

    item = BloodInventory(
        id=str(uuid.uuid4()).replace("-", ""),
        blood_bank_id=blood_bank.id,
        blood_group=bg,
        units_available=body.units_available,
        units_reserved=0,
        expiry_date=expiry,
    )
    db.add(item)
    log_action(
        db, "ADD_INVENTORY",
        user_id=current_user.id, entity="BloodInventory", entity_id=item.id,
        ip_address=req.client.host if req.client else None,
    )
    db.commit()
    db.refresh(item)
    return _inventory_response(item)


@router.put("/hospitals/inventory/{inventory_id}", response_model=InventoryResponse)
def update_hospital_inventory(
    inventory_id: str,
    body: InventoryUpdate,
    req: Request,
    current_user: User = Depends(get_hospital_user),
    db: Session = Depends(get_db),
):
    item = db.query(BloodInventory).filter(BloodInventory.id == inventory_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found.")

    if body.units_available is not None:
        item.units_available = body.units_available
    if body.expiry_date is not None:
        item.expiry_date = body.expiry_date

    log_action(
        db, "UPDATE_INVENTORY",
        user_id=current_user.id, entity="BloodInventory", entity_id=item.id,
        ip_address=req.client.host if req.client else None,
    )
    db.commit()
    db.refresh(item)
    return _inventory_response(item)


@router.delete("/hospitals/inventory/{inventory_id}", status_code=204)
def delete_hospital_inventory(
    inventory_id: str,
    req: Request,
    current_user: User = Depends(get_hospital_user),
    db: Session = Depends(get_db),
):
    item = db.query(BloodInventory).filter(BloodInventory.id == inventory_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found.")
    db.delete(item)
    log_action(
        db, "DELETE_INVENTORY",
        user_id=current_user.id, entity="BloodInventory", entity_id=inventory_id,
        ip_address=req.client.host if req.client else None,
    )
    db.commit()


# ---------------------------------------------------------------------------
# Blood requests
# ---------------------------------------------------------------------------

@router.get("/hospitals/requests", response_model=list[BloodRequestResponse])
def get_hospital_requests(
    current_user: User = Depends(get_hospital_user),
    db: Session = Depends(get_db),
):
    hospital = db.query(Hospital).filter(Hospital.user_id == current_user.id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital profile not found.")
    rows = (
        db.query(BloodRequest)
        .filter(BloodRequest.hospital_id == hospital.id)
        .order_by(BloodRequest.created_at.desc())
        .all()
    )
    return [_request_response(r) for r in rows]


@router.put("/hospitals/requests/{request_id}/approve")
def approve_request(
    request_id: str,
    body: RequestStatusUpdate,
    req: Request,
    current_user: User = Depends(get_hospital_user),
    db: Session = Depends(get_db),
):
    blood_req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not blood_req:
        raise HTTPException(status_code=404, detail="Request not found.")

    blood_req.status = RequestStatus.PROCESSING   # valid DB enum value
    if body.notes:
        existing = blood_req.notes or ""
        blood_req.notes = f"{existing}\n[Hospital]: {body.notes}".strip()

    log_action(
        db, "APPROVE_REQUEST",
        user_id=current_user.id, entity="BloodRequest", entity_id=request_id,
        ip_address=req.client.host if req.client else None,
    )
    db.commit()
    return {"success": True, "message": "Request approved."}


@router.put("/hospitals/requests/{request_id}/reject")
def reject_request(
    request_id: str,
    body: RequestStatusUpdate,
    req: Request,
    current_user: User = Depends(get_hospital_user),
    db: Session = Depends(get_db),
):
    blood_req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not blood_req:
        raise HTTPException(status_code=404, detail="Request not found.")

    blood_req.status = RequestStatus.REJECTED   # valid DB enum value
    log_action(
        db, "REJECT_REQUEST",
        user_id=current_user.id, entity="BloodRequest", entity_id=request_id,
        ip_address=req.client.host if req.client else None,
    )
    db.commit()
    return {"success": True, "message": "Request rejected."}


# ---------------------------------------------------------------------------
# Appointments  (table does not exist — stub endpoint)
# ---------------------------------------------------------------------------

@router.get("/hospitals/appointments", response_model=list[AppointmentResponse])
def get_hospital_appointments(
    current_user: User = Depends(get_hospital_user),
    db: Session = Depends(get_db),
):
    """
    The Appointment table does not exist in the current database.
    Returns an empty list until the table is created via a Prisma migration.
    """
    return []


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

@router.get("/hospitals/analytics")
def get_hospital_analytics(
    current_user: User = Depends(get_hospital_user),
    db: Session = Depends(get_db),
):
    hospital = db.query(Hospital).filter(Hospital.user_id == current_user.id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital profile not found.")

    total = db.query(BloodRequest).filter(BloodRequest.hospital_id == hospital.id).count()
    fulfilled = db.query(BloodRequest).filter(
        BloodRequest.hospital_id == hospital.id,
        BloodRequest.status == RequestStatus.FULFILLED,
    ).count()
    pending = db.query(BloodRequest).filter(
        BloodRequest.hospital_id == hospital.id,
        BloodRequest.status.in_([RequestStatus.PENDING, RequestStatus.ACCEPTED, RequestStatus.PROCESSING]),
    ).count()

    bg_counts = (
        db.query(BloodRequest.blood_group, func.count(BloodRequest.id))
        .filter(BloodRequest.hospital_id == hospital.id)
        .group_by(BloodRequest.blood_group)
        .all()
    )

    return {
        "success": True,
        "data": {
            "total_requests": total,
            "completed_requests": fulfilled,
            "pending_requests": pending,
            "fulfillment_rate": round(fulfilled / total * 100, 1) if total else 0,
            "blood_group_distribution": [
                {"blood_group": bg_to_label(bg), "count": c}
                for bg, c in bg_counts
            ],
        },
    }
