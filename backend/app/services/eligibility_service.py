"""
Donation eligibility service.

Uses the actual Donor DB columns:
    availabilityStatus (Boolean)
    lastDonationDate   (DateTime, nullable)

IMPORTANT DISCLAIMER:
These are software screening rules only — not medical clearance.
Actual eligibility must be confirmed by qualified healthcare professionals.
"""
from datetime import date, timedelta
from typing import Optional
from ..models.profiles import Donor

WHOLE_BLOOD_MIN_DAYS = 56    # 8 weeks
PLATELET_MIN_DAYS    = 7     # 1 week
PLASMA_MIN_DAYS      = 28    # 4 weeks
DOUBLE_RBC_MIN_DAYS  = 112   # 16 weeks


def is_eligible(donor: Donor, donation_type: str = "Whole Blood") -> dict:
    """
    Check whether a donor appears eligible based on software rules.

    Uses only columns that actually exist in the DB:
        donor.availability_status  (bool)
        donor.last_donation_date   (datetime or None)

    Returns:
        dict with keys: eligible (bool), reason (str),
                        next_eligible_date (date or None)
    """
    today = date.today()

    # Check the actual DB column name: availabilityStatus
    if not donor.availability_status:
        return {
            "eligible": False,
            "reason": "Donor has marked themselves as unavailable.",
            "next_eligible_date": None,
        }

    # last_donation_date is a DateTime in the DB — convert to date if needed
    if donor.last_donation_date:
        last_date = (
            donor.last_donation_date.date()
            if hasattr(donor.last_donation_date, "date")
            else donor.last_donation_date
        )
        min_days = {
            "Whole Blood": WHOLE_BLOOD_MIN_DAYS,
            "Platelet":    PLATELET_MIN_DAYS,
            "Plasma":      PLASMA_MIN_DAYS,
            "Double Red Cell": DOUBLE_RBC_MIN_DAYS,
            "Packed RBC":  WHOLE_BLOOD_MIN_DAYS,
        }.get(donation_type, WHOLE_BLOOD_MIN_DAYS)

        days_since = (today - last_date).days
        if days_since < min_days:
            next_date = last_date + timedelta(days=min_days)
            return {
                "eligible": False,
                "reason": (
                    f"Last donation was {days_since} days ago. "
                    f"Minimum interval for {donation_type} is {min_days} days. "
                    f"Estimated next eligible date: {next_date.strftime('%d %b %Y')}. "
                    "Confirm with a healthcare professional."
                ),
                "next_eligible_date": next_date,
            }

    return {
        "eligible": True,
        "reason": "Donor appears eligible based on software screening rules.",
        "next_eligible_date": None,
    }


def calculate_next_eligible_date(
    last_donation_date: date,
    donation_type: str = "Whole Blood",
) -> date:
    """Return the estimated next eligible donation date."""
    min_days = {
        "Whole Blood": WHOLE_BLOOD_MIN_DAYS,
        "Platelet":    PLATELET_MIN_DAYS,
        "Plasma":      PLASMA_MIN_DAYS,
        "Double Red Cell": DOUBLE_RBC_MIN_DAYS,
    }.get(donation_type, WHOLE_BLOOD_MIN_DAYS)
    return last_donation_date + timedelta(days=min_days)
