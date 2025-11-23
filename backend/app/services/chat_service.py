"""
Chat Service - WebSocket Manager for real-time chat
"""
from typing import Dict, List
from fastapi import WebSocket
from sqlalchemy.orm import Session
import uuid

from app.models.chat import ChatSession, ChatMessage, ChatStatus, MessageSender
from app.core.exceptions import NotFoundException


class ConnectionManager:
    """WebSocket connection manager"""
    
    def __init__(self):
        # Active connections: {session_id: [websocket1, websocket2, ...]}
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        """Connect a websocket to a session"""
        await websocket.accept()
        
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        
        self.active_connections[session_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, session_id: str):
        """Disconnect a websocket"""
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)
            
            # Clean up empty session
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
    
    async def send_message(self, message: str, session_id: str):
        """Send message to all connections in a session"""
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                await connection.send_text(message)
    
    async def broadcast(self, message: str):
        """Broadcast message to all connections"""
        for connections in self.active_connections.values():
            for connection in connections:
                await connection.send_text(message)


# Global connection manager instance
connection_manager = ConnectionManager()


class ChatService:
    """Chat service"""
    
    @staticmethod
    def create_session(db: Session, user_id: int) -> ChatSession:
        """Create new chat session"""
        session_id = f"CHAT-{uuid.uuid4().hex[:12].upper()}"
        
        session = ChatSession(
            user_id=user_id,
            session_id=session_id,
            status=ChatStatus.WAITING
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return session
    
    @staticmethod
    def get_session(db: Session, session_id: str) -> ChatSession:
        """Get chat session by session_id"""
        session = db.query(ChatSession).filter(
            ChatSession.session_id == session_id
        ).first()
        
        if not session:
            raise NotFoundException("Chat session not found")
        
        return session
    
    @staticmethod
    def get_user_sessions(db: Session, user_id: int) -> List[ChatSession]:
        """Get all sessions for a user"""
        return db.query(ChatSession).filter(
            ChatSession.user_id == user_id
        ).order_by(ChatSession.created_at.desc()).all()
    
    @staticmethod
    def get_all_sessions(db: Session, status: ChatStatus = None) -> List[ChatSession]:
        """Get all chat sessions (admin)"""
        query = db.query(ChatSession)
        
        if status:
            query = query.filter(ChatSession.status == status)
        
        return query.order_by(ChatSession.created_at.desc()).all()
    
    @staticmethod
    def save_message(
        db: Session,
        session_id: str,
        sender: MessageSender,
        sender_id: int,
        message: str
    ) -> ChatMessage:
        """Save chat message"""
        # Get session
        session = db.query(ChatSession).filter(
            ChatSession.session_id == session_id
        ).first()
        
        if not session:
            raise NotFoundException("Chat session not found")
        
        # Create message
        chat_message = ChatMessage(
            session_id=session.id,
            sender=sender,
            sender_id=sender_id,
            message=message,
            is_read=False
        )
        
        db.add(chat_message)
        
        # Update session status
        if session.status == ChatStatus.WAITING and sender == MessageSender.ADMIN:
            session.status = ChatStatus.ACTIVE
        
        db.commit()
        db.refresh(chat_message)
        
        return chat_message
    
    @staticmethod
    def close_session(db: Session, session_id: str) -> ChatSession:
        """Close chat session"""
        session = db.query(ChatSession).filter(
            ChatSession.session_id == session_id
        ).first()
        
        if not session:
            raise NotFoundException("Chat session not found")
        
        session.status = ChatStatus.CLOSED
        db.commit()
        db.refresh(session)
        
        return session
