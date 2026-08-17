"""
Notification API router.

GET /api/notifications
PUT /api/notifications/{id}/read
PUT /api/notifications/read-all

DB columns in "Notification" (verified):
    id, userId, title, message, type, isRead, createdAt
    NOTE: No 'link' or 'meta' column exists.
    NOTE: 'type' is VARCHAR — not an enum, use str directly.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.deps import get_current_user
from ..models.user import User
from ..models.notifications import Notification
from ..schemas.notification import NotificationResponse
from ..utils.helpers import fmt_datetime

router = APIRouter(tags=["Notifications"])


def _notif_response(n: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=n.id,
        user_id=n.user_id,
        title=n.title,
        message=n.message,
        type=n.type,          # VARCHAR string — no .value needed
        is_read=n.is_read,
        link=None,            # no 'link' column in DB
        meta=None,            # no 'meta' column in DB
        created_at=fmt_datetime(n.created_at) or "",
    )


@router.get("/notifications", response_model=list[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return [_notif_response(n) for n in rows]


@router.put("/notifications/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"isRead": True})   # use actual DB column name in the update dict
    db.commit()
    return {"success": True, "message": "All notifications marked as read."}


@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    if notif.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your notification.")

    notif.is_read = True
    db.commit()
    return {"success": True, "data": _notif_response(notif)}
