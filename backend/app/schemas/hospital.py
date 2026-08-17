"""Pydantic schemas for hospital endpoints."""
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date
import re


class HospitalProfileUpdate(BaseModel):
    hospital_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if v and not re.match(r"^\+?[0-9\s\-]{10,15}$", v.strip()):
            raise ValueError("Enter a valid phone number.")
        return v


class HospitalProfileResponse(BaseModel):
    id: str
    user_id: str
    hospital_name: str
    registration_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    verification_status: str
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


class InventoryCreate(BaseModel):
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


class InventoryUpdate(BaseModel):
    units_available: Optional[int] = None
    expiry_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("units_available")
    @classmethod
    def validate_units(cls, v):
        if v is not None and v < 0:
            raise ValueError("Units cannot be negative.")
        return v


class InventoryResponse(BaseModel):
    id: str
    blood_group: str
    component_type: str
    units_available: int
    expiry_date: Optional[str] = None
    notes: Optional[str] = None
    updated_at: str

    model_config = {"from_attributes": True}


class RequestStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class AppointmentCreate(BaseModel):
    donor_id: str
    appointment_date: str
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: str
    donor_id: str
    hospital_id: str
    appointment_date: str
    status: str
    notes: Optional[str] = None
    donor_name: Optional[str] = None
    donor_blood_group: Optional[str] = None

    model_config = {"from_attributes": True}
