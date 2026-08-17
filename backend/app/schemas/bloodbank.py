"""Pydantic schemas for blood bank endpoints."""
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date
import re


class BloodBankProfileUpdate(BaseModel):
    bank_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if v and not re.match(r"^\+?[0-9\s\-]{10,15}$", v.strip()):
            raise ValueError("Enter a valid phone number.")
        return v


class BloodBankProfileResponse(BaseModel):
    id: str
    user_id: str
    bank_name: str
    registration_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    verification_status: str
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


class BBInventoryCreate(BaseModel):
    blood_group: str
    component_type: Optional[str] = "Whole Blood"
    units_available: int
    expiry_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("units_available")
    @classmethod
    def validate_units(cls, v):
        if v < 0:
            raise ValueError("Units cannot be negative.")
        return v


class BBInventoryUpdate(BaseModel):
    units_available: Optional[int] = None
    expiry_date: Optional[date] = None
    notes: Optional[str] = None


class BBInventoryResponse(BaseModel):
    id: str
    blood_group: str
    component_type: str
    units_available: int
    expiry_date: Optional[str] = None
    notes: Optional[str] = None
    updated_at: str

    model_config = {"from_attributes": True}
