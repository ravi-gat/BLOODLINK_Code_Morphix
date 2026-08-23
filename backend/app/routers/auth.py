"""
Authentication router for BloodLink.

Supported authentication methods:
- Email / Password Registration (role-based; ADMIN forbidden via public registration)
- Email Verification (JWT token-based account activation)
- Email / Password Login (role determined from database)
- Forgot / Reset Password (secure single-use JWT token)
- Token Refresh
- Logout
- Session restore (GET /me)

Google OAuth has been intentionally removed.
The only authentication method is email + password.
"""
import uuid
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..core.config import settings
from ..core.database import get_db
from ..middleware.rate_limit import limiter
from ..core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_refresh_token,
    create_verification_token, decode_verification_token,
    create_password_reset_token, decode_password_reset_token,
)
from ..core.deps import get_current_user
from ..models.user import User
from ..models.profiles import Patient, Donor, Hospital, BloodBank
from ..models.enums import UserRole, UserStatus
from ..schemas.auth import (
    RegisterRequest,
    LoginRequest, RefreshRequest, ForgotPasswordRequest,
    ResetPasswordRequest, ChangePasswordRequest, VerifyEmailRequest,
    ResendVerificationRequest, AuthResponse, TokenResponse,
    MessageResponse, UserResponse,
)
from ..utils.helpers import (
    role_from_str, role_to_frontend, label_to_bg, bg_to_label, fmt_datetime,
)
from ..services.audit_service import log_action
from ..services.email_service import send_verification_email, send_password_reset_email

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

COOKIE_NAME = "bloodlink_token"
COOKIE_MAX_AGE = 60 * 60  # 1 hour


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _build_user_response(user: User, db: Session) -> UserResponse:
    """Build a UserResponse DTO from a User ORM object, including profile data."""
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
        is_verified=(user.status == UserStatus.ACTIVE),
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
# Registration
# ---------------------------------------------------------------------------

