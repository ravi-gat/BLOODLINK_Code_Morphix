"""
Notification and AuditLog SQLAlchemy models.

Every table name and column name here has been verified against
the live PostgreSQL database produced by Prisma.

Tables that exist in the DB:
    "Notification"   — user notifications
    "AuditLog"       — immutable audit trail

Tables that do NOT exist in the current DB (plain Python stubs —
NOT registered with SQLAlchemy mapper):
    Reward
    RewardTransaction
    ChatMessage
"""

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from ..core.database import Base


def _uuid():
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Notification
# ---------------------------------------------------------------------------

class Notification(Base):
    """
    Maps to the existing PostgreSQL table  "Notification".

    Columns verified in DB:
        id, userId, title, message, type, isRead, createdAt
    """

    __tablename__ = "Notification"

    id = Column(String(36), primary_key=True, default=_uuid)

    user_id = Column(
        "userId",
        String(36),
        ForeignKey("User.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String(255), nullable=False)

    message = Column(Text, nullable=False)

    # Stored as VARCHAR — not a PostgreSQL enum
    type = Column(String(100), nullable=False)

    is_read = Column(
        "isRead",
        Boolean,
        nullable=False,
        default=False,
    )

    created_at = Column(
        "createdAt",
        DateTime(),
        default=func.now(),
        nullable=False,
    )

    # ----------------------------------------------------------------
    # Relationships
    # ----------------------------------------------------------------

    user = relationship("User", back_populates="notifications")

    # ----------------------------------------------------------------
    # Indexes (mirrors Prisma @@index([userId, isRead]))
    # ----------------------------------------------------------------

    __table_args__ = (
        Index("Notification_userId_isRead_idx", "userId", "isRead"),
    )

    def __repr__(self):
        return (
            f"<Notification {self.user_id[:8]} "
            f"[{self.type}] "
            f"read={self.is_read}>"
        )


# ---------------------------------------------------------------------------
# AuditLog
# ---------------------------------------------------------------------------

class AuditLog(Base):
    """
    Maps to the existing PostgreSQL table  "AuditLog".

    Columns verified in DB:
        id, userId, action, entity, entityId, metadata, createdAt

    NOTE: columns ip_address, user_agent, and extra do NOT exist
    in this table.  The JSON column is called "metadata".
    """

    __tablename__ = "AuditLog"

    id = Column(String(36), primary_key=True, default=_uuid)

    user_id = Column(
        "userId",
        String(36),
        ForeignKey("User.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    action = Column(String(100), nullable=False)

    # Prisma schema: entity String (not nullable in schema, but allow
    # null at the SQLAlchemy level for robustness)
    entity = Column(String(100), nullable=True)

    entity_id = Column(
        "entityId",
        String(36),
        nullable=True,
    )

    # The column is "metadata" (Json? in Prisma → JSON in SQLAlchemy)
    metadata_ = Column(
        "metadata",
        JSON,
        nullable=True,
    )

    created_at = Column(
        "createdAt",
        DateTime(),
        default=func.now(),
        nullable=False,
    )

    # ----------------------------------------------------------------
    # Relationships
    # ----------------------------------------------------------------

    user = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog {self.action} by={self.user_id}>"


# ---------------------------------------------------------------------------
# Non-DB stubs
# ---------------------------------------------------------------------------
# The tables below do NOT exist in the current PostgreSQL database.
# They are defined as plain Python classes so that any application
# code that references them gets an ImportError-free experience,
# but they will NOT be registered with the SQLAlchemy mapper and
# will NOT cause configure_mappers() to fail.
# ---------------------------------------------------------------------------

class Reward:
    """
    Stub — no 'rewards' table in the current database.
    Do not use for database queries.
    """
    def __init__(self, donor_id=None, points=0, level="Bronze"):
        self.donor_id = donor_id
        self.points = points
        self.level = level


class RewardTransaction:
    """
    Stub — no 'reward_transactions' table in the current database.
    Do not use for database queries.
    """
    pass


class ChatMessage:
    """
    Stub — no 'chat_messages' table in the current database.
    Do not use for database queries.
    """
    pass

