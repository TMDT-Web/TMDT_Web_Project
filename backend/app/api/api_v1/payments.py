"""
Payment API Routes
Handles payment processing and callbacks for VNPay and Momo
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, Request
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import BadRequest, NotFound
from app.models.user import User
from app.models.order import Order, OrderStatus
from app.schemas.payment import (
    PaymentInitRequest,
    PaymentInitResponse,
    PaymentCallbackResponse
)
from app.services.vnpay_service import vnpay_service
from app.services.momo_service import momo_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["payments"])


@router.post("/vnpay/init", response_model=PaymentInitResponse)
async def init_vnpay_payment(
    request: PaymentInitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initialize VNPay payment
    
    Args:
        request: Payment initialization request
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Payment URL to redirect to VNPay
    """
    
    try:
        # Get order
        order = db.query(Order).filter(
            Order.id == request.order_id,
            Order.user_id == current_user.id
        ).first()
        
        if not order:
            raise NotFound("Order not found")
        
        # Create VNPay payment URL
        payment_url = vnpay_service.create_payment_url(
            order_id=order.id,
            amount=order.total_amount,
            user_email=current_user.email,
            order_description=f"Thanh toán đơn hàng #{order.id}"
        )
        
        # Update order payment method
        order.payment_method = "vnpay"
        db.commit()
        
        return PaymentInitResponse(
            success=True,
            payment_url=payment_url,
            message="VNPay payment URL created successfully"
        )
        
    except Exception as e:
        logger.error(f"VNPay payment initialization error: {str(e)}")
        raise BadRequest(f"Payment initialization failed: {str(e)}")


