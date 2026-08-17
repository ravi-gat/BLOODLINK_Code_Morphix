"""Pydantic schemas for admin endpoints."""
from pydantic import BaseModel
from typing import Optional, List, Any


class AdminUserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    status: str
    is_verified: bool
    city: Optional[str] = None
    blood_group: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}


class AdminDashboardResponse(BaseModel):
    total_users: int
    total_donors: int
    active_donors: int
    total_hospitals: int
    total_blood_banks: int
    active_requests: int
    completed_requests: int
    total_donations: int
    total_blood_units: int
    pending_verifications: int


class AdminAnalyticsResponse(BaseModel):
    monthly_data: List[Any]
    blood_type_distribution: List[Any]
    requests_by_status: List[Any]
    top_cities: List[Any]


class UserStatusUpdate(BaseModel):
    status: str   # "ACTIVE" | "SUSPENDED" | "PENDING"


class VerifyEntityRequest(BaseModel):
    verified: bool
    notes: Optional[str] = None
