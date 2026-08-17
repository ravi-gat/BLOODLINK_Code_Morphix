"""
Admin API router.

All endpoints require ADMIN role — enforced via FastAPI dependency.

GET  /api/admin/dashboard
GET  /api/admin/users
GET  /api/admin/donors
GET  /api/admin/hospitals
GET  /api/admin/bloodbanks
GET  /api/admin/requests
PUT  /api/admin/users/{id}/activate
PUT  /api/admin/users/{id}/deactivate
PUT  /api/admin/hospitals/{id}/verify   (stub — no DB column for this)
PUT  /api/admin/bloodbanks/{id}/verify  (stub — no DB column for this)
GET  /api/admin/analytics
GET  /api/admin/audit-logs

DB columns verified:
    User: id, name, email, passwordHash, phone, role, status, createdAt, updatedAt
    Donor: id, userId, bloodGroup, city, availabilityStatus (NOT availability/total_donations)
    Hospital: id, userId, hospitalName, registrationNumber, city, address (NO phone/verification_status)
    BloodBank: id, userId, name, registrationNumber, city, address (NO phone/verification_status)
    BloodInventory: id, bloodBankId, bloodGroup, unitsAvailable
    AuditLog: id, userId, action, entity, entityId, metadata, createdAt (NO ip_address column)
    RequestStatus DB values: PENDING, ACCEPTED, PROCESSING, FULFILLED, REJECTED, CANCELLED
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..core.database import get_db
from ..core.deps import get_admin_user
from ..models.user import User
from ..models.profiles import Donor, Hospital, BloodBank, Patient
from ..models.blood import BloodRequest, BloodInventory
from ..models.notifications import AuditLog
from ..models.enums import UserStatus, RequestStatus
from ..schemas.admin import AdminUserResponse, UserStatusUpdate, VerifyEntityRequest
from ..schemas.patient import BloodRequestResponse
from ..utils.helpers import role_to_frontend, bg_to_label, fmt_datetime
from ..services.audit_service import log_action
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])


# ---------------------------------------------------------------------------
# Response helpers
# ---------------------------------------------------------------------------

def _user_response(user: User) -> AdminUserResponse:
    city = None
    blood_group = None
    if user.role.value == "PATIENT" and user.patient_profile:
        city = user.patient_profile.city
        blood_group = (
            bg_to_label(user.patient_profile.blood_group)
            if user.patient_profile.blood_group else None
        )
    elif user.role.value == "DONOR" and user.donor_profile:
        city = user.donor_profile.city
        blood_group = (
            bg_to_label(user.donor_profile.blood_group)
            if user.donor_profile.blood_group else None
        )
    elif user.role.value == "HOSPITAL" and user.hospital_profile:
        city = user.hospital_profile.city
    elif user.role.value == "BLOOD_BANK" and user.blood_bank_profile:
        city = user.blood_bank_profile.city

    return AdminUserResponse(
        id=user.id,
        name=user.full_name,
        email=user.email,
        phone=user.phone,
        role=role_to_frontend(user.role),
        status=user.status.value,
        is_verified=False,          # no is_verified column in User table
        city=city,
        blood_group=blood_group,
        created_at=fmt_datetime(user.created_at) or "",
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
# Dashboard
# ---------------------------------------------------------------------------

@router.get("/dashboard")
def get_admin_dashboard(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    total_users    = db.query(User).count()
    total_donors   = db.query(Donor).count()
    # DB column is availabilityStatus — NOT 'availability'
    active_donors  = db.query(Donor).filter(Donor.availability_status == True).count()
    total_hospitals = db.query(Hospital).count()
    total_blood_banks = db.query(BloodBank).count()

    # Active = PENDING or ACCEPTED or PROCESSING (valid DB enum values)
    active_requests = db.query(BloodRequest).filter(
        BloodRequest.status.in_([
            RequestStatus.PENDING,
            RequestStatus.ACCEPTED,
            RequestStatus.PROCESSING,
        ])
    ).count()
    fulfilled_requests = db.query(BloodRequest).filter(
        BloodRequest.status == RequestStatus.FULFILLED
    ).count()
    total_units = db.query(func.sum(BloodInventory.units_available)).scalar() or 0

    return {
        "success": True,
        "data": {
            "total_users":       total_users,
            "total_donors":      total_donors,
            "active_donors":     active_donors,
            "total_hospitals":   total_hospitals,
            "total_blood_banks": total_blood_banks,
            "active_requests":   active_requests,
            "completed_requests": fulfilled_requests,
            "total_blood_units": int(total_units),
            "pending_verifications": 0,   # no verification_status column in DB
        },
    }


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@router.get("/users", response_model=list[AdminUserResponse])
def list_users(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.created_at.desc()).limit(200).all()
    return [_user_response(u) for u in users]


# ---------------------------------------------------------------------------
# Donors
# ---------------------------------------------------------------------------

@router.get("/donors")
def list_donors(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    donors = db.query(Donor).join(User, Donor.user_id == User.id).limit(200).all()
    return {
        "success": True,
        "data": [
            {
                "id": d.id,
                "name": d.user.full_name,
                "email": d.user.email,
                "blood_group": bg_to_label(d.blood_group) if d.blood_group else None,
                "city": d.city,
                "availability": d.availability_status,    # correct DB column
                "total_donations": 0,                      # no such DB column
                "verification_status": "PENDING",          # no such DB column
                "status": d.user.status.value,
                "created_at": fmt_datetime(d.created_at),
            }
            for d in donors
        ],
    }


# ---------------------------------------------------------------------------
# Hospitals
# ---------------------------------------------------------------------------

@router.get("/hospitals")
def list_hospitals(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    hospitals = db.query(Hospital).join(User, Hospital.user_id == User.id).limit(200).all()
    return {
        "success": True,
        "data": [
            {
                "id": h.id,
                "name": h.hospital_name,
                "email": h.user.email,
                "city": h.city,
                "phone": None,                  # no phone column
                "verification_status": "PENDING",  # no such column
                "user_status": h.user.status.value,
                "registration_number": h.registration_number,
                "created_at": fmt_datetime(h.created_at),
            }
            for h in hospitals
        ],
    }


# ---------------------------------------------------------------------------
# Blood Banks
# ---------------------------------------------------------------------------

@router.get("/bloodbanks")
def list_blood_banks(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    banks = db.query(BloodBank).join(User, BloodBank.user_id == User.id).limit(200).all()
    return {
        "success": True,
        "data": [
            {
                "id": b.id,
                "name": b.name,                  # DB column is 'name'
                "email": b.user.email,
                "city": b.city,
                "phone": None,                   # no phone column
                "verification_status": "PENDING", # no such column
                "user_status": b.user.status.value,
                "registration_number": b.registration_number,
                "created_at": fmt_datetime(b.created_at),
            }
            for b in banks
        ],
    }


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------

@router.get("/requests", response_model=list[BloodRequestResponse])
def list_requests(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(BloodRequest)
        .order_by(BloodRequest.created_at.desc())
        .limit(200)
        .all()
    )
    return [_request_response(r) for r in rows]


# ---------------------------------------------------------------------------
# User management
# ---------------------------------------------------------------------------

@router.put("/users/{user_id}/activate")
def activate_user(
    user_id: str,
    req: Request,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.status = UserStatus.ACTIVE
    log_action(
        db, "ACTIVATE_USER",
        user_id=current_user.id, entity="User", entity_id=user_id,
        ip_address=req.client.host if req.client else None,
    )
    db.commit()
    return {"success": True, "message": "User account activated."}


@router.put("/users/{user_id}/deactivate")
def deactivate_user(
    user_id: str,
    req: Request,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account.")
    user.status = UserStatus.SUSPENDED
    log_action(
        db, "DEACTIVATE_USER",
        user_id=current_user.id, entity="User", entity_id=user_id,
        ip_address=req.client.host if req.client else None,
    )
    db.commit()
    return {"success": True, "message": "User account deactivated."}


# ---------------------------------------------------------------------------
# Verification endpoints (stub — no verification_status column in DB)
# ---------------------------------------------------------------------------

@router.put("/hospitals/{hospital_id}/verify")
def verify_hospital(
    hospital_id: str,
    body: VerifyEntityRequest,
    req: Request,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Verification status is not stored in the current DB schema.
    Logs the action and returns success.  Implement after adding
    a verification_status column via Prisma migration.
    """
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found.")
    log_action(
        db, "VERIFY_HOSPITAL",
        user_id=current_user.id, entity="Hospital", entity_id=hospital_id,
        ip_address=req.client.host if req.client else None,
        extra={"verified": body.verified},
    )
    db.commit()
    action = "verified" if body.verified else "rejected"
    return {"success": True, "message": f"Hospital {action} (logged only — DB schema pending migration)."}


