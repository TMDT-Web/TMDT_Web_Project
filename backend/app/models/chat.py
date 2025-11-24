"""
Chat Session and Message Models
"""
from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.models.base import Base


class ChatStatus(str, enum.Enum):
    """Chat session status"""
    ACTIVE = "active"
    CLOSED = "closed"
    WAITING = "waiting"


class MessageSender(str, enum.Enum):
    """Message sender type"""
    USER = "user"
    ADMIN = "admin"
    SYSTEM = "system"


class ChatSession(Base):
    """Chat Session Model"""
    __tablename__ = "chat_sessions"
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    session_id = Column(String(100), unique=True, nullable=False, index=True)
    
    status = Column(SQLEnum(ChatStatus), default=ChatStatus.WAITING, nullable=False)
    
    # Admin handling this session
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ChatSession(id={self.id}, session_id='{self.session_id}', status='{self.status}')>"


class ChatMessage(Base):
    """Chat Message Model"""
    __tablename__ = "chat_messages"
    
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    sender = Column(SQLEnum(MessageSender), nullable=False)
    sender_id = Column(Integer, nullable=True)  # User or Admin ID
    
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")
    
    def __repr__(self):
        return f"<ChatMessage(id={self.id}, sender='{self.sender}')>"
