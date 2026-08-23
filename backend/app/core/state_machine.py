"""
Explicit State Machine validators for BloodLink blood requests and emergency requisitions.
Enforces strict healthcare-grade status transitions and prevents invalid or retroactive status mutations.
"""
from fastapi import HTTPException, status
from ..models.enums import RequestStatus, EmergencyStatus


# Valid forward & cancellation transitions for standard BloodRequest
# DB Enum: PENDING, ACCEPTED, PROCESSING, FULFILLED, REJECTED, CANCELLED
VALID_REQUEST_TRANSITIONS = {
    RequestStatus.PENDING: {
        RequestStatus.ACCEPTED,
        RequestStatus.PROCESSING,
        RequestStatus.CANCELLED,
        RequestStatus.REJECTED,
    },
    RequestStatus.ACCEPTED: {
        RequestStatus.PROCESSING,
        RequestStatus.FULFILLED,
        RequestStatus.CANCELLED,
        RequestStatus.REJECTED,
    },
    RequestStatus.PROCESSING: {
        RequestStatus.FULFILLED,
        RequestStatus.CANCELLED,
        RequestStatus.REJECTED,
    },
    RequestStatus.FULFILLED: set(),  # Terminal state
    RequestStatus.REJECTED: set(),   # Terminal state
    RequestStatus.CANCELLED: set(),  # Terminal state
}

# Valid forward & cancellation transitions for EmergencyRequest
# DB Enum: PENDING, ACTIVE, MATCHED, FULFILLED, CANCELLED, EXPIRED
VALID_EMERGENCY_TRANSITIONS = {
    EmergencyStatus.PENDING: {
        EmergencyStatus.ACTIVE,
        EmergencyStatus.MATCHED,
        EmergencyStatus.CANCELLED,
        EmergencyStatus.EXPIRED,
    },
    EmergencyStatus.ACTIVE: {
        EmergencyStatus.MATCHED,
        EmergencyStatus.FULFILLED,
        EmergencyStatus.CANCELLED,
        EmergencyStatus.EXPIRED,
    },
    EmergencyStatus.MATCHED: {
        EmergencyStatus.FULFILLED,
        EmergencyStatus.CANCELLED,
        EmergencyStatus.EXPIRED,
    },
    EmergencyStatus.FULFILLED: set(),  # Terminal state
    EmergencyStatus.CANCELLED: set(),  # Terminal state
    EmergencyStatus.EXPIRED: set(),    # Terminal state
}


def validate_request_transition(current_status: RequestStatus, new_status: RequestStatus) -> None:
    """
    Validate that transition from current_status to new_status is allowed.
    Raises HTTP 400 Bad Request if invalid.
    """
    if current_status == new_status:
        return

    allowed = VALID_REQUEST_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        current_label = current_status.value if hasattr(current_status, "value") else str(current_status)
        new_label = new_status.value if hasattr(new_status, "value") else str(new_status)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid blood request status transition from '{current_label}' to '{new_label}'.",
        )


def validate_emergency_transition(current_status: EmergencyStatus, new_status: EmergencyStatus) -> None:
    """
    Validate that transition from current_status to new_status is allowed.
    Raises HTTP 400 Bad Request if invalid.
    """
    if current_status == new_status:
        return

    allowed = VALID_EMERGENCY_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        current_label = current_status.value if hasattr(current_status, "value") else str(current_status)
        new_label = new_status.value if hasattr(new_status, "value") else str(new_status)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid emergency request status transition from '{current_label}' to '{new_label}'.",
        )
