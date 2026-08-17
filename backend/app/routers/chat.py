"""
Chat API router.

POST /api/chat/messages
GET  /api/chat/conversations
GET  /api/chat/{user_id}

The chat_messages table does NOT exist in the current PostgreSQL database.
All chat endpoints return empty results or a 503 stub response until
the table is created via a Prisma migration.

Architecture is prepared for real implementation once the table exists.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.deps import get_current_user
from ..models.user import User
from ..schemas.chat import ChatMessageCreate, ChatMessageResponse, ConversationSummary

router = APIRouter(prefix="/chat", tags=["Chat"])

_NOT_IMPLEMENTED_MSG = (
    "Chat is not yet available. "
    "The chat_messages table has not been created in this database. "
    "Add it via a Prisma migration to enable this feature."
)


@router.post("/messages", response_model=ChatMessageResponse, status_code=201)
def send_message(
    body: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raise HTTPException(status_code=503, detail=_NOT_IMPLEMENTED_MSG)


@router.get("/conversations", response_model=list[ConversationSummary])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns empty list — chat table not yet in DB."""
    return []


@router.get("/{other_user_id}", response_model=list[ChatMessageResponse])
def get_conversation(
    other_user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns empty list — chat table not yet in DB."""
    return []
