"""
Coupon/Voucher Model for promotional discounts
"""
from sqlalchemy import Column, String, Integer, Float, ForeignKey, Text, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime, timedelta

from app.models.base import Base


class CouponType(str, enum.Enum):
    """Coupon type enumeration"""
    PERCENTAGE = "percentage"  # Giảm theo phần trăm
    FIXED = "fixed"           # Giảm số tiền cố định


class CouponStatus(str, enum.Enum):
    """Coupon status enumeration"""
    ACTIVE = "active"
    USED = "used"
    EXPIRED = "expired"


class Coupon(Base):
    """Coupon Model for discount codes"""
    __tablename__ = "coupons"

    code = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Discount information
    discount_type = Column(SQLEnum(CouponType), nullable=False)
    discount_value = Column(Float, nullable=False)  # Giá trị giảm (% hoặc số tiền)
    max_discount_amount = Column(Float, nullable=True)  # Giảm tối đa (cho loại %)
    min_order_amount = Column(Float, default=0)  # Đơn hàng tối thiểu để áp dụng
    
    # Status and validity
    status = Column(SQLEnum(CouponStatus), default=CouponStatus.ACTIVE)
    valid_from = Column(DateTime, default=func.now())
    valid_until = Column(DateTime, nullable=False)
    
    # Usage tracking
    used_at = Column(DateTime, nullable=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    
    # Promotional information
    description = Column(Text, nullable=True)
    source_order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)  # Đơn hàng trigger coupon
    
    # Relationships
    user = relationship("User", back_populates="coupons", foreign_keys=[user_id])
    order = relationship("Order", foreign_keys=[order_id], backref="applied_coupon")
    source_order = relationship("Order", foreign_keys=[source_order_id], backref="generated_coupons")
    
    def is_valid(self) -> bool:
        """Check if coupon is still valid"""
        if self.status != CouponStatus.ACTIVE:
            return False
        
        now = datetime.utcnow()
        if now < self.valid_from or now > self.valid_until:
            return False
            
        return True
    
    def calculate_discount(self, order_amount: float) -> float:
        """Calculate discount amount for given order"""
        if not self.is_valid():
            return 0
        
        if order_amount < self.min_order_amount:
            return 0
        
        if self.discount_type == CouponType.PERCENTAGE:
            discount = order_amount * (self.discount_value / 100)
            if self.max_discount_amount:
                discount = min(discount, self.max_discount_amount)
            return discount
        else:  # FIXED
            return min(self.discount_value, order_amount)
    
    def __repr__(self):
        return f"<Coupon(code={self.code}, user_id={self.user_id}, status={self.status})>"
