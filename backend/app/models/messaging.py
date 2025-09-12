from sqlalchemy import Column, String, Integer, Enum, ForeignKey, JSON, UniqueConstraint, Index, DateTime, func
from sqlalchemy.dialects.mysql import BINARY, MEDIUMTEXT
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin, UUIDMixin

class Conversation(Base, UUIDMixin):
    __tablename__ = "messaging_conversations"
    
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    participants = relationship("ConversationParticipant", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class ConversationParticipant(Base):
    __tablename__ = "messaging_conversation_participants"
    
    conversation_id = Column(BINARY(16), ForeignKey("messaging_conversations.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(BINARY(16), ForeignKey("identity_users.id", ondelete="CASCADE"), primary_key=True)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="participants")
    user = relationship("User")
    
    __table_args__ = (
        Index('idx_participants_user', 'user_id'),
    )

class Message(Base, UUIDMixin):
    __tablename__ = "messaging_messages"
    
    conversation_id = Column(BINARY(16), ForeignKey("messaging_conversations.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(BINARY(16), ForeignKey("identity_users.id", ondelete="RESTRICT"), nullable=False)
    body = Column(MEDIUMTEXT)
    attachments = Column(JSON)
    read_by = Column(JSON)  # array-like JSON
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")
    
    __table_args__ = (
        Index('idx_messages_conversation', 'conversation_id'),
    )
