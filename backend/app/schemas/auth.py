"""
Pydantic schemas for authentication endpoints.
Google OAuth schemas have been removed — only email/password auth is supported.
"""
from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional
import re


# ── Registration ──────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    city: str
    role: str   # accepts lowercase: patient, donor, hospital, bloodbank (admin forbidden)
    blood_group: Optional[str] = None
    address: Optional[str] = None
    hospital_name: Optional[str] = None
    blood_bank_name: Optional[str] = None
    registration_number: Optional[str] = None
    password: str
    confirm_password: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters.")
        if len(v) > 100:
            raise ValueError("Name must be 100 characters or fewer.")
        return v

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.strip()
        if not re.match(r"^\+?[0-9\s\-]{10,15}$", cleaned):
            raise ValueError("Enter a valid phone number (10–15 digits).")
        return cleaned

    @field_validator("city")
    @classmethod
    def validate_city(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("City name must be at least 2 characters.")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number.")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("Password must contain at least one special character.")
        return v

    @model_validator(mode="after")
    def passwords_match(self):
        if self.confirm_password and self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


# ── Login ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    # role field accepted for backwards compatibility but not used —
    # the backend determines role from the database.
    role: Optional[str] = None


# ── Token refresh ─────────────────────────────────────────────────────────────

class RefreshRequest(BaseModel):
    refresh_token: str


# ── Password management ───────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must include an uppercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must include a number.")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("Password must include a special character.")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must include an uppercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must include a number.")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("Password must include a special character.")
        return v


# ── Responses ─────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: str           # lowercase for frontend compatibility
    status: str
    is_verified: bool
    city: Optional[str] = None
    blood_group: Optional[str] = None   # human-readable e.g. "O+"
    created_at: str

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    success: bool = True
    user: Optional[UserResponse] = None
    access_token: Optional[str] = None
    token_type: str = "bearer"


class TokenResponse(BaseModel):
    success: bool = True
    access_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    success: bool = True
    message: str


class PublicStatsResponse(BaseModel):
    success: bool = True
    registered_donors: int = 0
    registered_hospitals: int = 0
    registered_bloodbanks: int = 0
    completed_donations: int = 0
    active_requests: int = 0
    lives_saved: int = 0
