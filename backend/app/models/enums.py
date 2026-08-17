"""
Shared enumerations for BloodLink SQLAlchemy models.

These enum VALUES must exactly match the PostgreSQL enum labels
in the existing Prisma database.  Do not rename them.

Verified against the live DB with:
    SELECT typname, enumlabel FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    ORDER BY typname, e.enumsortorder;

Results:
    BloodGroup:       A_POS A_NEG B_POS B_NEG AB_POS AB_NEG O_POS O_NEG
    Role:             PATIENT DONOR HOSPITAL BLOOD_BANK ADMIN
    UserStatus:       ACTIVE PENDING SUSPENDED
    RequestStatus:    PENDING ACCEPTED PROCESSING FULFILLED REJECTED CANCELLED
    EmergencyStatus:  PENDING ACTIVE MATCHED FULFILLED CANCELLED EXPIRED
"""
import enum


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class UserRole(str, enum.Enum):
    """Maps to PostgreSQL enum  "Role" """
    PATIENT    = "PATIENT"
    DONOR      = "DONOR"
    HOSPITAL   = "HOSPITAL"
    BLOOD_BANK = "BLOOD_BANK"
    ADMIN      = "ADMIN"


class UserStatus(str, enum.Enum):
    """Maps to PostgreSQL enum  "UserStatus" """
    ACTIVE    = "ACTIVE"
    PENDING   = "PENDING"
    SUSPENDED = "SUSPENDED"


# ---------------------------------------------------------------------------
# Blood
# ---------------------------------------------------------------------------

class BloodGroup(str, enum.Enum):
    """Maps to PostgreSQL enum  "BloodGroup" """
    A_POS  = "A_POS"
    A_NEG  = "A_NEG"
    B_POS  = "B_POS"
    B_NEG  = "B_NEG"
    AB_POS = "AB_POS"
    AB_NEG = "AB_NEG"
    O_POS  = "O_POS"
    O_NEG  = "O_NEG"


# ---------------------------------------------------------------------------
# Blood requests
# ---------------------------------------------------------------------------

class RequestStatus(str, enum.Enum):
    """
    Maps to PostgreSQL enum  "RequestStatus".

    Actual values in the DB:
        PENDING ACCEPTED PROCESSING FULFILLED REJECTED CANCELLED

    NOTE: The application previously used MATCHING / DONOR_FOUND /
    IN_PROGRESS / COMPLETED which do NOT exist in the database.
    All code must use the values below.
    """
    PENDING    = "PENDING"
    ACCEPTED   = "ACCEPTED"
    PROCESSING = "PROCESSING"
    FULFILLED  = "FULFILLED"
    REJECTED   = "REJECTED"
    CANCELLED  = "CANCELLED"


class UrgencyLevel(str, enum.Enum):
    """
    Urgency is stored as a plain VARCHAR in the DB (not a PostgreSQL enum).
    These are the application-level values used when writing new rows.
    """
    CRITICAL = "Critical"
    HIGH     = "High"
    MODERATE = "Moderate"
    LOW      = "Low"


# ---------------------------------------------------------------------------
# Emergency requests
# ---------------------------------------------------------------------------

class EmergencyStatus(str, enum.Enum):
    """Maps to PostgreSQL enum  "EmergencyStatus" """
    PENDING   = "PENDING"
    ACTIVE    = "ACTIVE"
    MATCHED   = "MATCHED"
    FULFILLED = "FULFILLED"
    CANCELLED = "CANCELLED"
    EXPIRED   = "EXPIRED"


# ---------------------------------------------------------------------------
# Donations  (status stored as VARCHAR in the DB, not a PG enum)
# ---------------------------------------------------------------------------

class DonationStatus(str, enum.Enum):
    """Application-level values for Donation.status (VARCHAR column)."""
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW   = "NO_SHOW"


# ---------------------------------------------------------------------------
# Human-readable helpers
# ---------------------------------------------------------------------------

BLOOD_GROUP_LABELS = {
    BloodGroup.A_POS:  "A+",
    BloodGroup.A_NEG:  "A-",
    BloodGroup.B_POS:  "B+",
    BloodGroup.B_NEG:  "B-",
    BloodGroup.AB_POS: "AB+",
    BloodGroup.AB_NEG: "AB-",
    BloodGroup.O_POS:  "O+",
    BloodGroup.O_NEG:  "O-",
}

BLOOD_GROUP_FROM_LABEL = {v: k for k, v in BLOOD_GROUP_LABELS.items()}
