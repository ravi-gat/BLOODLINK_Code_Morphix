"""
Pydantic schemas for EmergencyRequest endpoints.
"""
from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any


class EmergencyRequestCreate(BaseModel):
    blood_group: str
    units_required: int
    city: str
    urgency: Optional[str] = "Critical"
    hospital_id: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("units_required")
    @classmethod
    def validate_units(cls, v):
        if v < 1 or v > 20:
            raise ValueError("Units required must be between 1 and 20.")
        return v


class EmergencyStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class MatchedResource(BaseModel):
    donor_id: Optional[str] = None
    donor_name: Optional[str] = None
    blood_group: str
    city: str
    distance_km: Optional[float] = None
    overall_score: Optional[float] = None
    availability_status: bool = True
    type: str = "DONOR"  # "DONOR", "BLOOD_BANK", "HOSPITAL"


class EmergencyRequestResponse(BaseModel):
    id: str
    requester_id: str
    hospital_id: Optional[str] = None
    hospital_name: Optional[str] = None
    requester_name: Optional[str] = None
    requester_phone: Optional[str] = None
    blood_group: str
    units_required: int
    city: str
    urgency: str
    status: str
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class EmergencyRequestDetailResponse(EmergencyRequestResponse):
    matched_resources: List[Dict[str, Any]] = []
