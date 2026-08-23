"""
Public statistics router for BloodLink.

Calculates real aggregated metrics from the PostgreSQL database.
Never returns fake or randomly generated numbers.
If the database has zero records, returns 0.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..core.database import get_db
from ..models.user import User
from ..models.profiles import Donor, Hospital, BloodBank
from ..models.blood import BloodRequest, Donation
from ..models.emergency import EmergencyRequest
from ..models.enums import RequestStatus, EmergencyStatus, UserRole, UserStatus
from ..schemas.auth import PublicStatsResponse

router = APIRouter(prefix="/stats", tags=["Public Statistics"])


@router.get("/public", response_model=PublicStatsResponse)
async def get_public_stats(db: Session = Depends(get_db)):
    """
    Return real aggregate platform statistics computed directly from the database.
    """
    # 1. Registered Donors
    registered_donors = (
        db.query(func.count(Donor.id))
        .join(User, Donor.user_id == User.id)
        .filter(User.status == UserStatus.ACTIVE)
        .scalar()
        or 0
    )

    # 2. Registered Hospitals
    registered_hospitals = (
        db.query(func.count(Hospital.id))
        .join(User, Hospital.user_id == User.id)
        .filter(User.status == UserStatus.ACTIVE)
        .scalar()
        or 0
    )

    # 3. Registered Blood Banks
    registered_bloodbanks = (
        db.query(func.count(BloodBank.id))
        .join(User, BloodBank.user_id == User.id)
        .filter(User.status == UserStatus.ACTIVE)
        .scalar()
        or 0
    )

    # 4. Completed Donations
    completed_donations = (
        db.query(func.count(Donation.id))
        .filter(func.upper(Donation.status) == "COMPLETED")
        .scalar()
        or 0
    )

    # 5. Active Requests (BloodRequests + EmergencyRequests)
    active_blood_requests = (
        db.query(func.count(BloodRequest.id))
        .filter(
            BloodRequest.status.in_([
                RequestStatus.PENDING,
                RequestStatus.ACCEPTED,
                RequestStatus.PROCESSING,
            ])
        )
        .scalar()
        or 0
    )

    active_emergency_requests = (
        db.query(func.count(EmergencyRequest.id))
        .filter(
            EmergencyRequest.status.in_([
                EmergencyStatus.PENDING,
                EmergencyStatus.ACTIVE,
                EmergencyStatus.MATCHED,
            ])
        )
        .scalar()
        or 0
    )

    total_active_requests = active_blood_requests + active_emergency_requests

    # 6. Lives saved is mapped from completed donations (or minimum 0)
    lives_saved = completed_donations

    return PublicStatsResponse(
        success=True,
        registered_donors=registered_donors,
        registered_hospitals=registered_hospitals,
        registered_bloodbanks=registered_bloodbanks,
        completed_donations=completed_donations,
        active_requests=total_active_requests,
        lives_saved=lives_saved,
    )
