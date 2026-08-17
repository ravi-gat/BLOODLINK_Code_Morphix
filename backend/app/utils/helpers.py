"""
General utility functions used across the application.
"""
from datetime import datetime, timezone
from typing import Optional
from ..models.enums import BloodGroup, UserRole, BLOOD_GROUP_LABELS, BLOOD_GROUP_FROM_LABEL


# ── Blood group conversion ────────────────────────────────────────────────────

def bg_to_label(bg: BloodGroup | str) -> str:
    """Convert BloodGroup enum to human-readable label (e.g. O_POS → 'O+')."""
    if isinstance(bg, BloodGroup):
        return BLOOD_GROUP_LABELS.get(bg, str(bg))
    # Already a string — return as-is if it's already a label
    if bg in BLOOD_GROUP_FROM_LABEL:
        return bg
    return BLOOD_GROUP_LABELS.get(BloodGroup(bg), bg)


def label_to_bg(label: str) -> Optional[BloodGroup]:
    """Convert frontend label (e.g. 'O+') to BloodGroup enum."""
    if not label:
        return None
    # Direct enum value (e.g. "O_POS")
    if label in BloodGroup.__members__:
        return BloodGroup(label)
    # Human-readable label (e.g. "O+")
    return BLOOD_GROUP_FROM_LABEL.get(label)


# ── Role conversion ───────────────────────────────────────────────────────────

FRONTEND_ROLE_MAP = {
    "patient": UserRole.PATIENT,
    "donor": UserRole.DONOR,
    "hospital": UserRole.HOSPITAL,
    "bloodbank": UserRole.BLOOD_BANK,
    "blood_bank": UserRole.BLOOD_BANK,
    "admin": UserRole.ADMIN,
}

ROLE_TO_FRONTEND = {
    UserRole.PATIENT: "patient",
    UserRole.DONOR: "donor",
    UserRole.HOSPITAL: "hospital",
    UserRole.BLOOD_BANK: "bloodbank",
    UserRole.ADMIN: "admin",
}


def role_from_str(role_str: str) -> Optional[UserRole]:
    """Convert frontend role string to UserRole enum."""
    return FRONTEND_ROLE_MAP.get(role_str.lower().replace("-", "_"))


def role_to_frontend(role: UserRole) -> str:
    """Convert UserRole enum to frontend-compatible string."""
    return ROLE_TO_FRONTEND.get(role, role.value.lower())


# ── Date formatting ───────────────────────────────────────────────────────────

def fmt_datetime(dt: Optional[datetime]) -> Optional[str]:
    """Format a datetime object to ISO 8601 string."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def fmt_date(d) -> Optional[str]:
    """Format a date or datetime to YYYY-MM-DD string."""
    if d is None:
        return None
    return d.strftime("%Y-%m-%d")


# ── Reward level calculation ──────────────────────────────────────────────────

REWARD_LEVELS = [
    (0, "Bronze"),
    (500, "Silver"),
    (1500, "Gold"),
    (3000, "Platinum"),
    (6000, "Legend"),
]


def calculate_reward_level(points: int) -> str:
    """Return the reward tier name for a given points total."""
    level = "Bronze"
    for threshold, name in REWARD_LEVELS:
        if points >= threshold:
            level = name
    return level
