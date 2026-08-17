"""
Feature extraction for donor matching.

Uses ONLY columns that exist in the actual "Donor" DB table:
    bloodGroup          (BloodGroup enum)
    city                (String)
    availabilityStatus  (Boolean)  — NOT 'availability'
    lastDonationDate    (DateTime, nullable)  — NOT 'last_donation_date' + date type

There is NO total_donations, next_eligible_date, health_status,
verification_status, or reward_points column in the DB.
"""
from datetime import date
from ..models.profiles import Donor
from ..models.blood import BloodRequest
from ..utils.blood_compat import compatibility_score


def extract_features(donor: Donor, request: BloodRequest) -> dict:
    """
    Extract a feature dict for a (donor, request) pair.

    Returns dict with float values 0.0–1.0 for each dimension.
    These scores are application-level ranking weights, not medical assessments.
    """
    today = date.today()

    # ── Blood group compatibility ─────────────────────────────────────────────
    comp = (
        compatibility_score(donor.blood_group, request.blood_group)
        if donor.blood_group and request.blood_group
        else 0.0
    )

    # ── Availability (actual DB column: availabilityStatus) ──────────────────
    avail = 1.0 if donor.availability_status else 0.0

    # ── Distance — city-level proxy (no GPS in DB) ────────────────────────────
    if donor.city and request.city:
        dist = 1.0 if donor.city.strip().lower() == request.city.strip().lower() else 0.4
    else:
        dist = 0.4

    # ── Eligibility — based on lastDonationDate only ──────────────────────────
    elig = 1.0
    if donor.last_donation_date:
        last = (
            donor.last_donation_date.date()
            if hasattr(donor.last_donation_date, "date")
            else donor.last_donation_date
        )
        days_since = (today - last).days
        if days_since < 56:
            elig = 0.0   # within standard 56-day minimum
        elif days_since < 84:
            elig = 0.6   # eligible but recently donated

    # ── Donation history — no total_donations column in DB ───────────────────
    # Use a neutral default since we have no history data in the DB.
    history = 0.5

    return {
        "compatibility_score": round(comp, 4),
        "availability_score":  round(avail, 4),
        "distance_score":      round(dist, 4),
        "eligibility_score":   round(elig, 4),
        "history_score":       round(history, 4),
    }
