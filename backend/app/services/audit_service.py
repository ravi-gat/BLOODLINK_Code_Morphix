"""
Audit log service.

Records user actions for security review and debugging.
Never log passwords, tokens, or other sensitive values.

DB table "AuditLog" columns (verified):
    id, userId, action, entity, entityId, metadata, createdAt
"""
from sqlalchemy.orm import Session
from ..models.notifications import AuditLog
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def log_action(
    db: Session,
    action: str,
    user_id: Optional[str] = None,
    entity: Optional[str] = None,
    entity_id: Optional[str] = None,
    # ip_address and extra are accepted for call-site compatibility
    # but stored in the JSON metadata column, not as separate columns
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    extra: Optional[dict] = None,
) -> None:
    """
    Write an audit log entry to the existing "AuditLog" table.

    ip_address, user_agent, and extra are merged into the metadata
    JSON column because those columns do not exist in the DB schema.
    """
    try:
        # Build metadata from optional contextual fields
        meta: Optional[dict] = None
        context = {}
        if ip_address:
            context["ip"] = ip_address
        if user_agent:
            context["ua"] = user_agent
        if extra:
            context.update(extra)
        if context:
            meta = context

        entry = AuditLog(
            user_id=user_id,
            action=action,
            entity=entity,
            entity_id=entity_id,
            metadata_=meta,   # maps to the "metadata" column
        )
        db.add(entry)
        db.flush()
    except Exception as exc:
        # Audit failures must never break the main request
        logger.error(f"Failed to write audit log [{action}]: {exc}")
