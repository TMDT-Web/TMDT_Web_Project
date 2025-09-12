from sqlalchemy import Column, String, Integer, Enum, ForeignKey, JSON, UniqueConstraint, DateTime, func
from sqlalchemy.dialects.mysql import BINARY
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin, UUIDMixin

class Shop(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "shop_shops"
    
    owner_user_id = Column(BINARY(16), ForeignKey("identity_users.id", ondelete="RESTRICT"), nullable=False)
    display_name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False)
    logo_url = Column(String(1024))
    rating_count = Column(Integer, nullable=False, default=0)
    rating_sum = Column(Integer, nullable=False, default=0)
    status = Column(Enum('active', 'suspended', 'closed', name='shop_status'), nullable=False, default='active')
    policies = Column(JSON)  # return policy, shipping policy
    
    # Relationships
    owner = relationship("User", back_populates="shops")
    payout_accounts = relationship("PayoutAccount", back_populates="shop", cascade="all, delete-orphan")
    listings = relationship("Listing", back_populates="shop", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('slug', name='uq_shops_slug'),
    )

class PayoutAccount(Base, UUIDMixin):
    __tablename__ = "shop_payout_accounts"
    
    shop_id = Column(BINARY(16), ForeignKey("shop_shops.id", ondelete="CASCADE"), nullable=False)
    bank = Column(String(128), nullable=False)
    account_no_masked = Column(String(64), nullable=False)
    owner_name = Column(String(255), nullable=False)
    verified_at = Column(DateTime(6))
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    shop = relationship("Shop", back_populates="payout_accounts")
