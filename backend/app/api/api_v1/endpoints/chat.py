"""
Chat WebSocket Endpoint
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import json

from app.core.database import get_db
from app.services.chat_service import ChatService, connection_manager
from app.models.chat import MessageSender

router = APIRouter()


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time chat
    
    Client sends: {"sender": "user|admin", "sender_id": 123, "message": "Hello"}
    Server broadcasts: Same format to all connections in session
    """
    await connection_manager.connect(websocket, session_id)
    
    try:
        # Verify session exists
        session = ChatService.get_session(db, session_id)
        
        # Send welcome message
        await websocket.send_json({
            "type": "system",
            "message": f"Connected to chat session {session_id}"
        })
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Save message to database
            sender_type = MessageSender(message_data.get("sender", "user"))
            sender_id = message_data.get("sender_id")
            message_text = message_data.get("message")
            
            chat_message = ChatService.save_message(
                db=db,
                session_id=session_id,
                sender=sender_type,
                sender_id=sender_id,
                message=message_text
            )
            
            # Broadcast to all connected clients
            response = {
                "id": chat_message.id,
                "sender": chat_message.sender.value,
                "sender_id": chat_message.sender_id,
                "message": chat_message.message,
                "created_at": chat_message.created_at.isoformat()
            }
            
            await connection_manager.send_message(
                json.dumps(response),
                session_id
            )
            
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, session_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        connection_manager.disconnect(websocket, session_id)


# REST endpoints for chat management
from app.api.deps import get_current_user, get_current_admin_user
from app.models.user import User
from app.schemas.chat import ChatSessionResponse, ChatSessionListResponse


@router.post("/sessions", response_model=ChatSessionResponse)
def create_chat_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new chat session"""
    session = ChatService.create_session(db, current_user.id)
    return session


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
