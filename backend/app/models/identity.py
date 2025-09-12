from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, Date, UniqueConstraint, func
from sqlalchemy.dialects.mysql import BINARY
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin, UUIDMixin

class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "identity_users"
    
    email = Column(String(320), unique=True, nullable=False)
    phone = Column(String(32), unique=True)
    password_hash = Column(String(255), nullable=False)
    status = Column(Enum('active', 'suspended', 'deleted', name='user_status'), nullable=False, default='active')
    is_admin = Column(Boolean, nullable=False, default=False)
    twofa_enabled = Column(Boolean, nullable=False, default=False)
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    consents = relationship("Consent", back_populates="user", cascade="all, delete-orphan")
    shops = relationship("Shop", back_populates="owner", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('email', name='uq_users_email'),
    )

class UserProfile(Base, TimestampMixin):
    __tablename__ = "identity_user_profiles"
    
    user_id = Column(BINARY(16), ForeignKey("identity_users.id", ondelete="CASCADE"), primary_key=True)
    full_name = Column(String(255))
    avatar_url = Column(String(1024))
    dob = Column(Date)
    default_address_id = Column(BINARY(16))
    
    # Relationships
    user = relationship("User", back_populates="profile")

class Address(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "identity_addresses"
    
    user_id = Column(BINARY(16), ForeignKey("identity_users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255))
    phone = Column(String(32))
    line1 = Column(String(255), nullable=False)
    line2 = Column(String(255))
    ward = Column(String(255))
    district = Column(String(255))
    province = Column(String(255))
    country = Column(String(2), nullable=False, default='VN')
    postal_code = Column(String(32))
    is_default = Column(Boolean, nullable=False, default=False)
    
    # Relationships
    user = relationship("User", back_populates="addresses")

class Consent(Base, UUIDMixin):
    __tablename__ = "identity_consents"
    
    user_id = Column(BINARY(16), ForeignKey("identity_users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(64), nullable=False)  # 'email_marketing', 'sms'
    granted_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    version = Column(String(32), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="consents")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'type', 'version', name='uq_consents'),
    )
