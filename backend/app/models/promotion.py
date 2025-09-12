from sqlalchemy import Column, String, Integer, Enum, ForeignKey, JSON, UniqueConstraint, Index, DateTime, func, Numeric, CheckConstraint
from sqlalchemy.dialects.mysql import BINARY
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin, UUIDMixin

class Voucher(Base, UUIDMixin):
    __tablename__ = "promo_vouchers"
    
    code = Column(String(64), nullable=False, unique=True)
    scope = Column(Enum('platform', 'shop', name='voucher_scope'), nullable=False, default='platform')
    shop_id = Column(BINARY(16), ForeignKey("shop_shops.id", ondelete="CASCADE"))
    type = Column(Enum('percent', 'fixed', 'free_ship', name='voucher_type'), nullable=False)
    value = Column(Numeric(14, 2), nullable=False)
    min_spend = Column(Numeric(14, 2), nullable=False, default=0)
    quota = Column(Integer, nullable=False, default=0)  # 0 = unlimited
    per_user_limit = Column(Integer, nullable=False, default=1)
    currency = Column(String(3), nullable=False, default='VND')
    starts_at = Column(DateTime(6), nullable=False)
    ends_at = Column(DateTime(6))
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    shop = relationship("Shop")
    redemptions = relationship("VoucherRedemption", back_populates="voucher", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint('value >= 0', name='ck_vouchers_value_positive'),
        CheckConstraint('min_spend >= 0', name='ck_vouchers_min_spend_positive'),
        CheckConstraint('quota >= 0', name='ck_vouchers_quota_positive'),
        CheckConstraint('per_user_limit >= 0', name='ck_vouchers_per_user_limit_positive'),
    )

class VoucherRedemption(Base, UUIDMixin):
    __tablename__ = "promo_voucher_redemptions"
    
    voucher_id = Column(BINARY(16), ForeignKey("promo_vouchers.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BINARY(16), ForeignKey("identity_users.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(BINARY(16), ForeignKey("order_orders.id", ondelete="SET NULL"))
    redeemed_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    voucher = relationship("Voucher", back_populates="redemptions")
    user = relationship("User")
    order = relationship("Order")
    
    __table_args__ = (
        UniqueConstraint('voucher_id', 'user_id', 'order_id', name='uq_redemptions'),
        Index('idx_redemptions_user', 'user_id'),
    )
