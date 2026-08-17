"""
Donor matching engine.

Finds compatible donors for a blood request using a transparent
baseline weighted scoring algorithm.

IMPORTANT: DonorMatch is a DB stub only (table does not exist).
This engine returns scored Python objects without writing to a
donor_matches table. Results are used to send notifications.

Scoring weights (not medically validated — application-level only):
    Blood Compatibility:  40%
    Availability:         20%
    Distance:             20%
    Eligibility:          10%
    Response History:     10%
"""
from dataclasses import dataclass
from sqlalchemy.orm import Session
from ..models.profiles import Donor
from ..models.blood import BloodRequest
from ..utils.blood_compat import get_compatible_donors
from .features import extract_features
import logging

logger = logging.getLogger(__name__)

WEIGHTS = {
    "compatibility_score": 0.40,
    "availability_score":  0.20,
    "distance_score":      0.20,
    "eligibility_score":   0.10,
    "history_score":       0.10,
}


@dataclass
class MatchResult:
    """
    An in-memory match result — NOT a database row.
    The donor_matches table does not exist in the current DB.
    """
    donor_id: str
    overall_score: float
    features: dict


def compute_overall_score(features: dict) -> float:
    weighted = sum(features[k] * w for k, w in WEIGHTS.items())
    return round(weighted * 100, 2)


def find_and_rank_donors(
    db: Session,
    request: BloodRequest,
    max_results: int = 20,
) -> list[MatchResult]:
    """
    Find and rank compatible donors for a blood request.

    Returns a list of MatchResult objects sorted by overall_score
    descending.  Does NOT write to any database table because
    the donor_matches table does not exist.

    The caller is responsible for notifying the matched donors.
    """
    from ..models.user import User
    from ..models.enums import UserStatus

    compatible_bgs = get_compatible_donors(request.blood_group)
    if not compatible_bgs:
        logger.warning(f"No compatible blood groups for {request.blood_group}")
        return []

    # Query available donors with a compatible blood group
    candidates: list[Donor] = (
        db.query(Donor)
        .join(User, Donor.user_id == User.id)
        .filter(
            Donor.blood_group.in_(compatible_bgs),
            Donor.availability_status == True,   # DB column: availabilityStatus
            User.status == UserStatus.ACTIVE,
        )
        .limit(200)
        .all()
    )

    if not candidates:
        logger.info(f"No donor candidates for request {request.id}")
        return []

    scored = []
    for donor in candidates:
        features = extract_features(donor, request)
        overall = compute_overall_score(features)
        scored.append(MatchResult(
            donor_id=donor.id,
            overall_score=overall,
            features=features,
        ))

    scored.sort(key=lambda x: x.overall_score, reverse=True)
    top = scored[:max_results]

    logger.info(
        f"Ranked {len(top)} donor(s) for request {request.id} "
        f"(top score: {top[0].overall_score if top else 'n/a'})"
    )
    return top
