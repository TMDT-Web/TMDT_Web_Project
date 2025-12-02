"""
QR Code Payment Service
Generates QR codes for payment links and handles confirmation
"""
import qrcode
import io
import base64
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.core.config import settings
from app.services.email_service import send_order_confirmation_email
from app.services.coupon_service import create_promotional_coupon


def generate_qr_code(order_id: int, base_url: str | None = None) -> str:
    """
    Generate QR code for payment confirmation
    
    Args:
        order_id: Order ID to encode in QR
        base_url: Frontend base URL
    
    Returns:
        Base64 encoded QR code image (data URI)
    """
    # Determine frontend base URL from parameter or settings
    if not base_url:
        base_url = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3000')

    # Create payment confirmation URL
    confirmation_url = f"{base_url}/payment/qr-confirm?order_id={order_id}"
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=2,
    )
    qr.add_data(confirmation_url)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    # Return as data URI
    base64_str = base64.b64encode(img_byte_arr.getvalue()).decode()
    return f"data:image/png;base64,{base64_str}"


def confirm_qr_payment(order_id: int, db: Session) -> Dict[str, Any]:
    """
    Confirm QR payment and update order status to paid
    
    Args:
        order_id: Order ID to confirm payment
        db: Database session
    
    Returns:
        Response dict with success status
    """
    from app.models.user import User
    
    # Fetch order
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        return {
            "success": False,
            "message": f"Order #{order_id} not found"
        }
    
    # Check if already paid
    if order.is_paid:
        return {
            "success": False,
            "message": f"Order #{order_id} already paid"
        }
    
    # Update order status
    order.is_paid = True
    order.status = OrderStatus.CONFIRMED
    order.deposit_amount = order.total_amount
    order.remaining_amount = 0
    
    db.commit()
    db.refresh(order)
    
    # Check if order qualifies for promotional coupon (> 8 million VND)
    coupon_code = None
    if order.total_amount > 8000000:
        try:
            coupon = create_promotional_coupon(
                db=db,
                user_id=order.user_id,
                source_order_id=order.id,
                discount_value=300000,  # 300k VND
                valid_days=30
            )
            coupon_code = coupon.code
            print(f"✓ Created promotional coupon {coupon_code} for order #{order_id}")
        except Exception as e:
            print(f"Failed to create promotional coupon: {e}")
    
    # Send confirmation email
    try:
        user = db.query(User).filter(User.id == order.user_id).first()
        if user and user.email:
            send_order_confirmation_email(
                to_email=user.email,
                user_name=user.full_name or "Quý khách",
                order_id=order.id,
                total_amount=order.total_amount,
                payment_method="QR Payment",
                coupon_code=coupon_code
            )
    except Exception as e:
        print(f"Failed to send confirmation email: {e}")
    
    return {
        "success": True,
        "message": f"Payment confirmed for order #{order_id}",
        "order_id": order_id,
        "total_amount": order.total_amount,
        "status": order.status
    }
