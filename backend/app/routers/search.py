"""
Global Search API router for BloodLink.

Provides unified, RBAC-aware search across:
- Blood types & clinical compatibility (with real inventory/donor counts)
- Facilities (Hospitals and Blood Banks)
- Blood & Emergency requests (role-filtered)
- Donors (privacy-preserved)
- Quick navigation actions

GET /api/search/global?q=...&category=...
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from ..core.database import get_db
from ..core.deps import get_current_user
from ..middleware.rate_limit import limiter
from ..models.user import User
from ..models.profiles import Hospital, BloodBank, Donor, Patient
from ..models.blood import BloodRequest, BloodInventory
from ..models.emergency import EmergencyRequest
from ..models.enums import UserRole, RequestStatus, EmergencyStatus, BloodGroup, UserStatus
from ..utils.helpers import bg_to_label, label_to_bg, fmt_datetime
from ..utils.blood_compat import (
    CAN_DONATE_TO_STR,
    CAN_RECEIVE_FROM_STR,
    UNIVERSAL_DONORS,
    UNIVERSAL_RECIPIENTS,
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/search", tags=["Global Search"])

BLOOD_GROUP_SYNONYMS: Dict[str, str] = {
    "o+": "O+",
    "o positive": "O+",
    "opositive": "O+",
    "o-": "O-",
    "o negative": "O-",
    "onegative": "O-",
    "a+": "A+",
    "a positive": "A+",
    "apositive": "A+",
    "a-": "A-",
    "a negative": "A-",
    "anegative": "A-",
    "b+": "B+",
    "b positive": "B+",
    "bpositive": "B+",
    "b-": "B-",
    "b negative": "B-",
    "bnegative": "B-",
    "ab+": "AB+",
    "ab positive": "AB+",
    "abpositive": "AB+",
    "ab-": "AB-",
    "ab negative": "AB-",
    "abnegative": "AB-",
}


@router.get("/global")
@limiter.limit("60/minute")
def global_search(
    request: Request,
    q: str = Query(..., min_length=1, max_length=100, description="Search term"),
    category: Optional[str] = Query(None, description="Filter category: all, blood_group, facilities, requests, donors"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raw_q = q.strip()
    query_str = raw_q.lower()
    
    results: Dict[str, Any] = {
        "query": raw_q,
        "blood_group": None,
        "facilities": [],
        "requests": [],
        "donors": [],
        "quick_actions": [],
    }

    # 1. Blood Group Match
    valid_bgs = {"O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"}
    matched_bg = None
    
    # Handle direct match or URL-decoded '+' (which becomes trailing space)
    upper_q = raw_q.upper()
    if upper_q in valid_bgs:
        matched_bg = upper_q
    elif q.endswith(" ") and upper_q in {"O", "A", "B", "AB"}:
        matched_bg = f"{upper_q}+"
    elif query_str in BLOOD_GROUP_SYNONYMS:
        matched_bg = BLOOD_GROUP_SYNONYMS[query_str]
    else:
        # Check synonyms
        for syn, label in BLOOD_GROUP_SYNONYMS.items():
            if syn == query_str or syn == query_str.replace(" ", ""):
                matched_bg = label
                break

    if matched_bg:
        bg_enum = label_to_bg(matched_bg)
        # Count available donors with this blood group
        donor_count = (
            db.query(Donor)
            .join(User, Donor.user_id == User.id)
            .filter(
                Donor.blood_group == bg_enum,
                Donor.availability_status == True,
                User.status == UserStatus.ACTIVE,
            )
            .count()
        )
        # Count inventory units
        units_count = (
            db.query(func.sum(BloodInventory.units_available))
            .filter(BloodInventory.blood_group == bg_enum)
            .scalar() or 0
        )

        results["blood_group"] = {
            "blood_group": matched_bg,
            "can_donate_to": CAN_DONATE_TO_STR.get(matched_bg, []),
            "can_receive_from": CAN_RECEIVE_FROM_STR.get(matched_bg, []),
            "is_universal_donor": matched_bg in UNIVERSAL_DONORS,
            "is_universal_recipient": matched_bg in UNIVERSAL_RECIPIENTS,
            "available_donors_count": donor_count,
            "available_units_count": int(units_count),
        }

    # 2. Facilities Match (Hospitals & Blood Banks)
    if not category or category in ("all", "facilities"):
        term = f"%{query_str}%"
        hospitals = (
            db.query(Hospital)
            .filter(
                or_(
                    Hospital.hospital_name.ilike(term),
                    Hospital.city.ilike(term),
                    Hospital.address.ilike(term),
                    Hospital.registration_number.ilike(term),
                )
            )
            .limit(10)
            .all()
        )

        for h in hospitals:
            results["facilities"].append({
                "id": h.id,
                "type": "HOSPITAL",
                "name": h.hospital_name,
                "city": h.city,
                "address": h.address,
                "registration_number": h.registration_number,
            })

        bloodbanks = (
            db.query(BloodBank)
            .filter(
                or_(
                    BloodBank.name.ilike(term),
                    BloodBank.city.ilike(term),
                    BloodBank.address.ilike(term),
                    BloodBank.registration_number.ilike(term),
                )
            )
            .limit(10)
            .all()
        )

        for b in bloodbanks:
            total_units = (
                db.query(func.sum(BloodInventory.units_available))
                .filter(BloodInventory.blood_bank_id == b.id)
                .scalar() or 0
            )
            results["facilities"].append({
                "id": b.id,
                "type": "BLOOD_BANK",
                "name": b.name,
                "city": b.city,
                "address": b.address,
                "registration_number": b.registration_number,
                "total_units": int(total_units),
            })

    # 3. Requests Match with RBAC
    if not category or category in ("all", "requests"):
        term = f"%{query_str}%"
        req_query = db.query(BloodRequest)

        # RBAC filters
        if current_user.role == UserRole.PATIENT:
            patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
            if patient:
                req_query = req_query.filter(
                    or_(
                        BloodRequest.patient_id == patient.id,
                        BloodRequest.status.in_([RequestStatus.PENDING, RequestStatus.ACCEPTED]),
                    )
                )
        elif current_user.role == UserRole.HOSPITAL:
            hospital = db.query(Hospital).filter(Hospital.user_id == current_user.id).first()
            if hospital:
                req_query = req_query.filter(
                    or_(
                        BloodRequest.hospital_id == hospital.id,
                        BloodRequest.status.in_([RequestStatus.PENDING, RequestStatus.ACCEPTED]),
                    )
                )
        elif current_user.role == UserRole.DONOR:
            donor = db.query(Donor).filter(Donor.user_id == current_user.id).first()
            if donor and donor.blood_group:
                donor_bg_label = bg_to_label(donor.blood_group)
                compatible_recipients = CAN_DONATE_TO_STR.get(donor_bg_label, [donor_bg_label])
                compatible_enums = [label_to_bg(bg) for bg in compatible_recipients if label_to_bg(bg)]
                req_query = req_query.filter(
                    BloodRequest.blood_group.in_(compatible_enums),
                    BloodRequest.status.in_([RequestStatus.PENDING, RequestStatus.ACCEPTED]),
                )

        # Filter by search string (city, notes, id, blood group)
        req_query = req_query.filter(
            or_(
                BloodRequest.city.ilike(term),
                BloodRequest.notes.ilike(term),
                BloodRequest.id.ilike(term),
            )
        ).limit(10)

        for r in req_query.all():
            results["requests"].append({
                "id": r.id,
                "blood_group": bg_to_label(r.blood_group),
                "units_required": r.units_required,
                "urgency": r.urgency,
                "city": r.city,
                "status": r.status.value,
                "hospital_name": r.hospital.hospital_name if r.hospital else None,
                "created_at": fmt_datetime(r.created_at),
            })

    # 4. Donors Match (Privacy Preserving - only for Patient, Hospital, Blood Bank, Admin)
    if current_user.role in (UserRole.PATIENT, UserRole.HOSPITAL, UserRole.BLOOD_BANK, UserRole.ADMIN):
        if not category or category in ("all", "donors"):
            term = f"%{query_str}%"
            donors = (
                db.query(Donor)
                .join(User, Donor.user_id == User.id)
                .filter(
                    User.status == UserStatus.ACTIVE,
                    or_(
                        Donor.city.ilike(term),
                        User.full_name.ilike(term),
                    ),
                )
                .limit(10)
                .all()
            )
            for d in donors:
                results["donors"].append({
                    "id": d.id,
                    "name": d.user.full_name if d.user else "Donor",
                    "city": d.city,
                    "blood_group": bg_to_label(d.blood_group) if d.blood_group else None,
                    "availability": d.availability_status,
                })

    # 5. Quick Actions depending on role
    quick_actions = []
    role_str = current_user.role.value.lower()
    if role_str == "patient":
        quick_actions.append({"title": "Create Emergency Blood Request", "path": "/patient/emergency", "icon": "AlertTriangle"})
        quick_actions.append({"title": "Search Donors & Blood", "path": "/patient/search", "icon": "Search"})
        quick_actions.append({"title": "Nearby Verified Donors", "path": "/patient/nearby", "icon": "MapPin"})
    elif role_str == "donor":
        quick_actions.append({"title": "View Compatible Blood Requests", "path": "/donor/requests", "icon": "Droplets"})
        quick_actions.append({"title": "Health Readiness Assessment", "path": "/donor/health", "icon": "Activity"})
        quick_actions.append({"title": "Donation History", "path": "/donor/history", "icon": "Clock"})
    elif role_str == "hospital":
        quick_actions.append({"title": "Emergency Blood Requisition", "path": "/hospital/emergency", "icon": "AlertTriangle"})
        quick_actions.append({"title": "Hospital Blood Inventory", "path": "/hospital/inventory", "icon": "Droplets"})
        quick_actions.append({"title": "Registered Patients", "path": "/hospital/patients", "icon": "Users"})
    elif role_str == "bloodbank":
        quick_actions.append({"title": "Blood Bank Stock Inventory", "path": "/bloodbank/inventory", "icon": "Droplets"})
        quick_actions.append({"title": "Record Blood Collection", "path": "/bloodbank/collection", "icon": "Plus"})
        quick_actions.append({"title": "Expiry Tracking", "path": "/bloodbank/expiry", "icon": "AlertTriangle"})
    elif role_str == "admin":
        quick_actions.append({"title": "Manage Platform Users", "path": "/admin/users", "icon": "Users"})
        quick_actions.append({"title": "All Registered Hospitals", "path": "/admin/hospitals", "icon": "Building2"})
        quick_actions.append({"title": "Emergency Requests", "path": "/admin/emergency", "icon": "AlertTriangle"})
        quick_actions.append({"title": "Analytics & Audit Logs", "path": "/admin/analytics", "icon": "TrendingUp"})

    results["quick_actions"] = [
        a for a in quick_actions if query_str in a["title"].lower() or not query_str
    ]

    return {
        "success": True,
        "data": results,
    }
