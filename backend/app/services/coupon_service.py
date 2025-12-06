"""
Coupon Service - Handle coupon generation and validation
"""
import random
import string
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.coupon import Coupon, CouponType, CouponStatus
from app.models.order import Order
from app.models.user import User


def generate_coupon_code(prefix: str = "LUXE") -> str:
    """Generate unique coupon code"""
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"{prefix}{random_part}"


def create_promotional_coupon(
    db: Session,
    user_id: int,
    source_order_id: int,
    discount_value: float = 300000,  # 300k VND
    valid_days: int = 30
) -> Coupon:
    """
    Create promotional coupon for user after qualifying purchase
    
    Args:
        db: Database session
        user_id: User ID to receive coupon
        source_order_id: Order that triggered this coupon
        discount_value: Discount amount (default 300k VND)
        valid_days: Days until coupon expires
    
    Returns:
        Created coupon object
    """
    code = generate_coupon_code()
    
    # Check if code already exists, regenerate if needed
    while db.query(Coupon).filter(Coupon.code == code).first():
        code = generate_coupon_code()
    
    coupon = Coupon(
        code=code,
        user_id=user_id,
        discount_type=CouponType.FIXED,
        discount_value=discount_value,
        min_order_amount=0,  # No minimum order for promotional coupon
        status=CouponStatus.ACTIVE,
        valid_from=datetime.utcnow(),
        valid_until=datetime.utcnow() + timedelta(days=valid_days),
        description=f"Khuyến mãi {discount_value:,.0f}đ - Tặng khi mua hàng trên 8 triệu",
        source_order_id=source_order_id
    )
    
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    
    return coupon


def validate_and_apply_coupon(
    db: Session,
    coupon_code: str,
    user_id: int,
    order_amount: float
) -> Dict[str, Any]:
    """
    Validate coupon and calculate discount
    
    Args:
        db: Database session
        coupon_code: Coupon code to validate
        user_id: User ID attempting to use coupon
        order_amount: Order total amount
    
    Returns:
        Dict with validation result and discount amount
    """
    # Find coupon
    coupon = db.query(Coupon).filter(
        Coupon.code == coupon_code.upper()
    ).first()
    
    if not coupon:
        return {
            "valid": False,
            "message": "Mã khuyến mãi không tồn tại",
            "discount": 0
        }
    
    # Check ownership
    if coupon.user_id != user_id:
        return {
            "valid": False,
            "message": "Mã khuyến mãi này không thuộc về bạn",
            "discount": 0
        }
    
    # Check status
    if coupon.status != CouponStatus.ACTIVE:
        status_msg = {
            CouponStatus.USED: "Mã khuyến mãi đã được sử dụng",
            CouponStatus.EXPIRED: "Mã khuyến mãi đã hết hạn"
        }
        return {
            "valid": False,
            "message": status_msg.get(coupon.status, "Mã khuyến mãi không khả dụng"),
            "discount": 0
        }
    
    # Check validity period
    now = datetime.utcnow()
    if now < coupon.valid_from or now > coupon.valid_until:
        coupon.status = CouponStatus.EXPIRED
        db.commit()
        return {
            "valid": False,
            "message": "Mã khuyến mãi đã hết hạn",
            "discount": 0
        }
    
    # Check minimum order amount
    if order_amount < coupon.min_order_amount:
        return {
            "valid": False,
            "message": f"Đơn hàng tối thiểu {coupon.min_order_amount:,.0f}đ để sử dụng mã này",
            "discount": 0
        }
    
    # Calculate discount
    discount = coupon.calculate_discount(order_amount)
    
    return {
        "valid": True,
        "message": "Mã khuyến mãi hợp lệ",
        "discount": discount,
        "coupon": coupon
    }


def mark_coupon_as_used(db: Session, coupon: Coupon, order_id: int) -> None:
    """Mark coupon as used after successful order"""
    coupon.status = CouponStatus.USED
    coupon.used_at = datetime.utcnow()
    coupon.order_id = order_id
    db.commit()


def get_user_coupons(db: Session, user_id: int, status: Optional[CouponStatus] = None) -> list[Coupon]:
    """Get all coupons for a user, optionally filtered by status"""
    query = db.query(Coupon).filter(Coupon.user_id == user_id)
    
    if status:
        query = query.filter(Coupon.status == status)
    
    return query.order_by(Coupon.created_at.desc()).all()
