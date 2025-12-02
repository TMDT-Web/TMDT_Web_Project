# --- FILE: app/services/chat_service.py ---

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional, List
from datetime import datetime

from app.models.chat import ChatSession, ChatMessage, ChatStatus, MessageSender
from app.models.user import User
from app.services.chatbot_service import ChatbotService

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
        from sqlalchemy.exc import IntegrityError
        
        new_id = str(uuid.uuid4())

        new_session = ChatSession(
            user_id=user_id,
            session_id=new_id,
            status=ChatStatus.ACTIVE,
            admin_id=None
        )
        db.add(new_session)
        
        try:
            db.commit()
            db.refresh(new_session)
            return new_session
        except IntegrityError:
            # Race condition: another request already created a session
            db.rollback()
            # Return the existing active session
            existing = ChatService.get_existing_session_for_user(db, user_id)
            if existing:
                return existing
            # If somehow still not found, raise the error
            raise

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
    def save_message_with_auto_reply(
        db: Session,
        session_id: str,
        sender: MessageSender,
        sender_id: Optional[int],
        message: str
    ) -> tuple[ChatMessage, Optional[ChatMessage]]:
        """
        Save user message and auto-reply if it matches FAQ
        Returns: (user_message, bot_message or None)
        """
        session = ChatService.get_session(db, session_id)

        # Save user message
        user_msg = ChatMessage(
            session_id=session.id,
            sender=sender,
            sender_id=sender_id,
            message=message,
            is_read=False
        )
        db.add(user_msg)
        db.commit()
        db.refresh(user_msg)
        
        # If user message, try to get bot response
        bot_msg = None
        if sender == MessageSender.USER:
            bot_response = ChatbotService.get_bot_response(message)
            
            # Only auto-reply if it's not the default "I don't understand" message
            if "Xin lỗi, tôi chưa hiểu rõ" not in bot_response:
                bot_msg = ChatMessage(
                    session_id=session.id,
                    sender=MessageSender.SYSTEM,
                    message=bot_response,
                    is_read=False
                )
                db.add(bot_msg)
                db.commit()
                db.refresh(bot_msg)
        
        return user_msg, bot_msg
    
    @staticmethod
    def send_notification_to_user_chat(
        db: Session,
        user_id: int,
        message: str
    ) -> Optional[ChatMessage]:
        """
        Send a system notification message to user's active chat session
        Creates a new session if user doesn't have one
        Returns the created message or None if failed
        """
        try:
            # Get or create chat session for user
            session = ChatService.get_existing_session_for_user(db, user_id)
            
            if not session:
                # Create new session for user
                import uuid
                session = ChatSession(
                    session_id=str(uuid.uuid4()),
                    user_id=user_id,
                    status=ChatStatus.ACTIVE
                )
                db.add(session)
                db.commit()
                db.refresh(session)
            
            # Save system message
            system_msg = ChatMessage(
                session_id=session.id,
                sender=MessageSender.SYSTEM,
                sender_id=None,
                message=message,
                is_read=False
            )
            db.add(system_msg)
            db.commit()
            db.refresh(system_msg)
            
            print(f"[DEBUG] Sent chat notification to user {user_id}: {message[:50]}...")
            return system_msg
            
        except Exception as e:
            print(f"[ERROR] Failed to send chat notification to user {user_id}: {str(e)}")
            db.rollback()
            return None

    @staticmethod
    def get_all_sessions(db: Session) -> List[ChatSession]:
        sessions = (
            db.query(ChatSession)
            .order_by(ChatSession.created_at.desc())
            .all()
        )

        # 🔥 FIX: Thêm username = full_name và vip_tier
        for s in sessions:
            s.username = s.user.full_name if s.user else None
            s.vip_tier = s.user.vip_tier.value if s.user else None

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
            s.vip_tier = s.user.vip_tier.value if s.user else None
        return sessions

    @staticmethod
    def close_session(db: Session, session_uuid: str) -> ChatSession:
        session = ChatService.get_session(db, session_uuid)
        session.status = ChatStatus.CLOSED
        db.commit()
        db.refresh(session)
        return session
