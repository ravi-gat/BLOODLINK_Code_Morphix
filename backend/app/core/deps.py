"""
FastAPI dependency injection for authentication and authorization.
Backend enforces all RBAC — frontend role checks are supplementary only.
"""
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from .security import decode_access_token
from ..models.user import User
from ..models.enums import UserRole, UserStatus
import logging

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)


def _get_token_from_request(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str | None:
    """
    Extract JWT from Authorization header or cookie.
    Cookie name: bloodlink_token (httpOnly)
    """
    if credentials and credentials.credentials:
        return credentials.credentials
    # Fall back to cookie
    return request.cookies.get("bloodlink_token")


async def get_current_user(
    request: Request,
    token: str | None = Depends(_get_token_from_request),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency that returns the authenticated User.
    Raises 401 if token is missing, invalid, or expired.
    Raises 401 if user account is inactive or suspended.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication is required. Please sign in.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if not user_id:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise credentials_exception

    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your account is not active. Please contact support.",
        )

    return user


def require_roles(*allowed_roles: UserRole):
    """
    Dependency factory for role-based access control.
    Usage: Depends(require_roles(UserRole.ADMIN, UserRole.HOSPITAL))
    Returns the authenticated user if their role is allowed.
    """
    async def _check_role(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user
    return _check_role


# ── Convenience role dependencies ─────────────────────────────────────────────

def get_patient_user(current_user: User = Depends(require_roles(UserRole.PATIENT))) -> User:
    return current_user


def get_donor_user(current_user: User = Depends(require_roles(UserRole.DONOR))) -> User:
    return current_user


def get_hospital_user(current_user: User = Depends(require_roles(UserRole.HOSPITAL))) -> User:
    return current_user


def get_blood_bank_user(current_user: User = Depends(require_roles(UserRole.BLOOD_BANK))) -> User:
    return current_user


def get_admin_user(current_user: User = Depends(require_roles(UserRole.ADMIN))) -> User:
    return current_user


def get_patient_or_hospital_user(
    current_user: User = Depends(require_roles(UserRole.PATIENT, UserRole.HOSPITAL))
) -> User:
    return current_user
