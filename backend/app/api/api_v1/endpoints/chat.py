"""
Chat WebSocket Endpoint
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import json
import logging

from app.core.database import get_db
from app.services.chat_service import ChatService, connection_manager
from app.models.chat import MessageSender, ChatMessage

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    Robust WebSocket Endpoint
    """
    await connection_manager.connect(websocket, session_id)
    
    try:
        # Auto-create session if not exists (handles fallback session IDs)
        try:
            ChatService.get_session(db, session_id)
            logger.info(f"Connected to existing session: {session_id}")
        except Exception:
            logger.warning(f"Session {session_id} not found, creating new session...")
            # Create session with guest user (user_id=None)
            new_session = ChatService.create_session(db, user_id=None)
            # Update the session_id to match the client's expectation
            new_session.session_id = session_id
            db.commit()
            logger.info(f"Created new guest session: {session_id}")
        
        # Send welcome
        await websocket.send_json({
            "type": "system",
            "message": "Connected to chat server"
        })
        
        while True:
            try:
                # Receive & Parse
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                message_content = message_data.get("message")
                if not message_content:
                    continue
                
                # Handle Guest Logic (sender_id can be 0, null, or missing)
                raw_sender_id = message_data.get("sender_id")
                sender_id = None
                if raw_sender_id and str(raw_sender_id).isdigit() and int(raw_sender_id) > 0:
                    sender_id = int(raw_sender_id)
                
                sender_enum = message_data.get("sender", "user")
                sender_type = MessageSender(sender_enum)

                # SAVE TO DB
                try:
                    chat_message = ChatService.save_message(
                        db=db,
                        session_id=session_id,
                        sender=sender_type,
                        sender_id=sender_id,
                        message=message_content
                    )
                    
                    # Broadcast Response
                    response = {
                        "id": chat_message.id,
                        "session_id": session_id, 
                        "sender": chat_message.sender.value,
                        "sender_id": chat_message.sender_id,
                        "message": chat_message.message,
                        "created_at": chat_message.created_at.isoformat()
                    }
                    
                    # Broadcast to ROOM (session_id)
                    await connection_manager.send_message(json.dumps(response), session_id)
                    
                except Exception as db_err:
                    logger.error(f"DB Save Error: {str(db_err)}")
                    await websocket.send_json({"type": "error", "message": "Failed to save message."})

            except WebSocketDisconnect:
                # Client disconnected, exit loop immediately
                logger.info(f"Client disconnected from session: {session_id}")
                break
            except json.JSONDecodeError:
                logger.warning("Invalid JSON received")
                continue
            except Exception as e:
                logger.error(f"WS Loop Error: {str(e)}")
                # Break on critical errors like "Cannot call receive after disconnect"
                if "disconnect" in str(e).lower() or "receive" in str(e).lower():
                    logger.warning("WebSocket already disconnected, breaking loop")
                    break
                continue
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {session_id}")
    finally:
        connection_manager.disconnect(websocket, session_id)
        logger.info(f"Connection cleaned up: {session_id}")


# REST endpoints for chat management
from app.api.deps import get_current_user, get_current_admin_user, get_current_user_optional
from app.models.user import User
from app.schemas.chat import ChatSessionResponse, ChatSessionListResponse, ChatMessageResponse
from typing import List, Optional


@router.post("/sessions", response_model=ChatSessionResponse)
def create_chat_session(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Create new chat session (supports guest users)"""
    user_id = current_user.id if current_user else None
    session = ChatService.create_session(db, user_id)
    return session


@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
def get_session_messages(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Get all messages for a chat session - FIXED: Direct DB Query"""
    # 1. Get session to ensure it exists
    session = ChatService.get_session(db, session_id)
    
    # 2. Query ChatMessage table directly (Fixes lazy loading issue)
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.created_at.asc()).all()
    
    return messages


@router.get("/sessions/my", response_model=ChatSessionListResponse)
def get_my_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's chat sessions"""
    sessions = ChatService.get_user_sessions(db, current_user.id)
    return ChatSessionListResponse(sessions=sessions, total=len(sessions))


@router.get("/sessions", response_model=ChatSessionListResponse)
def get_all_sessions(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all chat sessions (admin only)"""
    sessions = ChatService.get_all_sessions(db)
    return ChatSessionListResponse(sessions=sessions, total=len(sessions))


@router.post("/sessions/{session_id}/close")
def close_session(
    session_id: str,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Close chat session (admin only)"""
    session = ChatService.close_session(db, session_id)
    return {"message": "Session closed", "session": session}
