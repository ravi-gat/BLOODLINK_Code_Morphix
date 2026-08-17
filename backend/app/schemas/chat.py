"""Pydantic schemas for chat endpoints."""
from pydantic import BaseModel, field_validator
from typing import Optional


class ChatMessageCreate(BaseModel):
    receiver_id: str
    message: str
    request_id: Optional[str] = None

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty.")
        if len(v) > 2000:
            raise ValueError("Message is too long (max 2000 characters).")
        return v


class ChatMessageResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    request_id: Optional[str] = None
    message: str
    is_read: bool
    created_at: str
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None

    model_config = {"from_attributes": True}


class ConversationSummary(BaseModel):
    other_user_id: str
    other_user_name: Optional[str] = None
    other_user_role: Optional[str] = None
    last_message: str
    last_message_at: str
    unread_count: int
