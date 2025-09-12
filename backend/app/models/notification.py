from sqlalchemy import Column, String, Integer, Enum, ForeignKey, JSON, UniqueConstraint, Index, DateTime, func
from sqlalchemy.dialects.mysql import BINARY, MEDIUMTEXT
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin, UUIDMixin

class NotificationTemplate(Base, UUIDMixin):
    __tablename__ = "notification_templates"
    
    code = Column(String(64), nullable=False, unique=True)
    channel = Column(Enum('email', 'inapp', 'sms', 'push', name='notification_channel'), nullable=False)
    locale = Column(String(16), nullable=False, default='vi-VN')
    subject = Column(String(255))
    body = Column(MEDIUMTEXT)
    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    notifications = relationship("Notification", back_populates="template")

class Notification(Base, UUIDMixin):
    __tablename__ = "notification_notifications"
    
    user_id = Column(BINARY(16), ForeignKey("identity_users.id", ondelete="CASCADE"), nullable=False)
    channel = Column(Enum('email', 'inapp', 'sms', 'push', name='notification_channel'), nullable=False)
    template_id = Column(BINARY(16), ForeignKey("notification_templates.id", ondelete="SET NULL"))
    payload = Column(JSON, nullable=False)
    delivered_at = Column(DateTime(6))
    delivery_status = Column(Enum('queued', 'sent', 'failed', name='delivery_status'))
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    user = relationship("User")
    template = relationship("NotificationTemplate", back_populates="notifications")
    
    __table_args__ = (
        Index('idx_notifications_user', 'user_id'),
    )
