"""
Role-specific profile models.

Every table name, column name, and foreign key reference here has been
verified against the live PostgreSQL database produced by Prisma.

Tables that exist in the DB:
    "Patient"     — patient profile linked 1:1 to User
    "Donor"       — donor profile linked 1:1 to User
    "Hospital"    — hospital profile linked 1:1 to User
    "BloodBank"   — blood bank profile linked 1:1 to User

DB column names are camelCase (Prisma convention).
"""

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from ..core.database import Base
from .enums import BloodGroup


def _now():
    return datetime.now(timezone.utc)
import uuid

def _uuid():
    return str(uuid.uuid4())



# ---------------------------------------------------------------------------
# Patient
# ---------------------------------------------------------------------------

class Patient(Base):
    """
    Maps to the existing PostgreSQL table  "Patient".

    Columns verified in DB:
        id, userId, bloodGroup, city, address, createdAt, updatedAt
    """

    __tablename__ = "Patient"

    id = Column(String(36), primary_key=True)

    user_id = Column(
        "userId",
        String(36),
        ForeignKey("User.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    blood_group = Column(
        "bloodGroup",
        Enum(BloodGroup, name="BloodGroup", create_type=False),
        nullable=False,
    )

    city = Column(String(100), nullable=False)

    address = Column(String(255), nullable=True)

    created_at = Column("createdAt", DateTime(), nullable=False)
    updated_at = Column("updatedAt", DateTime(), nullable=False)

    # ----------------------------------------------------------------
    # Relationships
    # ----------------------------------------------------------------

    user = relationship("User", back_populates="patient_profile")

    blood_requests = relationship(
        "BloodRequest",
        back_populates="patient",
    )

    # EmergencyRequest back-reference — defined here so the
    # EmergencyRequest mapper can reference it.
    emergency_requests = relationship(
        "EmergencyRequest",
        back_populates="requester",
        foreign_keys="EmergencyRequest.requester_id",
    )

    def __repr__(self):
        return f"<Patient {self.id[:8]} [{self.blood_group}]>"


# ---------------------------------------------------------------------------
# Donor
# ---------------------------------------------------------------------------

class Donor(Base):
    """
    Maps to the existing PostgreSQL table  "Donor".

    Columns verified in DB:
        id, userId, bloodGroup, city, address,
        availabilityStatus, lastDonationDate, createdAt, updatedAt
    """

    __tablename__ = "Donor"

    id = Column(String(36), primary_key=True)

    user_id = Column(
        "userId",
        String(36),
        ForeignKey("User.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    blood_group = Column(
        "bloodGroup",
        Enum(BloodGroup, name="BloodGroup", create_type=False),
        nullable=False,
    )

    city = Column(String(100), nullable=False)

    address = Column(String(255), nullable=True)

    availability_status = Column(
        "availabilityStatus",
        Boolean,
        nullable=False,
        default=True,
    )

    last_donation_date = Column(
        "lastDonationDate",
        DateTime(),
        nullable=True,
    )

    created_at = Column("createdAt", DateTime(), nullable=False)
    updated_at = Column("updatedAt", DateTime(), nullable=False)

    # ----------------------------------------------------------------
    # Relationships
    # ----------------------------------------------------------------

    user = relationship("User", back_populates="donor_profile")

    donations = relationship(
        "Donation",
        back_populates="donor",
    )

    # NOTE: donor_matches and appointments are NOT mapped because those
    # tables do not exist in the current database.

    def __repr__(self):
        return (
            f"<Donor {self.id[:8]} "
            f"[{self.blood_group}] "
            f"avail={self.availability_status}>"
        )


# ---------------------------------------------------------------------------
# Hospital
# ---------------------------------------------------------------------------

class Hospital(Base):
    """
    Maps to the existing PostgreSQL table  "Hospital".

    Columns verified in DB:
        id, userId, hospitalName, registrationNumber,
        city, address, createdAt, updatedAt
    """

    __tablename__ = "Hospital"

    id = Column(String(36), primary_key=True)

    user_id = Column(
        "userId",
        String(36),
        ForeignKey("User.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    hospital_name = Column(
        "hospitalName",
        String(200),
        nullable=False,
    )

    registration_number = Column(
        "registrationNumber",
        String(100),
        nullable=False,
        unique=True,
    )

    city = Column(String(100), nullable=False)

    address = Column(String(255), nullable=True)

    created_at = Column("createdAt", DateTime(), nullable=False)
    updated_at = Column("updatedAt", DateTime(), nullable=False)

    # ----------------------------------------------------------------
    # Relationships
    # ----------------------------------------------------------------

    user = relationship("User", back_populates="hospital_profile")

    blood_requests = relationship(
        "BloodRequest",
        back_populates="hospital",
    )

    donations = relationship(
        "Donation",
        back_populates="hospital",
    )

    emergency_requests = relationship(
        "EmergencyRequest",
        back_populates="hospital",
        foreign_keys="EmergencyRequest.hospital_id",
    )

    # NOTE: blood_inventory is intentionally NOT defined here.
    # The "BloodInventory" table has a "bloodBankId" FK only —
    # there is no "hospitalId" column in BloodInventory.

    def __repr__(self):
        return f"<Hospital {self.hospital_name} [{self.city}]>"


# ---------------------------------------------------------------------------
# BloodBank
# ---------------------------------------------------------------------------

class BloodBank(Base):
    """
    Maps to the existing PostgreSQL table  "BloodBank".

    Columns verified in DB:
        id, userId, name, registrationNumber,
        city, address, createdAt, updatedAt
    """

    __tablename__ = "BloodBank"

    id = Column(String(36), primary_key=True)

    user_id = Column(
        "userId",
        String(36),
        ForeignKey("User.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Prisma model field is "name" (not "bankName")
    name = Column(String(200), nullable=False)

    registration_number = Column(
        "registrationNumber",
        String(100),
        nullable=False,
        unique=True,
    )

    city = Column(String(100), nullable=False)

    address = Column(String(255), nullable=True)

    created_at = Column("createdAt", DateTime(), nullable=False)
    updated_at = Column("updatedAt", DateTime(), nullable=False)

    # ----------------------------------------------------------------
    # Relationships
    # ----------------------------------------------------------------

    user = relationship("User", back_populates="blood_bank_profile")

    blood_inventory = relationship(
        "BloodInventory",
        back_populates="blood_bank",
    )

    donations = relationship(
        "Donation",
        back_populates="blood_bank",
    )

    def __repr__(self):
        return f"<BloodBank {self.name} [{self.city}]>"


