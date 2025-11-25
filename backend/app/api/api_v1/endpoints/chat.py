"""
Chat WebSocket Endpoint
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
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
    FIXED WEBSOCKET:

    - Không tự tạo session nếu không tồn tại
    - Không tạo session cho guest
    - Không overwrite session_id
    - Không broadcast duplicate
    """
    await connection_manager.connect(websocket, session_id)

    try:
        # Kiểm tra xem session có tồn tại thật không
        session = ChatService.get_session_or_none(db, session_id)

        if session is None:
            # KHÔNG TẠO SESSION MỚI
            logger.warning(f"WebSocket rejected: session {session_id} does not exist")

            await websocket.send_json({
                "type": "error",
                "message": "Chat session not found. Please refresh."
            })
            await websocket.close()
            return

        # Gửi welcome message
        await websocket.send_json({
            "type": "system",
            "message": "Connected to chat server"
        })

        # Vòng chờ tin nhắn
        while True:
            try:
                data = await websocket.receive_text()
                msg = json.loads(data)

                content = msg.get("message")
                if not content:
                    continue

                sender = msg.get("sender", "user")
                sender_type = MessageSender(sender)

                raw_sender_id = msg.get("sender_id")
                sender_id = raw_sender_id if isinstance(raw_sender_id, int) and raw_sender_id > 0 else None

                # Lưu DB
                saved = ChatService.save_message(
                    db=db,
                    session_id=session_id,
                    sender=sender_type,
                    sender_id=sender_id,
                    message=content
                )

                response = {
                    "id": saved.id,
                    "session_id": session_id,
                    "sender": saved.sender.value,
                    "sender_id": saved.sender_id,
                    "message": saved.message,
                    "created_at": saved.created_at.isoformat()
                }

                # Gửi vào 1 phòng duy nhất (không duplicate)
                await connection_manager.send_message(json.dumps(response), session_id)

            except WebSocketDisconnect:
                logger.info(f"Client disconnected: {session_id}")
                break

            except Exception as e:
                logger.error(f"WS Error: {e}")
                break

    finally:
        connection_manager.disconnect(websocket, session_id)
        logger.info(f"WebSocket closed for session {session_id}")


# REST endpoints
from app.api.deps import get_current_user, get_current_admin_user, get_current_user_optional
from app.models.user import User
from app.schemas.chat import ChatSessionResponse, ChatSessionListResponse, ChatMessageResponse
from typing import List, Optional


@router.post("/sessions", response_model=ChatSessionResponse)
def create_chat_session(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    FIXED:
    - Mỗi user chỉ có 1 session
    - Guest không thể tạo session
    """
    if not current_user:
        raise Exception("Guest users cannot create chat sessions")

    existing = ChatService.get_existing_session_for_user(db, current_user.id)
    if existing:
        return existing

    return ChatService.create_session(db, current_user.id)


@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
def get_session_messages(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Fetch messages for a session"""
    session = ChatService.get_session(db, session_id)
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.created_at.asc()).all()

    return messages


@router.get("/sessions/my", response_model=ChatSessionListResponse)
def get_my_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = ChatService.get_user_sessions(db, current_user.id)
    return ChatSessionListResponse(sessions=sessions, total=len(sessions))


@router.get("/sessions", response_model=ChatSessionListResponse)
def get_all_sessions(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    sessions = ChatService.get_all_sessions(db)
    return ChatSessionListResponse(sessions=sessions, total=len(sessions))


@router.post("/sessions/{session_id}/close")
def close_session(
    session_id: str,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    session = ChatService.close_session(db, session_id)
    return {"message": "Session closed"}
