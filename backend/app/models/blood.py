"""
Blood-related SQLAlchemy models.

Every table name, column name, and foreign key reference here has been
verified against the live PostgreSQL database produced by Prisma.

Tables that exist in the DB:
    "BloodInventory"    — blood stock at a blood bank
    "BloodRequest"      — requests for blood (patient or hospital)
    "Donation"          — completed/in-progress donations

Tables that do NOT exist in the current DB (kept as Python-only stubs
that are NOT registered with the SQLAlchemy mapper):
    DonorMatch          — future feature
    Appointment         — future feature

DB column names are camelCase (Prisma convention).  SQLAlchemy maps
them with the Column("camelName", ...) form so Python code can use
snake_case attributes.
"""

from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    Enum,
    Text,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base
from .enums import BloodGroup, RequestStatus


# ---------------------------------------------------------------------------
# BloodInventory
# ---------------------------------------------------------------------------

class BloodInventory(Base):
    """
    Maps to the existing PostgreSQL table  "BloodInventory".

    Columns verified in DB:
        id, bloodBankId, bloodGroup, unitsAvailable,
        unitsReserved, expiryDate, updatedAt
    """

    __tablename__ = "BloodInventory"

    id = Column(String(36), primary_key=True)

    blood_bank_id = Column(
        "bloodBankId",
        String(36),
        ForeignKey("BloodBank.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    blood_group = Column(
        "bloodGroup",
        Enum(BloodGroup, name="BloodGroup", create_type=False),
        nullable=False,
    )

    units_available = Column(
        "unitsAvailable",
        Integer,
        nullable=False,
        default=0,
    )

    units_reserved = Column(
        "unitsReserved",
        Integer,
        nullable=False,
        default=0,
    )

    # Stored as timestamp in DB (Prisma DateTime maps to TIMESTAMP)
    expiry_date = Column(
        "expiryDate",
        DateTime(),
        nullable=False,
    )

    updated_at = Column(
        "updatedAt",
        DateTime(),
        default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # ----------------------------------------------------------------
    # Relationships
    # ----------------------------------------------------------------

    blood_bank = relationship(
        "BloodBank",
        back_populates="blood_inventory",
    )

    def __repr__(self):
        return (
            f"<BloodInventory {self.blood_group} "
            f"avail={self.units_available} "
            f"bank={self.blood_bank_id}>"
        )


# ---------------------------------------------------------------------------
# BloodRequest
# ---------------------------------------------------------------------------

class BloodRequest(Base):
    """
    Maps to the existing PostgreSQL table  "BloodRequest".

    Columns verified in DB:
        id, patientId, hospitalId, bloodGroup, unitsRequired,
        urgency, status, city, notes, createdAt, updatedAt

    NOTE:
        urgency  — VARCHAR (not a PG enum)
        status   — PG enum "RequestStatus"
    """

    __tablename__ = "BloodRequest"

    id = Column(String(36), primary_key=True)

    patient_id = Column(
        "patientId",
        String(36),
        ForeignKey("Patient.id", ondelete="SET NULL"),
        nullable=True,
    )

    hospital_id = Column(
        "hospitalId",
        String(36),
        ForeignKey("Hospital.id", ondelete="SET NULL"),
        nullable=True,
    )

    blood_group = Column(
        "bloodGroup",
        Enum(BloodGroup, name="BloodGroup", create_type=False),
        nullable=False,
    )

    units_required = Column(
        "unitsRequired",
        Integer,
        nullable=False,
    )

    # Stored as VARCHAR in DB — urgency is NOT a PostgreSQL enum
    urgency = Column(
        String(50),
        nullable=False,
    )

    status = Column(
        Enum(RequestStatus, name="RequestStatus", create_type=False),
        nullable=False,
    )

    city = Column(String(100), nullable=False)

    # The DB column is "notes" (not "medical_notes" or "medicalNotes")
    notes = Column(String, nullable=True)

    created_at = Column(
        "createdAt",
        DateTime(),
        default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        "updatedAt",
        DateTime(),
        default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # ----------------------------------------------------------------
    # Relationships
    # ----------------------------------------------------------------

    patient = relationship(
        "Patient",
        back_populates="blood_requests",
    )

    hospital = relationship(
        "Hospital",
        back_populates="blood_requests",
    )

    # NOTE: The DB 'Donation' table has no requestId / FK back to
    # BloodRequest, so there is no ORM relationship here.

    def __repr__(self):
        return (
            f"<BloodRequest {self.id[:8]} "
            f"{self.blood_group} "
            f"[{self.status}]>"
        )


# ---------------------------------------------------------------------------
# Donation
# ---------------------------------------------------------------------------

class Donation(Base):
    """
    Maps to the existing PostgreSQL table  "Donation".

    Columns verified in DB:
        id, donorId, bloodBankId, hospitalId, bloodGroup,
        units, donationDate, status, createdAt

    NOTE: status is VARCHAR (not a PG enum).
    NOTE: There is NO requestId / request_id column in this table.
    """

    __tablename__ = "Donation"

    id = Column(String(36), primary_key=True)

    donor_id = Column(
        "donorId",
        String(36),
        ForeignKey("Donor.id", ondelete="CASCADE"),
        nullable=False,
    )

    blood_bank_id = Column(
        "bloodBankId",
        String(36),
        ForeignKey("BloodBank.id", ondelete="SET NULL"),
        nullable=True,
    )

    hospital_id = Column(
        "hospitalId",
        String(36),
        ForeignKey("Hospital.id", ondelete="SET NULL"),
        nullable=True,
    )

    blood_group = Column(
        "bloodGroup",
        Enum(BloodGroup, name="BloodGroup", create_type=False),
        nullable=False,
    )

    units = Column(Integer, nullable=False)

    donation_date = Column(
        "donationDate",
        DateTime(),
        default=func.now(),
        nullable=False,
    )

    # VARCHAR in DB — not a PG enum
    status = Column(String(50), nullable=False)

    created_at = Column(
        "createdAt",
        DateTime(),
        default=func.now(),
        nullable=False,
    )

    # ----------------------------------------------------------------
    # Relationships
    # ----------------------------------------------------------------

    donor = relationship(
        "Donor",
        back_populates="donations",
    )

    blood_bank = relationship(
        "BloodBank",
        back_populates="donations",
    )

    hospital = relationship(
        "Hospital",
        back_populates="donations",
    )

    # NOTE: The DB has no requestId column in Donation, so there is no
    # ORM relationship back to BloodRequest.

    def __repr__(self):
        return (
            f"<Donation {self.donor_id[:8]} "
            f"{self.blood_group} "
            f"{self.units}u "
            f"[{self.status}]>"
        )


# ---------------------------------------------------------------------------
# Non-DB stubs  (tables that do not exist in the current database)
# ---------------------------------------------------------------------------
# DonorMatch and Appointment are defined as plain Python classes (NOT
# SQLAlchemy mapped models).  They are kept here so that application
# code that references them does not produce ImportError, but they will
# not participate in SQLAlchemy mapper configuration and will not try
# to access non-existent tables.
# ---------------------------------------------------------------------------

class DonorMatch:
    """
    Stub — the 'donor_matches' table does not exist in the database.
    This class exists only to prevent ImportError in existing code.
    Do not use it for database queries.
    """
    pass


class Appointment:
    """
    Stub — the 'appointments' table does not exist in the database.
    This class exists only to prevent ImportError in existing code.
    Do not use it for database queries.
    """
    pass

