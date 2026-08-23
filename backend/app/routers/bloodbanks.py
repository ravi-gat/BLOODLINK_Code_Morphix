"""
Blood Bank API router.

GET    /api/bloodbanks/me
PUT    /api/bloodbanks/me
GET    /api/bloodbanks/inventory
POST   /api/bloodbanks/inventory
PUT    /api/bloodbanks/inventory/{id}
DELETE /api/bloodbanks/inventory/{id}
GET    /api/bloodbanks/requests
PUT    /api/bloodbanks/requests/{id}/approve
GET    /api/bloodbanks/reports

DB columns used (verified):
    BloodBank: id, userId, name, registrationNumber, city, address
               NOTE: no phone, no verification_status column
    BloodInventory: id, bloodBankId, bloodGroup, unitsAvailable,
                    unitsReserved, expiryDate, updatedAt
                    NOTE: no component_type, no notes column
"""
import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.deps import get_blood_bank_user
from ..models.user import User
from ..models.profiles import BloodBank, Donor
from ..models.blood import BloodRequest, BloodInventory, Donation
from ..models.enums import RequestStatus
from ..schemas.bloodbank import (
    BloodBankProfileUpdate, BloodBankProfileResponse,
    BBInventoryCreate, BBInventoryUpdate, BBInventoryResponse,
)
from ..schemas.patient import BloodRequestResponse
from ..schemas.donor import DonationCreate, DonationResponse
from ..utils.helpers import label_to_bg, bg_to_label, fmt_datetime, fmt_date
from ..services.audit_service import log_action
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Blood Banks"])


# ---------------------------------------------------------------------------
# Response builders
# ---------------------------------------------------------------------------

def _bank_response(b: BloodBank) -> BloodBankProfileResponse:
    return BloodBankProfileResponse(
        id=b.id,
        user_id=b.user_id,
        bank_name=b.name,              # DB column is 'name', not 'bank_name'
        registration_number=b.registration_number,
        address=b.address,
        city=b.city,
        phone=None,                    # no phone column in BloodBank table
        verification_status="PENDING", # no verification_status column
        created_at=fmt_datetime(b.created_at),
    )


