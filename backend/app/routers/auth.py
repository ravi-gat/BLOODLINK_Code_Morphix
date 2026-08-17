"""
Authentication router.

POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/change-password

Mapped to the existing Prisma PostgreSQL "User" table.
User columns: id, name, email, passwordHash, phone, role, status, createdAt, updatedAt

Profile tables used here:
    Patient  → userId, bloodGroup, city, address
    Donor    → userId, bloodGroup, city, address, availabilityStatus
    Hospital → userId, hospitalName, registrationNumber, city, address
    BloodBank→ userId, name, registrationNumber, city, address
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_refresh_token,
)
from ..core.deps import get_current_user
from ..models.user import User
from ..models.profiles import Patient, Donor, Hospital, BloodBank
from ..models.enums import UserRole, UserStatus
from ..schemas.auth import (
    RegisterRequest, LoginRequest, RefreshRequest,
    ForgotPasswordRequest, ChangePasswordRequest,
    AuthResponse, TokenResponse, MessageResponse, UserResponse,
)
from ..utils.helpers import role_from_str, role_to_frontend, label_to_bg, bg_to_label, fmt_datetime
from ..services.audit_service import log_action
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

COOKIE_NAME = "bloodlink_token"
COOKIE_MAX_AGE = 60 * 60  # 1 hour


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_user_response(user: User, db: Session) -> UserResponse:
    """Build a UserResponse from a User ORM object, including profile city/blood_group."""
    city = None
    blood_group = None

    if user.role == UserRole.PATIENT and user.patient_profile:
        city = user.patient_profile.city
        blood_group = (
            bg_to_label(user.patient_profile.blood_group)
            if user.patient_profile.blood_group else None
        )
    elif user.role == UserRole.DONOR and user.donor_profile:
        city = user.donor_profile.city
        blood_group = (
            bg_to_label(user.donor_profile.blood_group)
            if user.donor_profile.blood_group else None
        )
    elif user.role == UserRole.HOSPITAL and user.hospital_profile:
        city = user.hospital_profile.city
    elif user.role == UserRole.BLOOD_BANK and user.blood_bank_profile:
        city = user.blood_bank_profile.city

    return UserResponse(
        id=user.id,
        name=user.full_name,
        email=user.email,
        phone=user.phone,
        role=role_to_frontend(user.role),
        status=user.status.value,
        is_verified=False,          # DB has no is_verified column — always False
        city=city,
        blood_group=blood_group,
        created_at=fmt_datetime(user.created_at) or "",
    )


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        secure=False,   # set True behind HTTPS in production
    )


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(
    body: RegisterRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    """Register a new user. Admin accounts cannot be created via this endpoint."""
    role = role_from_str(body.role)
    if role is None:
        raise HTTPException(status_code=400, detail="Invalid role specified.")
    if role == UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin accounts cannot be created via public registration.",
        )

    existing = db.query(User).filter(User.email == body.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="An account with this email address already exists.",
        )

    pwd_hash = hash_password(body.password)

    # User.id uses cuid-style in Prisma; we generate a UUID here as a
    # compatible string primary key.
    user = User(
        id=str(uuid.uuid4()).replace("-", ""),   # cuid-compatible length
        full_name=body.name.strip(),
        email=body.email.lower().strip(),
        phone=body.phone.strip() if body.phone else "",
        password_hash=pwd_hash,
        role=role,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    db.flush()

    bg_enum = label_to_bg(body.blood_group) if body.blood_group else None
    city = (body.city or "").strip()

    if role == UserRole.PATIENT:
        db.add(Patient(
            id=str(uuid.uuid4()).replace("-", ""),
            user_id=user.id,
            blood_group=bg_enum or "O_POS",
            city=city or "Unknown",
        ))
    elif role == UserRole.DONOR:
        db.add(Donor(
            id=str(uuid.uuid4()).replace("-", ""),
            user_id=user.id,
            blood_group=bg_enum or "O_POS",
            city=city or "Unknown",
        ))
    elif role == UserRole.HOSPITAL:
        db.add(Hospital(
            id=str(uuid.uuid4()).replace("-", ""),
            user_id=user.id,
            hospital_name=body.name.strip(),
            registration_number=f"DEMO-H-{user.id[:8].upper()}",
            city=city or "Unknown",
        ))
    elif role == UserRole.BLOOD_BANK:
        db.add(BloodBank(
            id=str(uuid.uuid4()).replace("-", ""),
            user_id=user.id,
            name=body.name.strip(),                  # DB column is "name"
            registration_number=f"DEMO-BB-{user.id[:8].upper()}",
            city=city or "Unknown",
        ))

    log_action(
        db, "REGISTER",
        user_id=user.id, entity="User", entity_id=user.id,
        ip_address=request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": user.id, "role": user.role.value})
    _set_auth_cookie(response, access_token)

    return AuthResponse(
        user=_build_user_response(user, db),
        access_token=access_token,
    )


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=AuthResponse)
async def login(
    body: LoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    role = role_from_str(body.role)
    if role is None:
        raise HTTPException(status_code=400, detail="Invalid role specified.")

    user = db.query(User).filter(User.email == body.email.lower().strip()).first()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if user.role != role:
        raise HTTPException(
            status_code=401,
            detail="Invalid email, password, or selected role.",
        )

    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=403,
            detail="Your account has been suspended. Please contact support.",
        )
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=403, detail="Your account is not active.")

    log_action(
        db, "LOGIN",
        user_id=user.id, entity="User", entity_id=user.id,
        ip_address=request.client.host if request.client else None,
    )
    db.commit()

    access_token = create_access_token({"sub": user.id, "role": user.role.value})
    _set_auth_cookie(response, access_token)

    return AuthResponse(
        user=_build_user_response(user, db),
        access_token=access_token,
    )


# ---------------------------------------------------------------------------
# Refresh
# ---------------------------------------------------------------------------

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    body: RefreshRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    payload = decode_refresh_token(body.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    user = db.query(User).filter(
        User.id == payload.get("sub"),
        User.status == UserStatus.ACTIVE,
    ).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found or account inactive.")

    access_token = create_access_token({"sub": user.id, "role": user.role.value})
    _set_auth_cookie(response, access_token)
    return TokenResponse(access_token=access_token)


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

@router.post("/logout", response_model=MessageResponse)
async def logout(
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log_action(
        db, "LOGOUT",
        user_id=current_user.id, entity="User", entity_id=current_user.id,
        ip_address=request.client.host if request.client else None,
    )
    db.commit()
    response.delete_cookie(COOKIE_NAME)
    return MessageResponse(message="Signed out successfully.")


# ---------------------------------------------------------------------------
# Me
# ---------------------------------------------------------------------------

@router.get("/me", response_model=AuthResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.refresh(current_user)
    access_token = create_access_token({"sub": current_user.id, "role": current_user.role.value})
    return AuthResponse(
        user=_build_user_response(current_user, db),
        access_token=access_token,
    )


# ---------------------------------------------------------------------------
# Forgot password
# ---------------------------------------------------------------------------

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(body: ForgotPasswordRequest):
    """
    Always returns success to prevent email enumeration.
    Email delivery not yet implemented — extend with SMTP in production.
    """
    return MessageResponse(
        message="If an account with that email exists, reset instructions have been sent."
    )


# ---------------------------------------------------------------------------
# Change password
# ---------------------------------------------------------------------------

@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    body: ChangePasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    current_user.password_hash = hash_password(body.new_password)
    log_action(
        db, "CHANGE_PASSWORD",
        user_id=current_user.id, entity="User", entity_id=current_user.id,
        ip_address=request.client.host if request.client else None,
    )
    db.commit()
    return MessageResponse(message="Password updated successfully.")
