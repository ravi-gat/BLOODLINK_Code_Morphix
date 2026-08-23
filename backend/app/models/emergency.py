"""
EmergencyRequest SQLAlchemy model.

Maps to the existing PostgreSQL table  "EmergencyRequest"
produced by the Prisma migration.

Columns verified in DB:
    id, requesterId, hospitalId, bloodGroup, unitsRequired,
    city, urgency, status, createdAt, updatedAt

Foreign keys verified in DB:
    requesterId  →  Patient.id
    hospitalId   →  Hospital.id   (nullable)

Enum types:
    bloodGroup  →  PostgreSQL enum "BloodGroup"
    status      →  PostgreSQL enum "EmergencyStatus"
    urgency     →  VARCHAR (not a PostgreSQL enum)
"""

from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    Enum,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base
from .enums import BloodGroup, EmergencyStatus


class EmergencyRequest(Base):
    """
    An urgent blood request raised by a patient, optionally linked
    to a hospital.

    Maps to the existing PostgreSQL table  "EmergencyRequest".
    """

    __tablename__ = "EmergencyRequest"

    # ----------------------------------------------------------------
    # Primary key
    # ----------------------------------------------------------------

    id = Column(String(36), primary_key=True)

    # ----------------------------------------------------------------
    # Foreign keys  (verified against live DB)
    # ----------------------------------------------------------------

    # requesterId → Patient.id  (required, not nullable)
    requester_id = Column(
        "requesterId",
        String(36),
        ForeignKey("Patient.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # hospitalId → Hospital.id  (optional)
    hospital_id = Column(
        "hospitalId",
        String(36),
        ForeignKey("Hospital.id", ondelete="SET NULL"),
        nullable=True,
    )

    # ----------------------------------------------------------------
    # Blood request fields
    # ----------------------------------------------------------------

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

    city = Column(String(100), nullable=False)

    # urgency is VARCHAR in the DB — not a PostgreSQL enum
    urgency = Column(String(50), nullable=False)

    status = Column(
        Enum(EmergencyStatus, name="EmergencyStatus", create_type=False),
        nullable=False,
    )

    # ----------------------------------------------------------------
    # Timestamps
    # ----------------------------------------------------------------

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

    requester = relationship(
        "Patient",
        back_populates="emergency_requests",
        foreign_keys=[requester_id],
    )

    hospital = relationship(
        "Hospital",
        back_populates="emergency_requests",
        foreign_keys=[hospital_id],
    )

    def __repr__(self):
        return (
            f"<EmergencyRequest {self.id[:8]} "
            f"{self.blood_group} "
            f"[{self.status}]>"
        )

