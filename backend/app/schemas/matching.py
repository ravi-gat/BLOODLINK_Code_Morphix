"""Pydantic schemas for donor matching results."""
from pydantic import BaseModel
from typing import Optional


class MatchResult(BaseModel):
    """
    A single donor match result.

    Scores are application-level ranking weights for prioritisation only.
    They are NOT medically validated compatibility scores.
    Clinical decisions must be made by qualified medical professionals.
    """
    donor_id: str
    donor_name: Optional[str] = None
    blood_group: Optional[str] = None
    city: Optional[str] = None
    availability: bool

    # Scoring breakdown (0.0 – 1.0 each, except overall_score which is 0–100)
    compatibility_score: float   # blood group compatibility: 40% weight
    availability_score: float    # donor marked available: 20% weight
    distance_score: float        # same city: 20% weight
    eligibility_score: float     # eligible to donate: 10% weight
    history_score: float         # past donation history: 10% weight
    overall_score: float         # combined weighted score 0–100

    ranking: int
    match_id: Optional[str] = None

    model_config = {"from_attributes": True}


class MatchingResultResponse(BaseModel):
    success: bool = True
    request_id: str
    matches: list[MatchResult]
    total_found: int
    note: str = (
        "These rankings are application-level matching scores to help prioritise outreach. "
        "They are not a substitute for clinical transfusion protocols."
    )
