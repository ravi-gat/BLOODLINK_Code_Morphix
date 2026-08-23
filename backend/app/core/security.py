"""
Security utilities: password hashing, JWT creation and verification.
Passwords are never logged or returned in API responses.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from .config import settings
import logging

logger = logging.getLogger(__name__)

# bcrypt password context — cost factor from settings
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=settings.BCRYPT_ROUNDS)


# ── Password ──────────────────────────────────────────────────────────────────

def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compare a plain-text password against a stored hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT ───────────────────────────────────────────────────────────────────────

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a short-lived JWT access token.
    Default expiry: ACCESS_TOKEN_EXPIRE_MINUTES from settings.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a long-lived JWT refresh token.
    Expiry: REFRESH_TOKEN_EXPIRE_DAYS from settings.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_REFRESH_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a JWT access token.
    Returns the payload dict, or None if invalid/expired.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


def decode_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a JWT refresh token.
    Returns the payload dict, or None if invalid/expired.
    """
    try:
        payload = jwt.decode(token, settings.JWT_REFRESH_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


def create_verification_token(user_id: str, email: str) -> str:
    """
    Create a JWT token for email verification (valid for 24 hours).
    """
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    payload = {
        "sub": user_id,
        "email": email.lower().strip(),
        "type": "verify_email",
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_verification_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate an email verification JWT token.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "verify_email":
            return None
        return payload
    except JWTError:
        return None


def create_password_reset_token(user_id: str, email: str) -> str:
    """
    Create a short-lived JWT token for password reset (valid for 30 minutes).
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    payload = {
        "sub": user_id,
        "email": email.lower().strip(),
        "type": "reset_password",
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_password_reset_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a password reset JWT token.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "reset_password":
            return None
        return payload
    except JWTError:
        return None


# Google OAuth token functions removed.
# Only email/password authentication is supported.

