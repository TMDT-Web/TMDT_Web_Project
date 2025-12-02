"""
User Model - Enhanced for Furniture E-commerce
"""
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import Base
from app.models.enums import VipTier, UserRole


class User(Base):
    """User database model - Enhanced with loyalty program"""
    __tablename__ = "users"
    
    # ============ ĐỊNH DANH & LIÊN LẠC ============
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False, index=True)
    phone = Column(String(20), nullable=True, index=True)  # CRITICAL: Shipper needs to call
    avatar_url = Column(String(500), nullable=True)
    
    # ============ GOOGLE OAUTH ============
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    email_verified = Column(Boolean, default=False, nullable=False)
    
    # ============ PHÂN QUYỀN & TRẠNG THÁI ============
    role = Column(SQLEnum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # ============ LOYALTY PROGRAM ============
    loyalty_points = Column(Integer, default=0, nullable=False)
    vip_tier = Column(SQLEnum(VipTier), default=VipTier.MEMBER, nullable=False)
    
    # ============ AUDIT & TRACKING ============
    last_login = Column(DateTime, nullable=True)
    
    # ============ RELATIONSHIPS ============
    addresses = relationship(
        "Address",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    orders = relationship(
        "Order",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    chat_sessions = relationship(
        "ChatSession",
        foreign_keys="[ChatSession.user_id]",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    cart = relationship(
        "Cart",
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False
    )
    notification_preferences = relationship(
        "UserNotificationPreference",
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False
    )
    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    push_subscriptions = relationship(
        "PushSubscription",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    coupons = relationship(
        "Coupon",
        foreign_keys="[Coupon.user_id]",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', tier='{self.vip_tier}')>"
    
    @property
    def is_admin(self) -> bool:
        """Backward compatibility property"""
        return self.role == UserRole.ADMIN
