"""
BloodLink SQLAlchemy profile models.
Mapped to the existing Prisma PostgreSQL database.
"""

from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base
from .enums import BloodGroup


class Patient(Base):

    __tablename__ = "Patient"

    id = Column(String(36), primary_key=True)

    user_id = Column(
        "userId",
        String(36),
        ForeignKey("User.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        unique=True,
    )

    blood_group = Column(
        "bloodGroup",
        Enum(BloodGroup, name="BloodGroup", create_type=False),
        nullable=False,
    )

    city = Column(String(100), nullable=False)

    address = Column(String(255), nullable=True)

    created_at = Column(
        "createdAt",
        DateTime(),
        nullable=False,
        default=func.now(),
    )

    updated_at = Column(
        "updatedAt",
        DateTime(),
        nullable=False,
        default=func.now(),
        onupdate=func.now(),
    )

    user = relationship( 
        "User",
        back_populates="patient_profile",
    )

    blood_requests = relationship(
        "BloodRequest",
        back_populates="patient",
    )

    emergency_requests = relationship(
        "EmergencyRequest",
        back_populates="requester",
    )


class Donor(Base):

    __tablename__ = "Donor"

    id = Column(String(36), primary_key=True)

    user_id = Column(
        "userId",
        String(36),
        ForeignKey("User.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        unique=True,
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

    created_at = Column(
        "createdAt",
        DateTime(),
        nullable=False,
        default=func.now(),
    )

    updated_at = Column(
        "updatedAt",
        DateTime(),
        nullable=False,
        default=func.now(),
        onupdate=func.now(),
    )

    user = relationship(
        "User",
        back_populates="donor_profile",
    )

    donations = relationship(
        "Donation",
        back_populates="donor",
    )


class Hospital(Base):

    __tablename__ = "Hospital"

    id = Column(String(36), primary_key=True)

    user_id = Column(
        "userId",
        String(36),
        ForeignKey("User.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        unique=True,
    )

    hospital_name = Column(
        "hospitalName",
        String(200),
        nullable=False,
    )

    registration_number = Column(
        "registrationNumber",
        String(100),
        unique=True,
        nullable=False,
    )

    city = Column(String(100), nullable=False)
    address = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    created_at = Column(
        "createdAt",
        DateTime(),
        nullable=False,
        default=func.now(),
    )

    updated_at = Column(
        "updatedAt",
        DateTime(),
        nullable=False,
        default=func.now(),
        onupdate=func.now(),
    )

    user = relationship(
        "User",
        back_populates="hospital_profile",
    )

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
    )


class BloodBank(Base):

    __tablename__ = "BloodBank"

    id = Column(String(36), primary_key=True)

    user_id = Column(
        "userId",
        String(36),
        ForeignKey("User.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        unique=True,
    )

    name = Column(
        String(200),
        nullable=False,
    )

    registration_number = Column(
        "registrationNumber",
        String(100),
        unique=True,
        nullable=False,
    )

    city = Column(String(100), nullable=False)
    address = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    created_at = Column(
        "createdAt",
        DateTime(),
        nullable=False,
        default=func.now(),
    )

    updated_at = Column(
        "updatedAt",
        DateTime(),
        nullable=False,
        default=func.now(),
        onupdate=func.now(),
    )

    user = relationship(
        "User",
        back_populates="blood_bank_profile",
    )

    blood_inventory = relationship(
        "BloodInventory",
        back_populates="blood_bank",
    )

    donations = relationship(
        "Donation",
        back_populates="blood_bank",
    )
