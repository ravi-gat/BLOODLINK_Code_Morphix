"""Pydantic schemas for notification endpoints."""
from pydantic import BaseModel
from typing import Optional, Any, Dict


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    created_at: str

    model_config = {"from_attributes": True}


class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: str = "info"
    link: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
