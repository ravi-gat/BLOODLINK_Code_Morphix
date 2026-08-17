"""Pydantic schemas for donor endpoints."""
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date


class DonorProfileUpdate(BaseModel):
    blood_group: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    availability: Optional[bool] = None
    health_status: Optional[str] = None


class AvailabilityUpdate(BaseModel):
    available: bool


class DonorProfileResponse(BaseModel):
    id: str
    user_id: str
    blood_group: Optional[str] = None
    city: Optional[str] = None
    availability: bool
    last_donation_date: Optional[str] = None
    next_eligible_date: Optional[str] = None
    health_status: str
    verification_status: str
    total_donations: int
    reward_points: int
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


class DonorPublicResponse(BaseModel):
    """Public-safe donor info for patient/hospital search results."""
    id: str
    blood_group: Optional[str] = None
    city: Optional[str] = None
    availability: bool
    total_donations: int
    name: Optional[str] = None
    last_donation_date: Optional[str] = None
    next_eligible_date: Optional[str] = None

    model_config = {"from_attributes": True}


class DonationResponse(BaseModel):
    id: str
    blood_group: str
    units: int
    component_type: str
    donation_date: str
    status: str
    hospital_name: Optional[str] = None
    blood_bank_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}


class RewardResponse(BaseModel):
    points: int
    level: str
    transactions: list = []

    model_config = {"from_attributes": True}
