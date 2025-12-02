"""
Chatbot REST API Endpoints
Simple REST API for chatbot (no WebSocket needed)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user_optional
from app.models.user import User
from app.services.chatbot_service import ChatbotService
from app.models.chat import MessageSender


router = APIRouter()


# Schemas
class ChatMessageCreate(BaseModel):
    message: str


class ChatMessageResponse(BaseModel):
    id: int
    message: str
    sender: str
    created_at: str
    
    class Config:
        from_attributes = True


class ChatSendResponse(BaseModel):
    user_message: ChatMessageResponse
    bot_message: Optional[ChatMessageResponse] = None


class ChatSessionResponse(BaseModel):
    id: int
    session_id: str
    status: str
    created_at: str
    
    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    session: ChatSessionResponse
    messages: List[ChatMessageResponse]


# Endpoints
@router.post("/start", response_model=ChatSessionResponse)
def start_chat_session(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Start a new chat session or get existing one
    Works for both authenticated and guest users
    """
    user_id = current_user.id if current_user else None
    
    if user_id:
        # For logged in users, get or create session
        session = ChatbotService.get_or_create_user_session(db, user_id)
    else:
        # For guests, create new session
        session = ChatbotService.create_session(db, None)
    
    return ChatSessionResponse(
        id=session.id,
        session_id=session.session_id,
        status=session.status.value,
        created_at=session.created_at.isoformat()
    )


@router.post("/{session_id}/messages", response_model=ChatSendResponse)
def send_chat_message(
    session_id: str,
    message_data: ChatMessageCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Send a message and get automatic bot response
    """
    # Get session
    session = ChatbotService.get_session_by_session_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Send message and get response
    sender_id = current_user.id if current_user else None
    result = ChatbotService.send_message(
        db=db,
        session_id=session.id,
        message=message_data.message,
        sender=MessageSender.USER,
        sender_id=sender_id
    )
    
    # Format response
    response = ChatSendResponse(
        user_message=ChatMessageResponse(**result['user_message'])
    )
    
    if 'bot_message' in result:
        response.bot_message = ChatMessageResponse(**result['bot_message'])
    
    return response


@router.get("/{session_id}/history", response_model=ChatHistoryResponse)
def get_chat_history(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    Get chat history for a session
    """
    session = ChatbotService.get_session_by_session_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    messages = ChatbotService.get_session_messages(db, session.id)
    
    return ChatHistoryResponse(
        session=ChatSessionResponse(
            id=session.id,
            session_id=session.session_id,
            status=session.status.value,
            created_at=session.created_at.isoformat()
        ),
        messages=[
            ChatMessageResponse(
                id=msg.id,
                message=msg.message,
                sender=msg.sender.value,
                created_at=msg.created_at.isoformat()
            )
            for msg in messages
        ]
    )