@router.post("/register", response_model=AuthResponse, status_code=201)
@limiter.limit("15/minute")
async def register(
    request: Request,
    body: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Register a new user account with email and password.
    ADMIN accounts cannot be created via this endpoint.
    When REQUIRE_EMAIL_VERIFICATION is true, the account starts as PENDING
    and a verification email is dispatched.
    """
    role = role_from_str(body.role)
    if role is None:
        raise HTTPException(status_code=400, detail="Invalid role specified.")
    if role == UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin accounts cannot be created via public registration.",
        )

    norm_email = body.email.lower().strip()
    existing = db.query(User).filter(func.lower(User.email) == norm_email).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )

    pwd_hash = hash_password(body.password)
    initial_status = (
        UserStatus.PENDING
        if settings.REQUIRE_EMAIL_VERIFICATION
        else UserStatus.ACTIVE
    )

    user = User(
        id=str(uuid.uuid4()).replace("-", ""),
        full_name=body.name.strip(),
        email=norm_email,
        phone=body.phone.strip() if body.phone else "",
        password_hash=pwd_hash,
        role=role,
        status=initial_status,
    )

    bg_enum = label_to_bg(body.blood_group) if body.blood_group else None
    city = (body.city or "").strip()
    address = (body.address or "").strip() or None

    try:
        db.add(user)
        db.flush()

        if role == UserRole.PATIENT:
            db.add(Patient(
                id=str(uuid.uuid4()).replace("-", ""),
                user_id=user.id,
                blood_group=bg_enum or "O_POS",
                city=city or "Unknown",
                address=address,
            ))
        elif role == UserRole.DONOR:
            db.add(Donor(
                id=str(uuid.uuid4()).replace("-", ""),
                user_id=user.id,
                blood_group=bg_enum or "O_POS",
                city=city or "Unknown",
                address=address,
                availability_status=True,
            ))
        elif role == UserRole.HOSPITAL:
            hospital_name = (body.hospital_name or body.name).strip()
            reg_num = (body.registration_number or f"REG-H-{user.id[:8].upper()}").strip()
            db.add(Hospital(
                id=str(uuid.uuid4()).replace("-", ""),
                user_id=user.id,
                hospital_name=hospital_name,
                registration_number=reg_num,
                city=city or "Unknown",
                address=address,
            ))
        elif role == UserRole.BLOOD_BANK:
            bb_name = (body.blood_bank_name or body.name).strip()
            reg_num = (body.registration_number or f"REG-BB-{user.id[:8].upper()}").strip()
            db.add(BloodBank(
                id=str(uuid.uuid4()).replace("-", ""),
                user_id=user.id,
                name=bb_name,
                registration_number=reg_num,
                city=city or "Unknown",
                address=address,
            ))

        log_action(
            db, "REGISTER",
            user_id=user.id, entity="User", entity_id=user.id,
            ip_address=request.client.host if request.client else None,
        )
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise

    # Send verification email when required
    access_token = create_access_token({"sub": user.id, "role": user.role.value})
    if user.status == UserStatus.PENDING:
        verification_token = create_verification_token(user.id, user.email)
        email_sent = send_verification_email(user.email, user.full_name, verification_token)
        if not email_sent:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Your account was created but the verification email could not be sent. "
                    "Please use 'Resend verification email' on the login page."
                ),
            )
        return AuthResponse(
            user=_build_user_response(user, db),
            access_token="",
        )

    _set_auth_cookie(response, access_token)
    return AuthResponse(
        user=_build_user_response(user, db),
        access_token=access_token,
    )


# ---------------------------------------------------------------------------
# Email verification
# ---------------------------------------------------------------------------

@router.get("/verify-email", response_model=MessageResponse)
@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    token: Optional[str] = Query(None),
    body: Optional[VerifyEmailRequest] = None,
    db: Session = Depends(get_db),
):
    """Activate an account using the signed JWT verification token."""
    token_str = token or (body.token if body else None)
    if not token_str:
        raise HTTPException(status_code=400, detail="Verification token is required.")

    payload = decode_verification_token(token_str)
    if not payload:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired email verification link. Please request a new one.",
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(status_code=403, detail="Your account has been suspended.")

    user.status = UserStatus.ACTIVE
    db.commit()

    return MessageResponse(
        message="Email verified successfully. Your BloodLink account is now active."
    )


@router.post("/resend-verification", response_model=MessageResponse)
@limiter.limit("5/minute")
async def resend_verification(
    request: Request,
    body: ResendVerificationRequest,
    db: Session = Depends(get_db),
):
    """Resend the verification email for a PENDING account."""
    email_norm = body.email.lower().strip()
    user = db.query(User).filter(func.lower(User.email) == email_norm).first()

    if user and user.status == UserStatus.PENDING:
        token = create_verification_token(user.id, user.email)
        email_sent = send_verification_email(user.email, user.full_name, token)
        if not email_sent:
            raise HTTPException(
                status_code=503,
                detail="The verification email could not be sent. Please try again.",
            )

    # Always return same message to prevent email enumeration
    return MessageResponse(
        message="If an unverified account with that email exists, a verification link has been sent."
    )


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=AuthResponse)
@limiter.limit("15/minute")
async def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Authenticate with email and password.
    Role is determined from the database — no role selection needed at login.
    """
    norm_email = body.email.lower().strip()
    user = db.query(User).filter(func.lower(User.email) == norm_email).first()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if user.status == UserStatus.PENDING:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before signing in.",
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
# Token refresh
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
# Current session
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
# Forgot / Reset password
# ---------------------------------------------------------------------------

@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Dispatch a password reset link.
    Always returns success to prevent user enumeration.
    """
    norm_email = body.email.lower().strip()
    user = db.query(User).filter(func.lower(User.email) == norm_email).first()

    if user and user.status != UserStatus.SUSPENDED:
        token = create_password_reset_token(user.id, user.email)
        send_password_reset_email(user.email, user.full_name, token)

    return MessageResponse(
        message="If an account with that email exists, password reset instructions have been sent."
    )


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def reset_password(
    request: Request,
    body: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """Reset password using the single-use JWT token from the email."""
    payload = decode_password_reset_token(body.token)
    if not payload:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset link. Please request a new one.",
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(status_code=403, detail="Your account has been suspended.")

    user.password_hash = hash_password(body.password)
    user.status = UserStatus.ACTIVE
    db.commit()

    return MessageResponse(
        message="Password updated successfully. You can now sign in with your new password."
    )


# ---------------------------------------------------------------------------
# Change password (authenticated)
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