@router.post("/momo/init", response_model=PaymentInitResponse)
async def init_momo_payment(
    request: PaymentInitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initialize Momo payment
    
    Args:
        request: Payment initialization request
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Payment URL to redirect to Momo
    """
    
    try:
        # Get order
        order = db.query(Order).filter(
            Order.id == request.order_id,
            Order.user_id == current_user.id
        ).first()
        
        if not order:
            raise NotFound("Order not found")
        
        # Create Momo payment URL
        success, payment_url, error = momo_service.create_payment_url(
            order_id=order.id,
            amount=order.total_amount,
            user_name=current_user.full_name,
            order_description=f"Thanh toán đơn hàng #{order.id}"
        )
        
        if not success:
            raise BadRequest(error or "Failed to create Momo payment")
        
        # Update order payment method
        order.payment_method = "momo"
        db.commit()
        
        return PaymentInitResponse(
            success=True,
            payment_url=payment_url,
            message="Momo payment URL created successfully"
        )
        
    except Exception as e:
        logger.error(f"Momo payment initialization error: {str(e)}")
        raise BadRequest(f"Payment initialization failed: {str(e)}")


@router.get("/vnpay/callback")
async def vnpay_callback(
    vnp_ResponseCode: str = Query(...),
    vnp_TxnRef: str = Query(...),
    vnp_Amount: str = Query(...),
    vnp_OrderInfo: str = Query(...),
    vnp_SecureHash: str = Query(...),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    VNPay payment callback handler
    """
    
    try:
        # Collect all query parameters
        vnp_params = {
            "vnp_ResponseCode": vnp_ResponseCode,
            "vnp_TxnRef": vnp_TxnRef,
            "vnp_Amount": vnp_Amount,
            "vnp_OrderInfo": vnp_OrderInfo,
            "vnp_SecureHash": vnp_SecureHash,
        }
        
        # Verify payment
        is_valid, error_msg = vnpay_service.verify_payment(vnp_params)
        
        if not is_valid:
            logger.error(f"VNPay verification failed: {error_msg}")
            return PaymentCallbackResponse(
                success=False,
                message=error_msg or "Payment verification failed"
            )
        
        # Extract order ID from TxnRef (format: ORDERxxxxxxxxx)
        order_id = int(vnp_TxnRef[5:15])
        
        # Get order and update status
        order = db.query(Order).filter(Order.id == order_id).first()
        
        if not order:
            logger.error(f"Order not found: {order_id}")
            return PaymentCallbackResponse(
                success=False,
                message="Order not found"
            )
        
        # Update order status
        if vnp_ResponseCode == "00":
            order.is_paid = True
            order.status = OrderStatus.CONFIRMED
            db.commit()
            
            logger.info(f"VNPay payment successful for order {order_id}")
            return PaymentCallbackResponse(
                success=True,
                message="Payment completed successfully"
            )
        else:
            logger.warning(f"VNPay payment failed for order {order_id}: {vnp_ResponseCode}")
            return PaymentCallbackResponse(
                success=False,
                message=f"Payment failed with code: {vnp_ResponseCode}"
            )
            
    except Exception as e:
        logger.error(f"VNPay callback error: {str(e)}")
        return PaymentCallbackResponse(
            success=False,
            message=f"Callback processing error: {str(e)}"
        )


@router.post("/create", response_model=PaymentInitResponse)
async def create_payment(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unified payment creation endpoint.
    Body: { order_id: int, gateway: str }
    """
    try:
        order_id = int(payload.get("order_id", 0))
        gateway = (payload.get("gateway") or "vnpay").lower()

        # Get order
        order = db.query(Order).filter(
            Order.id == order_id,
            Order.user_id == current_user.id
        ).first()

        if not order:
            raise NotFound("Order not found")

        if gateway == "vnpay":
            payment_url = vnpay_service.create_payment_url(
                order_id=order.id,
                amount=order.total_amount,
                user_email=current_user.email,
                order_description=f"Thanh toán đơn hàng #{order.id}"
            )
            order.payment_method = "vnpay"
            db.commit()

            return PaymentInitResponse(success=True, payment_url=payment_url, message="VNPay payment URL created")

        elif gateway == "momo":
            success, payment_url, error = momo_service.create_payment_url(
                order_id=order.id,
                amount=order.total_amount,
                user_name=current_user.full_name,
                order_description=f"Thanh toán đơn hàng #{order.id}"
            )

            if not success:
                raise BadRequest(error or "Failed to create Momo payment")

            order.payment_method = "momo"
            db.commit()

            return PaymentInitResponse(success=True, payment_url=payment_url, message="Momo payment URL created")

        elif gateway in ["cod", "bank_transfer"]:
            order.payment_method = gateway
            db.commit()
            return PaymentInitResponse(success=True, payment_url="", message=f"Payment method {gateway} selected")

        else:
            raise BadRequest("Unsupported payment gateway")

    except Exception as e:
        logger.error(f"Create payment error: {str(e)}")
        raise BadRequest(f"Payment initialization failed: {str(e)}")


@router.get('/return', response_model=PaymentCallbackResponse)
async def payment_return(request: Request, provider: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """
    Generic return endpoint for payment gateways. Frontend can call this to verify results.
    Query params from gateway will be forwarded and validated.
    """
    try:
        provider = (provider or "vnpay").lower()

        if provider == "vnpay":
            params = dict(request.query_params)
            is_valid, error_msg = vnpay_service.verify_payment(params)
            if not is_valid:
                return PaymentCallbackResponse(success=False, message=error_msg or "Verification failed")

            # Try to extract order id
            txn = params.get("vnp_TxnRef")
            if not txn:
                return PaymentCallbackResponse(success=False, message="Missing TxnRef")
            try:
                order_id = int(txn[5:15])
            except Exception:
                return PaymentCallbackResponse(success=False, message="Invalid TxnRef format")

            order = db.query(Order).filter(Order.id == order_id).first()
            if not order:
                return PaymentCallbackResponse(success=False, message="Order not found")

            if params.get("vnp_ResponseCode") == "00":
                order.is_paid = True
                order.status = OrderStatus.CONFIRMED
                db.commit()
                return PaymentCallbackResponse(success=True, message="Payment successful")
            else:
                return PaymentCallbackResponse(success=False, message=f"Payment failed: {params.get('vnp_ResponseCode')}")

        elif provider == "momo":
            params = dict(request.query_params)
            is_valid, error_msg = momo_service.verify_payment(params)
            if not is_valid:
                return PaymentCallbackResponse(success=False, message=error_msg or "Verification failed")

            order_id = int(params.get("orderId", 0))
            order = db.query(Order).filter(Order.id == order_id).first()
            if not order:
                return PaymentCallbackResponse(success=False, message="Order not found")

            if params.get("resultCode") == "0" or params.get("resultCode") == 0:
                order.is_paid = True
                order.status = OrderStatus.CONFIRMED
                db.commit()
                return PaymentCallbackResponse(success=True, message="Payment successful")
            else:
                return PaymentCallbackResponse(success=False, message=f"Payment failed: {params.get('resultCode')}")

        else:
            return PaymentCallbackResponse(success=False, message="Unsupported provider")

    except Exception as e:
        logger.error(f"Payment return error: {str(e)}")
        return PaymentCallbackResponse(success=False, message=f"Error: {str(e)}")


@router.post('/webhook')
async def payment_webhook(request: Request, provider: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """
    Generic webhook receiver for payment gateways.
    Provider can be specified with query param `provider` (momo, vnpay)
    """
    try:
        provider = (provider or "momo").lower()
        payload = await request.json()

        if provider == "momo":
            is_valid, error_msg = momo_service.verify_payment(payload)
            if not is_valid:
                return {"resultCode": "1", "message": error_msg or "Verification failed"}

            order_id = int(payload.get("orderId", 0))
            order = db.query(Order).filter(Order.id == order_id).first()
            if not order:
                return {"resultCode": "1", "message": "Order not found"}

            if payload.get("resultCode") == 0:
                order.is_paid = True
                order.status = OrderStatus.CONFIRMED
                db.commit()
                return {"resultCode": "0", "message": "Payment completed"}
            else:
                return {"resultCode": "1", "message": "Payment failed"}

        elif provider == "vnpay":
            params = payload if isinstance(payload, dict) else dict(payload)
            is_valid, error_msg = vnpay_service.verify_payment(params)
            if not is_valid:
                return {"success": False, "message": error_msg}

            txn = params.get("vnp_TxnRef")
            if not txn:
                return {"success": False, "message": "Missing TxnRef"}
            try:
                order_id = int(txn[5:15])
            except Exception:
                return {"success": False, "message": "Invalid TxnRef"}

            order = db.query(Order).filter(Order.id == order_id).first()
            if not order:
                return {"success": False, "message": "Order not found"}

            if params.get("vnp_ResponseCode") == "00":
                order.is_paid = True
                order.status = OrderStatus.CONFIRMED
                db.commit()
                return {"success": True, "message": "Payment completed"}
            else:
                return {"success": False, "message": "Payment failed"}

        else:
            return {"success": False, "message": "Unsupported provider"}

    except Exception as e:
        logger.error(f"Payment webhook error: {str(e)}")
        return {"success": False, "message": str(e)}


@router.post("/momo/notify")
async def momo_notify(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
):
    """
    Momo payment IPN notification handler
    """
    
    try:
        # Verify payment notification
        is_valid, error_msg = momo_service.verify_payment(payload)
        
        if not is_valid:
            logger.error(f"Momo verification failed: {error_msg}")
            return {"resultCode": "1", "message": error_msg or "Verification failed"}
        
        # Get order ID
        order_id = int(payload.get("orderId", 0))
        
        # Get order and update status
        order = db.query(Order).filter(Order.id == order_id).first()
        
        if not order:
            logger.error(f"Order not found: {order_id}")
            return {"resultCode": "1", "message": "Order not found"}
        
        # Update order status based on result code
        if payload.get("resultCode") == 0:
            order.is_paid = True
            order.status = OrderStatus.CONFIRMED
            db.commit()
            
            logger.info(f"Momo payment successful for order {order_id}")
            return {"resultCode": "0", "message": "Payment completed"}
        else:
            logger.warning(f"Momo payment failed for order {order_id}: {payload.get('resultCode')}")
            return {"resultCode": "1", "message": f"Payment failed with code: {payload.get('resultCode')}"}
            
    except Exception as e:
        logger.error(f"Momo notify error: {str(e)}")
        return {"resultCode": "1", "message": f"Error processing notification: {str(e)}"}


@router.get("/order/{order_id}/status")
async def get_payment_status(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get payment status for an order
    
    Args:
        order_id: Order ID
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Payment status information
    """
    
    try:
        # Get order
        order = db.query(Order).filter(
            Order.id == order_id,
            Order.user_id == current_user.id
        ).first()
        
        if not order:
            raise NotFound("Order not found")
        
        return {
            "order_id": order.id,
            "is_paid": order.is_paid,
            "payment_method": order.payment_method,
            "total_amount": order.total_amount,
            "status": order.status,
            "created_at": order.created_at,
            "updated_at": order.updated_at
        }
        
    except Exception as e:
        logger.error(f"Error getting payment status: {str(e)}")
        raise BadRequest(f"Error getting payment status: {str(e)}")
