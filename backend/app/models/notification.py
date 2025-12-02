"""
Notification Models - Multi-channel notification system
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import Base


class UserNotificationPreference(Base):
    """User notification channel preferences"""
    __tablename__ = "user_notification_preferences"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    # Channel toggles
    email_enabled = Column(Boolean, default=True, nullable=False)
    sms_enabled = Column(Boolean, default=False, nullable=False)
    push_enabled = Column(Boolean, default=False, nullable=False)
    
    # Category toggles
    order_updates = Column(Boolean, default=True, nullable=False)
    promotions = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="notification_preferences")


class Notification(Base):
    """Notification record"""
    __tablename__ = "notifications"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)  # ORDER_CONFIRMED, ORDER_SHIPPED, PROMO, etc.
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSON, nullable=True)  # Additional metadata
    read = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    logs = relationship("NotificationLog", back_populates="notification", cascade="all, delete-orphan")


class NotificationLog(Base):
    """Log of notification delivery attempts"""
    __tablename__ = "notification_logs"
    
    notification_id = Column(Integer, ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False, index=True)
    channel = Column(String(20), nullable=False, index=True)  # email, sms, push
    status = Column(String(20), nullable=False)  # pending, sent, failed
    provider_response = Column(Text, nullable=True)
    attempt = Column(Integer, default=1, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    
    # Relationships
    notification = relationship("Notification", back_populates="logs")


class PushSubscription(Base):
    """Web Push subscription for a user device"""
    __tablename__ = "push_subscriptions"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    endpoint = Column(Text, nullable=False, unique=True, index=True)
    p256dh = Column(Text, nullable=False)  # Encryption key
    auth = Column(Text, nullable=False)  # Auth secret
    user_agent = Column(String(500), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="push_subscriptions")
