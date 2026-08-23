"""
User model — central authentication record.

Mapped to the existing Prisma PostgreSQL "User" table.
"""

from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base
from .enums import UserRole, UserStatus


class User(Base):
    """
    SQLAlchemy model for the existing PostgreSQL "User" table.
    """

    __tablename__ = "User"

    # =========================================================
    # PRIMARY KEY
    # =========================================================

    id = Column(
        String(36),
        primary_key=True,
    )

    # =========================================================
    # BASIC INFORMATION
    # =========================================================

    full_name = Column(
        "name",
        String(100),
        nullable=False,
    )

    email = Column(
        String(254),
        unique=True,
        nullable=False,
        index=True,
    )

    phone = Column(
        String(20),
        nullable=False,
    )

    # =========================================================
    # AUTHENTICATION
    # =========================================================

    password_hash = Column(
        "passwordHash",
        String(255),
        nullable=False,
    )

    # =========================================================
    # ROLE
    # =========================================================

    role = Column(
        Enum(
            UserRole,
            name="Role",
            create_type=False,
        ),
        nullable=False,
        index=True,
    )

    # =========================================================
    # STATUS
    # =========================================================

    status = Column(
        Enum(
            UserStatus,
            name="UserStatus",
            create_type=False,
        ),
        nullable=False,
        index=True,
    )

    # =========================================================
    # TIMESTAMPS
    # =========================================================

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

    # =========================================================
    # ROLE-SPECIFIC PROFILES
    # =========================================================

    patient_profile = relationship(
        "Patient",
        back_populates="user",
        uselist=False,
    )

    donor_profile = relationship(
        "Donor",
        back_populates="user",
        uselist=False,
    )

    hospital_profile = relationship(
        "Hospital",
        back_populates="user",
        uselist=False,
    )

    blood_bank_profile = relationship(
        "BloodBank",
        back_populates="user",
        uselist=False,
    )

    # =========================================================
    # NOTIFICATIONS
    # =========================================================

    notifications = relationship(
        "Notification",
        back_populates="user",
    )

    # =========================================================
    # AUDIT LOGS
    # =========================================================

    audit_logs = relationship(
        "AuditLog",
        back_populates="user",
    )

    # =========================================================
    # NOTE
    # =========================================================
    #
    # ChatMessage relationships are intentionally NOT defined.
    #
    # The existing PostgreSQL database does not contain a
    # chat_messages table, so defining these relationships causes
    # SQLAlchemy mapper configuration to fail.
    #
    # They can be added later when the chat table is implemented.
    #
    # =========================================================

    def __repr__(self):
        role = self.role.value if self.role else "UNKNOWN"
        return f"<User {self.email} [{role}]>"