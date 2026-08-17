"""Pydantic schemas for patient endpoints."""
from pydantic import BaseModel, field_validator
from typing import Optional
import re


class PatientProfileUpdate(BaseModel):
    blood_group: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    medical_notes: Optional[str] = None

    @field_validator("emergency_contact")
    @classmethod
    def validate_phone(cls, v):
        if v and not re.match(r"^\+?[0-9\s\-]{10,15}$", v.strip()):
            raise ValueError("Enter a valid emergency contact number.")
        return v


class PatientProfileResponse(BaseModel):
    id: str
    user_id: str
    blood_group: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    medical_notes: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


class BloodRequestCreate(BaseModel):
    blood_group: str
    units_required: int
    urgency: str
    city: str
    hospital_name: Optional[str] = None
    patient_name: Optional[str] = None
    medical_notes: Optional[str] = None
    contact_number: Optional[str] = None

    @field_validator("units_required")
    @classmethod
    def validate_units(cls, v):
        if v < 1 or v > 10:
            raise ValueError("Units required must be between 1 and 10.")
        return v

    @field_validator("contact_number")
    @classmethod
    def validate_phone(cls, v):
        if v and not re.match(r"^\+?[0-9\s\-]{10,15}$", v.strip()):
            raise ValueError("Enter a valid contact phone number.")
        return v


class BloodRequestResponse(BaseModel):
    id: str
    blood_group: str
    units_required: int
    urgency: str
    city: str
    status: str
    hospital_name: Optional[str] = None
    patient_name: Optional[str] = None
    medical_notes: Optional[str] = None
    contact_number: Optional[str] = None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}
