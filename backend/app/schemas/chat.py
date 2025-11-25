"""
Chat Schemas
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.schemas.base import TimestampSchema
from app.models.chat import ChatStatus, MessageSender


class ChatMessageBase(BaseModel):
    """Chat message base schema"""
    message: str


class ChatMessageCreate(ChatMessageBase):
    """Chat message create schema"""
    session_id: str


class ChatMessageResponse(TimestampSchema, ChatMessageBase):
    """Chat message response"""
    session_id: int
    sender: MessageSender
    sender_id: Optional[int] = None
    is_read: bool


class ChatSessionBase(BaseModel):
    """Chat session base schema"""
    session_id: str


class ChatSessionCreate(ChatSessionBase):
    """Chat session create schema"""
    pass


class ChatSessionResponse(TimestampSchema, ChatSessionBase):
    """Chat session response"""
    user_id: Optional[int] = None  # Allow guest users (no user_id)
    username: Optional[str] = None
    status: ChatStatus
    admin_id: Optional[int] = None
    messages: List[ChatMessageResponse] = []


class ChatSessionListResponse(BaseModel):
    """Chat session list response"""
    sessions: List[ChatSessionResponse]
    total: int
