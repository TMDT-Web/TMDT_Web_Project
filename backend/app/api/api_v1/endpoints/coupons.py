"""
Coupon API Endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.coupon import Coupon, CouponStatus
from app.services.coupon_service import (
    validate_and_apply_coupon,
    get_user_coupons
)
from pydantic import BaseModel, Field


router = APIRouter()


# Schemas
class CouponValidateRequest(BaseModel):
    code: str = Field(..., description="Coupon code to validate")
    order_amount: float = Field(..., gt=0, description="Order total amount")


class CouponValidateResponse(BaseModel):
    valid: bool
    message: str
    discount: float = 0
    code: str = None


class CouponResponse(BaseModel):
    id: int
    code: str
    discount_type: str
    discount_value: float
    max_discount_amount: float | None
    min_order_amount: float
    status: str
    valid_from: str
    valid_until: str
    description: str | None
    used_at: str | None
    
    class Config:
        from_attributes = True


@router.get("/my-coupons", response_model=List[CouponResponse])
def get_my_coupons(
    status: CouponStatus | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all coupons for current user
    
    Query params:
    - status: Filter by coupon status (active, used, expired)
    """
    coupons = get_user_coupons(db, current_user.id, status)
    
    return [
        CouponResponse(
            id=c.id,
            code=c.code,
            discount_type=c.discount_type.value,
            discount_value=c.discount_value,
            max_discount_amount=c.max_discount_amount,
            min_order_amount=c.min_order_amount,
            status=c.status.value,
            valid_from=c.valid_from.isoformat(),
            valid_until=c.valid_until.isoformat(),
            description=c.description,
            used_at=c.used_at.isoformat() if c.used_at else None
        )
        for c in coupons
    ]


@router.post("/validate", response_model=CouponValidateResponse)
def validate_coupon(
    request: CouponValidateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validate coupon code and calculate discount
    
    Request body:
    - code: Coupon code
    - order_amount: Order total amount
    
    Returns:
    - valid: Whether coupon is valid
    - message: Validation message
    - discount: Calculated discount amount
    """
    result = validate_and_apply_coupon(
        db=db,
        coupon_code=request.code,
        user_id=current_user.id,
        order_amount=request.order_amount
    )
    
    return CouponValidateResponse(
        valid=result["valid"],
        message=result["message"],
        discount=result["discount"],
        code=request.code.upper() if result["valid"] else None
    )
