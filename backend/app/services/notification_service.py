"""
Notification service — creates database-backed notifications.

The "Notification" table columns (verified):
    id, userId, title, message, type, isRead, createdAt

type is stored as VARCHAR. link and meta do NOT exist in the DB,
so they are omitted when creating notifications.
"""
from sqlalchemy.orm import Session
from ..models.notifications import Notification
import logging

logger = logging.getLogger(__name__)

# Notification type strings (VARCHAR in DB — not a PG enum)
TYPE_EMERGENCY = "emergency"
TYPE_MATCH     = "match"
TYPE_REWARD    = "reward"
TYPE_INFO      = "info"
TYPE_SYSTEM    = "system"
TYPE_REMINDER  = "reminder"
TYPE_APPROVAL  = "approval"


def create_notification(
    db: Session,
    user_id: str,
    title: str,
    message: str,
    notification_type: str = TYPE_INFO,
) -> Notification:
    """
    Create and persist a notification for a user.

    notification_type must be a plain string matching one of the
    TYPE_* constants above (VARCHAR column, not a PG enum).
    """
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        is_read=False,
    )
    db.add(notif)
    db.flush()
    logger.debug(f"Created notification for user {user_id}: {title}")
    return notif


def notify_emergency_request(
    db: Session,
    request,
    matched_donor_ids: list[str],
) -> None:
    """Notify matched donors about a new emergency blood request."""
    from ..models.profiles import Donor

    bg_label = (
        str(request.blood_group)
        .replace("_POS", "+")
        .replace("_NEG", "-")
    )

    for donor_id in matched_donor_ids:
        donor = db.query(Donor).filter(Donor.id == donor_id).first()
        if not donor:
            continue
        create_notification(
            db=db,
            user_id=donor.user_id,
            title="Emergency Blood Request",
            message=(
                f"An urgent {bg_label} blood request has been raised "
                f"in {request.city}. Please check if you can help."
            ),
            notification_type=TYPE_EMERGENCY,
        )


def notify_donor_accepted(db: Session, request, donor) -> None:
    """Notify patient/hospital that a donor has accepted their request."""
    from ..models.profiles import Patient, Hospital

    if request.patient_id:
        patient = db.query(Patient).filter(Patient.id == request.patient_id).first()
        if patient:
            create_notification(
                db=db,
                user_id=patient.user_id,
                title="Donor Accepted Your Request",
                message=(
                    "A compatible donor has accepted your blood request. "
                    "Please coordinate with the hospital."
                ),
                notification_type=TYPE_MATCH,
            )

    if request.hospital_id:
        hospital = db.query(Hospital).filter(Hospital.id == request.hospital_id).first()
        if hospital:
            create_notification(
                db=db,
                user_id=hospital.user_id,
                title="Donor Accepted Blood Request",
                message=(
                    f"A donor has accepted request #{request.id[:8]}. "
                    "Please prepare for donation processing."
                ),
                notification_type=TYPE_MATCH,
            )
