"""
BloodLink SQLAlchemy model registry.

Import order matters — parent tables must be imported before child
tables so that SQLAlchemy can resolve foreign key references during
configure_mappers().

Only classes that inherit from Base (i.e. real mapped tables) are
imported at the top level.  Plain Python stubs for non-existent
tables (DonorMatch, Appointment, Reward, RewardTransaction,
ChatMessage) are also re-exported here for application code that
imports from this package, but they are NOT SQLAlchemy models and
will NOT be passed to configure_mappers().

Tables in the live PostgreSQL database (verified 2026-08-17):
    "User"              ← user.py
    "Patient"           ← profiles.py
    "Donor"             ← profiles.py
    "Hospital"          ← profiles.py
    "BloodBank"         ← profiles.py
    "BloodInventory"    ← blood.py
    "BloodRequest"      ← blood.py
    "EmergencyRequest"  ← emergency.py
    "Donation"          ← blood.py
    "Notification"      ← notifications.py
    "AuditLog"          ← notifications.py

Tables that do NOT exist (stubs only):
    donor_matches       → DonorMatch   (blood.py)
    appointments        → Appointment  (blood.py)
    rewards             → Reward       (notifications.py)
    reward_transactions → RewardTransaction (notifications.py)
    chat_messages       → ChatMessage  (notifications.py)
"""

# ── Enums & helpers ──────────────────────────────────────────────────────────

from .enums import (
    UserRole,
    UserStatus,
    BloodGroup,
    RequestStatus,
    EmergencyStatus,
    UrgencyLevel,
    DonationStatus,
    BLOOD_GROUP_LABELS,
    BLOOD_GROUP_FROM_LABEL,
)

# ── Real mapped models (import in dependency order) ──────────────────────────

# 1. Root table — no FK dependencies
from .user import User

# 2. Profile tables — all depend on User.id
from .profiles import Patient, Donor, Hospital, BloodBank

# 3. Blood tables — depend on Patient, Hospital, BloodBank, Donor
from .blood import BloodInventory, BloodRequest, Donation

# 4. Emergency requests — depend on Patient, Hospital
from .emergency import EmergencyRequest

# 5. Notification + audit — depend on User
from .notifications import Notification, AuditLog

# ── Non-mapped stubs (re-exported for import compatibility) ──────────────────

from .blood import DonorMatch, Appointment
from .notifications import Reward, RewardTransaction, ChatMessage

# ── Public API ───────────────────────────────────────────────────────────────

__all__ = [
    # Enums
    "UserRole",
    "UserStatus",
    "BloodGroup",
    "RequestStatus",
    "EmergencyStatus",
    "UrgencyLevel",
    "DonationStatus",
    "BLOOD_GROUP_LABELS",
    "BLOOD_GROUP_FROM_LABEL",

    # Mapped models
    "User",
    "Patient",
    "Donor",
    "Hospital",
    "BloodBank",
    "BloodInventory",
    "BloodRequest",
    "EmergencyRequest",
    "Donation",
    "Notification",
    "AuditLog",

    # Stubs (not mapped)
    "DonorMatch",
    "Appointment",
    "Reward",
    "RewardTransaction",
    "ChatMessage",
]
