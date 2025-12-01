"""
Payment Schemas
Data validation schemas for payment operations
"""

from pydantic import BaseModel, Field
from typing import Optional


class PaymentInitRequest(BaseModel):
    """Request to initialize payment"""
    order_id: int = Field(..., description="Order ID to pay for")


class PaymentInitResponse(BaseModel):
    """Response with payment URL"""
    success: bool = Field(..., description="Whether payment initialization was successful")
    payment_url: Optional[str] = Field(None, description="Payment gateway redirect URL")
    message: str = Field(..., description="Response message")


class PaymentCallbackResponse(BaseModel):
    """Payment callback response"""
    success: bool = Field(..., description="Whether payment was successful")
    message: str = Field(..., description="Response message")


class VNPayCallbackParams(BaseModel):
    """VNPay callback parameters"""
    vnp_ResponseCode: str
    vnp_TxnRef: str
    vnp_Amount: str
    vnp_OrderInfo: str
    vnp_SecureHash: str


class MomoCallbackParams(BaseModel):
    """Momo callback parameters"""
    partnerCode: str
    requestId: str
    orderId: str
    amount: int
    transId: str
    resultCode: int
    responseTime: str
    signature: str
