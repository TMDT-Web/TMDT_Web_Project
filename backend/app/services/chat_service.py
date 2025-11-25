# --- FILE: app/services/chat_service.py ---

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional, List
from datetime import datetime

from app.models.chat import ChatSession, ChatMessage, ChatStatus, MessageSender
from app.models.user import User

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list] = {}

    async def connect(self, websocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, websocket, session_id: str):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def send_message(self, message: str, session_id: str):
        if session_id in self.active_connections:
            for ws in list(self.active_connections[session_id]):
                try:
                    await ws.send_text(message)
                except:
                    self.disconnect(ws, session_id)

connection_manager = ConnectionManager()


class ChatService:

    @staticmethod
    def get_session_or_none(db: Session, session_uuid: str) -> Optional[ChatSession]:
        return db.query(ChatSession).filter(ChatSession.session_id == session_uuid).first()

    @staticmethod
    def get_existing_session_for_user(db: Session, user_id: int) -> Optional[ChatSession]:
        return (
            db.query(ChatSession)
            .filter(ChatSession.user_id == user_id)
            .filter(ChatSession.status == ChatStatus.ACTIVE)
            .first()
        )

    @staticmethod
    def create_session(db: Session, user_id: int) -> ChatSession:
        import uuid
        new_id = str(uuid.uuid4())

        new_session = ChatSession(
            user_id=user_id,
            session_id=new_id,
            status=ChatStatus.ACTIVE,
            admin_id=None
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        return new_session

    @staticmethod
    def get_session(db: Session, session_uuid: str) -> ChatSession:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.session_id == session_uuid)
            .first()
        )
        if not session:
            raise Exception("Chat session not found.")
        return session

    @staticmethod
    def save_message(
        db: Session,
        session_id: str,
        sender: MessageSender,
        sender_id: Optional[int],
        message: str
    ) -> ChatMessage:

        session = ChatService.get_session(db, session_id)

        new_msg = ChatMessage(
            session_id=session.id,
            sender=sender,
            sender_id=sender_id,
            message=message,
            is_read=False
        )
        db.add(new_msg)
        db.commit()
        db.refresh(new_msg)
        return new_msg

    @staticmethod
    def get_all_sessions(db: Session) -> List[ChatSession]:
        sessions = (
            db.query(ChatSession)
            .order_by(ChatSession.created_at.desc())
            .all()
        )

        # 🔥 FIX: Thêm username = full_name
        for s in sessions:
            s.username = s.user.full_name if s.user else None

        return sessions

    @staticmethod
    def get_user_sessions(db: Session, user_id: int) -> List[ChatSession]:
        sessions = (
            db.query(ChatSession)
            .filter(ChatSession.user_id == user_id)
            .order_by(ChatSession.created_at.desc())
            .all()
        )
        for s in sessions:
            s.username = s.user.full_name if s.user else None
        return sessions

    @staticmethod
    def close_session(db: Session, session_uuid: str) -> ChatSession:
        session = ChatService.get_session(db, session_uuid)
        session.status = ChatStatus.CLOSED
        db.commit()
        db.refresh(session)
        return session
