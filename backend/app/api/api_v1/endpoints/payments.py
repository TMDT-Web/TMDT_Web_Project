"""
Payment Endpoints - MoMo and VNPAY Integration
"""
from fastapi import APIRouter, Depends, Request, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.payment_service import PaymentService
from app.services.order_service import OrderService
from app.models.order import OrderStatus
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/momo/create")
async def create_momo_payment(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create MoMo payment request"""
    # Get order
    order = OrderService.get_order_by_id(db, order_id)
    
    # Check authorization
    if order.user_id != current_user.id:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("Access denied")
    
    # CRITICAL: Validate payment eligibility
    from app.core.exceptions import BadRequestException
    
    if order.is_paid:
        raise BadRequestException("Order has already been paid")
    
    if order.status == OrderStatus.CANCELLED:
        raise BadRequestException("Cannot pay for cancelled order")
    
    if order.status == OrderStatus.COMPLETED:
        raise BadRequestException("Order is already completed")
    
    if order.status not in [OrderStatus.PENDING, OrderStatus.AWAITING_PAYMENT, OrderStatus.CONFIRMED]:
        raise BadRequestException(f"Order status '{order.status}' is not eligible for payment")
    
    # Create payment
    payment_data = await PaymentService.create_momo_payment(
        order_id=order.id,
        amount=order.total_amount,
        order_info=f"Payment for order #{order.id}",
        return_url=f"http://localhost:3000/payment/return",
        notify_url=f"http://localhost:8000/api/v1/payments/momo/notify"
    )
    
    return payment_data


@router.post("/momo/notify")
async def momo_payment_notify(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """MoMo payment IPN (Instant Payment Notification)"""
    data = await request.json()
    
    # Verify signature
    if not PaymentService.verify_momo_signature(data):
        return {"resultCode": 1, "message": "Invalid signature"}
    
    # Process payment result
    if data.get("resultCode") == 0:
        # Payment successful
        order_id = int(data.get("orderId", "").replace("ORD", ""))
        order = OrderService.get_order_by_id(db, order_id)
        
        # CRITICAL: Idempotency check - prevent double processing
        if order.is_paid:
            return {"resultCode": 0, "message": "Already processed"}
        
        # Update payment status
        order.is_paid = True
        order.status = OrderStatus.CONFIRMED
        db.commit()
    
    return {"resultCode": 0, "message": "Success"}


@router.post("/vnpay/create")
def create_vnpay_payment(
    order_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create VNPAY payment URL"""
    # Get order
    order = OrderService.get_order_by_id(db, order_id)
    
    # Check authorization
    if order.user_id != current_user.id:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("Access denied")
    
    # CRITICAL: Validate payment eligibility
    from app.core.exceptions import BadRequestException
    
    if order.is_paid:
        raise BadRequestException("Order has already been paid")
    
    if order.status == OrderStatus.CANCELLED:
        raise BadRequestException("Cannot pay for cancelled order")
    
    if order.status == OrderStatus.COMPLETED:
        raise BadRequestException("Order is already completed")
    
    if order.status not in [OrderStatus.PENDING, OrderStatus.AWAITING_PAYMENT, OrderStatus.CONFIRMED]:
        raise BadRequestException(f"Order status '{order.status}' is not eligible for payment")
    
    # Create payment URL
    payment_url = PaymentService.create_vnpay_payment(
        order_id=order.id,
        amount=order.total_amount,
        order_desc=f"Payment for order #{order.id}",
        return_url=f"http://localhost:3000/payment/return",
        ip_addr=request.client.host
    )
    
    return {"payment_url": payment_url}


@router.get("/vnpay/return")
async def vnpay_payment_return(
    request: Request,
    db: Session = Depends(get_db)
):
    """VNPAY payment return"""
    # Get query parameters
    data = dict(request.query_params)
    
    # Verify signature
    if not PaymentService.verify_vnpay_signature(data):
        return {"success": False, "message": "Invalid signature"}
    
    # Check payment result
    if data.get("vnp_ResponseCode") == "00":
        # Payment successful
        order_id = int(data.get("vnp_TxnRef"))
        order = OrderService.get_order_by_id(db, order_id)
        
        # CRITICAL: Idempotency check - prevent double processing
        if order.is_paid:
            return {"success": True, "message": "Already processed"}
        
        # Update payment status
        order.is_paid = True
        order.status = OrderStatus.CONFIRMED
        db.commit()
        
        return {"success": True, "message": "Payment successful"}
    
    return {"success": False, "message": "Payment failed"}