def _inventory_response(item: BloodInventory) -> BBInventoryResponse:
    return BBInventoryResponse(
        id=item.id,
        blood_group=bg_to_label(item.blood_group),
        component_type="Whole Blood",   # no component_type column in DB
        units_available=item.units_available,
        expiry_date=fmt_date(item.expiry_date),
        notes=None,                     # no notes column in BloodInventory
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
# Blood Bank profile
# ---------------------------------------------------------------------------

@router.get("/bloodbanks/me", response_model=BloodBankProfileResponse)
def get_blood_bank_profile(
    current_user: User = Depends(get_blood_bank_user),
    db: Session = Depends(get_db),
):
    bank = db.query(BloodBank).filter(BloodBank.user_id == current_user.id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Blood bank profile not found.")
    return _bank_response(bank)


@router.put("/bloodbanks/me", response_model=BloodBankProfileResponse)
def update_blood_bank_profile(
    body: BloodBankProfileUpdate,
    current_user: User = Depends(get_blood_bank_user),
    db: Session = Depends(get_db),
):
    bank = db.query(BloodBank).filter(BloodBank.user_id == current_user.id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Blood bank profile not found.")

    if body.bank_name is not None:
        bank.name = body.bank_name.strip()   # DB column is 'name'
    if body.address is not None:
        bank.address = body.address.strip()
    if body.city is not None:
        bank.city = body.city.strip()
    # phone not in DB — silently ignore

    db.commit()
    db.refresh(bank)
    return _bank_response(bank)


# ---------------------------------------------------------------------------
# Inventory
# ---------------------------------------------------------------------------

@router.get("/bloodbanks/inventory", response_model=list[BBInventoryResponse])
def get_inventory(
    current_user: User = Depends(get_blood_bank_user),
    db: Session = Depends(get_db),
):
    bank = db.query(BloodBank).filter(BloodBank.user_id == current_user.id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Blood bank profile not found.")
    items = db.query(BloodInventory).filter(BloodInventory.blood_bank_id == bank.id).all()
    return [_inventory_response(i) for i in items]


@router.post("/bloodbanks/inventory", response_model=BBInventoryResponse, status_code=201)
def add_inventory(
    body: BBInventoryCreate,
    req: Request,
    current_user: User = Depends(get_blood_bank_user),
    db: Session = Depends(get_db),
):
    bank = db.query(BloodBank).filter(BloodBank.user_id == current_user.id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Blood bank profile not found.")

    bg = label_to_bg(body.blood_group)
    if bg is None:
        raise HTTPException(status_code=400, detail=f"Invalid blood group: {body.blood_group}")

    # expiryDate is NOT NULL in the DB — require a value
    if body.expiry_date is None:
        raise HTTPException(status_code=400, detail="expiry_date is required.")

    if body.units_available < 0:
        raise HTTPException(status_code=400, detail="Units available cannot be negative.")

    item = BloodInventory(
        id=str(uuid.uuid4()).replace("-", ""),
        blood_bank_id=bank.id,
        blood_group=bg,
        units_available=body.units_available,
        units_reserved=0,
        expiry_date=body.expiry_date,
    )
    db.add(item)
    log_action(
        db, "ADD_BB_INVENTORY",
        user_id=current_user.id, entity="BloodInventory", entity_id=item.id,
        ip_address=req.client.host if req.client else None,
    )
    db.commit()
    db.refresh(item)
    return _inventory_response(item)


@router.put("/bloodbanks/inventory/{inventory_id}", response_model=BBInventoryResponse)
def update_inventory(
    inventory_id: str,
    body: BBInventoryUpdate,
    req: Request,
    current_user: User = Depends(get_blood_bank_user),
    db: Session = Depends(get_db),
):
    bank = db.query(BloodBank).filter(BloodBank.user_id == current_user.id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Blood bank profile not found.")

    item = db.query(BloodInventory).filter(
        BloodInventory.id == inventory_id,
        BloodInventory.blood_bank_id == bank.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found.")

    if body.units_available is not None:
        if body.units_available < 0:
            raise HTTPException(status_code=400, detail="Units cannot be negative.")
        item.units_available = body.units_available
    if body.expiry_date is not None:
        item.expiry_date = body.expiry_date

    log_action(
        db, "UPDATE_BB_INVENTORY",
        user_id=current_user.id, entity="BloodInventory", entity_id=item.id,
        ip_address=req.client.host if req.client else None,
    )
    db.commit()
    db.refresh(item)
    return _inventory_response(item)


@router.delete("/bloodbanks/inventory/{inventory_id}", status_code=204)
def delete_inventory(
    inventory_id: str,
    req: Request,
    current_user: User = Depends(get_blood_bank_user),
    db: Session = Depends(get_db),
):
    bank = db.query(BloodBank).filter(BloodBank.user_id == current_user.id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Blood bank profile not found.")

    item = db.query(BloodInventory).filter(
        BloodInventory.id == inventory_id,
        BloodInventory.blood_bank_id == bank.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found.")

    db.delete(item)
    log_action(
        db, "DELETE_BB_INVENTORY",
        user_id=current_user.id, entity="BloodInventory", entity_id=inventory_id,
        ip_address=req.client.host if req.client else None,
    )
    db.commit()


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------

@router.get("/bloodbanks/requests", response_model=list[BloodRequestResponse])
def get_blood_requests(
    current_user: User = Depends(get_blood_bank_user),
    db: Session = Depends(get_db),
):
    active_statuses = [
        RequestStatus.PENDING,
        RequestStatus.ACCEPTED,
        RequestStatus.PROCESSING,
    ]
    rows = (
        db.query(BloodRequest)
        .filter(BloodRequest.status.in_(active_statuses))
        .order_by(BloodRequest.created_at.desc())
        .limit(50)
        .all()
    )
    return [_request_response(r) for r in rows]


@router.put("/bloodbanks/requests/{request_id}/approve")
def approve_request(
    request_id: str,
    req: Request,
    current_user: User = Depends(get_blood_bank_user),
    db: Session = Depends(get_db),
):
    blood_req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not blood_req:
        raise HTTPException(status_code=404, detail="Request not found.")

    blood_req.status = RequestStatus.PROCESSING   # valid DB status
    log_action(
        db, "BB_APPROVE_REQUEST",
        user_id=current_user.id, entity="BloodRequest", entity_id=request_id,
        ip_address=req.client.host if req.client else None,
    )
    db.commit()
    return {"success": True, "message": "Request approved."}


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

@router.get("/bloodbanks/reports")
def get_reports(
    current_user: User = Depends(get_blood_bank_user),
    db: Session = Depends(get_db),
):
    bank = db.query(BloodBank).filter(BloodBank.user_id == current_user.id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Blood bank profile not found.")

    inventory = (
        db.query(BloodInventory)
        .filter(BloodInventory.blood_bank_id == bank.id)
        .all()
    )
    total_units = sum(i.units_available for i in inventory)
    today = date.today()

    # expiry_date is a DateTime in the DB — convert to date for comparison
    def to_date(val):
        return val.date() if hasattr(val, "date") else val

    expiring_soon = [
        i for i in inventory
        if i.expiry_date and (to_date(i.expiry_date) - today).days <= 7
    ]
    expired = [
        i for i in inventory
        if i.expiry_date and to_date(i.expiry_date) < today
    ]

    return {
        "success": True,
        "data": {
            "total_units": total_units,
            "inventory_by_type": [
                {
                    "blood_group": bg_to_label(i.blood_group),
                    "units": i.units_available,
                    "expiry_date": fmt_date(i.expiry_date),
                }
                for i in inventory
            ],
            "expiring_soon_count": len(expiring_soon),
            "expired_count": len(expired),
            "expiring_items": [
                {
                    "id": i.id,
                    "blood_group": bg_to_label(i.blood_group),
                    "units": i.units_available,
                    "expiry_date": fmt_date(i.expiry_date),
                }
                for i in expiring_soon
            ],
        },
    }


# ---------------------------------------------------------------------------
# Donations
# ---------------------------------------------------------------------------

@router.get("/bloodbanks/donations", response_model=list[DonationResponse])
def get_blood_bank_donations(
    current_user: User = Depends(get_blood_bank_user),
    db: Session = Depends(get_db),
):
    bank = db.query(BloodBank).filter(BloodBank.user_id == current_user.id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Blood bank profile not found.")

    donations = (
        db.query(Donation)
        .filter(Donation.blood_bank_id == bank.id)
        .order_by(Donation.donation_date.desc())
        .all()
    )
    return [
        DonationResponse(
            id=d.id,
            blood_group=bg_to_label(d.blood_group),
            units=d.units,
            component_type="Whole Blood",
            donation_date=fmt_date(d.donation_date) or "",
            status=d.status,
            hospital_name=None,
            blood_bank_name=bank.name,
            notes=None,
            created_at=fmt_datetime(d.created_at) or "",
        )
        for d in donations
    ]


@router.post("/bloodbanks/donations", response_model=DonationResponse, status_code=201)
def record_blood_bank_donation(
    body: DonationCreate,
    req: Request,
    current_user: User = Depends(get_blood_bank_user),
    db: Session = Depends(get_db),
):
    bank = db.query(BloodBank).filter(BloodBank.user_id == current_user.id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Blood bank profile not found.")

    donor = db.query(Donor).filter(Donor.id == body.donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found.")

    bg = label_to_bg(body.blood_group)
    if not bg:
        raise HTTPException(status_code=400, detail="Invalid blood group.")

    donation = Donation(
        id=str(uuid.uuid4()).replace("-", ""),
        donor_id=donor.id,
        blood_bank_id=bank.id,
        hospital_id=None,
        blood_group=bg,
        units=body.units,
        status=body.status or "COMPLETED",
    )
    db.add(donation)
    db.flush()

    # Update donor last donation date
    donor.last_donation_date = donation.donation_date

    log_action(
        db,
        "RECORD_DONATION",
        user_id=current_user.id,
        entity="Donation",
        entity_id=donation.id,
        extra={"units": body.units, "donor_id": donor.id},
        ip_address=req.client.host if req.client else None,
    )
    db.commit()
    db.refresh(donation)

    return DonationResponse(
        id=donation.id,
        blood_group=bg_to_label(donation.blood_group),
        units=donation.units,
        component_type="Whole Blood",
        donation_date=fmt_date(donation.donation_date) or "",
        status=donation.status,
        hospital_name=None,
        blood_bank_name=bank.name,
        notes=None,
        created_at=fmt_datetime(donation.created_at) or "",
    )