@router.put("/bloodbanks/{bank_id}/verify")
def verify_blood_bank(
    bank_id: str,
    body: VerifyEntityRequest,
    req: Request,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    bank = db.query(BloodBank).filter(BloodBank.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Blood bank not found.")
    log_action(
        db, "VERIFY_BLOOD_BANK",
        user_id=current_user.id, entity="BloodBank", entity_id=bank_id,
        ip_address=req.client.host if req.client else None,
        extra={"verified": body.verified},
    )
    db.commit()
    action = "verified" if body.verified else "rejected"
    return {"success": True, "message": f"Blood bank {action} (logged only — DB schema pending migration)."}


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

@router.get("/analytics")
def get_admin_analytics(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    status_counts = (
        db.query(BloodRequest.status, func.count(BloodRequest.id))
        .group_by(BloodRequest.status)
        .all()
    )
    bg_counts = (
        db.query(Donor.blood_group, func.count(Donor.id))
        .group_by(Donor.blood_group)
        .all()
    )
    role_counts = (
        db.query(User.role, func.count(User.id))
        .group_by(User.role)
        .all()
    )
    city_counts = (
        db.query(Donor.city, func.count(Donor.id))
        .filter(Donor.city.isnot(None))
        .group_by(Donor.city)
        .order_by(func.count(Donor.id).desc())
        .limit(10)
        .all()
    )

    return {
        "success": True,
        "data": {
            "requests_by_status": [
                {"status": s.value, "count": c} for s, c in status_counts
            ],
            "blood_type_distribution": [
                {"blood_group": bg_to_label(bg), "count": c}
                for bg, c in bg_counts if bg
            ],
            "users_by_role": [
                {"role": role_to_frontend(r), "count": c} for r, c in role_counts
            ],
            "top_cities": [
                {"city": city, "donor_count": count}
                for city, count in city_counts if city
            ],
        },
    }


# ---------------------------------------------------------------------------
# Audit logs
# ---------------------------------------------------------------------------

@router.get("/audit-logs")
def get_audit_logs(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(200)
        .all()
    )
    return {
        "success": True,
        "data": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "entity": log.entity,
                "entity_id": log.entity_id,
                # ip_address not a column — read from metadata_ JSON if present
                "ip_address": (log.metadata_ or {}).get("ip") if log.metadata_ else None,
                "created_at": fmt_datetime(log.created_at),
            }
            for log in logs
        ],
    }
