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


@router.post("/create")
async def create_payment(
    payload: dict,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unified create payment endpoint
    Body: { order_id: int, gateway: str }
    """
    order_id = int(payload.get("order_id", 0))
    gateway = (payload.get("gateway") or "vnpay").lower()

    # Basic validations and get order
    order = OrderService.get_order_by_id(db, order_id)
    if order.user_id != current_user.id:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("Access denied")

    from app.core.exceptions import BadRequestException
    if order.is_paid:
        raise BadRequestException("Order has already been paid")

    if order.status == OrderStatus.CANCELLED:
        raise BadRequestException("Cannot pay for cancelled order")

    if order.status == OrderStatus.COMPLETED:
        raise BadRequestException("Order is already completed")

    if order.status not in [OrderStatus.PENDING, OrderStatus.AWAITING_PAYMENT, OrderStatus.CONFIRMED]:
        raise BadRequestException(f"Order status '{order.status}' is not eligible for payment")

    if gateway == "momo":
        payment_data = await PaymentService.create_momo_payment(
            order_id=order.id,
            amount=order.total_amount,
            order_info=f"Payment for order #{order.id}",
            return_url=f"http://localhost:3000/payment/return?provider=momo",
            notify_url=f"http://localhost:8000/api/v1/payments/momo/notify"
        )
        # Normalize MoMo response to unified shape
        # MoMo sandbox returns JSON with keys like 'payUrl' or 'payUrl' (varies by API)
        payment_url = None
        message = ""
        success = False

        if isinstance(payment_data, dict):
            # common field names
            payment_url = payment_data.get('payUrl') or payment_data.get('payurl') or payment_data.get('redirectUrl') or payment_data.get('data', {}).get('payUrl') if payment_data.get('data') else None
            message = payment_data.get('message') or payment_data.get('msg') or ''
            # success criteria depends on MoMo response structure
            if payment_data.get('resultCode') == 0 or payment_data.get('status') == 'success' or payment_url:
                success = True

        return {
            'success': success,
            'payment_url': payment_url or "",
            'message': message or 'Momo payment created'
        }

    elif gateway == "vnpay":
        payment_url = PaymentService.create_vnpay_payment(
            order_id=order.id,
            amount=order.total_amount,
            order_desc=f"Payment for order #{order.id}",
            return_url=f"http://localhost:3000/payment/return?provider=vnpay",
            ip_addr=request.client.host
        )
        return {"payment_url": payment_url}

    elif gateway in ["cod", "bank_transfer"]:
        # No external redirect needed
        order.payment_method = gateway
        from app.core.database import get_db as _gd
        db.commit()
        return {"payment_url": "", "message": f"Payment method {gateway} selected"}

    else:
        raise BadRequestException("Unsupported payment gateway")


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


@router.post("/qr/generate")
async def generate_qr_payment(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate QR code for payment confirmation
    Body: { order_id: int, payment_method: str }
    """
    from app.services.qr_service import generate_qr_code
    from app.core.exceptions import BadRequestException
    
    order_id = int(payload.get("order_id", 0))
    payment_method = payload.get("payment_method", "bank_transfer")  # momo, vnpay, or bank_transfer
    
    # Get and validate order
    order = OrderService.get_order_by_id(db, order_id)
    
    if order.user_id != current_user.id:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("Access denied")
    
    if order.is_paid:
        raise BadRequestException("Order has already been paid")
    
    # Update payment method based on user selection
    if payment_method in ["momo", "vnpay", "bank_transfer"]:
        order.payment_method = payment_method
        db.commit()
    
    # Generate QR code
    qr_data_uri = generate_qr_code(order_id)
    
    return {
        "success": True,
        "qr_code": qr_data_uri,
        "order_id": order_id,
        "amount": order.total_amount,
        "message": f"QR code for order #{order_id}"
    }


@router.post("/qr/confirm")
async def confirm_qr_payment(
    payload: dict,
    db: Session = Depends(get_db)
):
    """Confirm QR code payment - Public endpoint (no auth required)
    Body: { order_id: int }
    """
    from app.services.qr_service import confirm_qr_payment
    
    order_id = int(payload.get("order_id", 0))
    
    # Confirm payment
    result = confirm_qr_payment(order_id, db)
    
    return result
