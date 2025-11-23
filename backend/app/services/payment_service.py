"""
Payment Service - Integration with MoMo and VNPAY
"""
import hashlib
import hmac
import json
import httpx
from typing import Dict, Any
from datetime import datetime

from app.core.config import settings


class PaymentService:
    """Payment gateway integration service"""
    
    @staticmethod
    async def create_momo_payment(
        order_id: int,
        amount: float,
        order_info: str,
        return_url: str,
        notify_url: str
    ) -> Dict[str, Any]:
        """
        Create MoMo payment request
        Docs: https://developers.momo.vn
        """
        # MoMo payment parameters
        endpoint = f"{settings.MOMO_ENDPOINT}/v2/gateway/api/create"
        partner_code = settings.MOMO_PARTNER_CODE
        access_key = settings.MOMO_ACCESS_KEY
        secret_key = settings.MOMO_SECRET_KEY
        
        request_id = f"MM{order_id}_{int(datetime.now().timestamp())}"
        order_id_str = f"ORD{order_id}"
        request_type = "captureWallet"
        
        # Create signature
        raw_signature = (
            f"accessKey={access_key}"
            f"&amount={int(amount)}"
            f"&extraData="
            f"&ipnUrl={notify_url}"
            f"&orderId={order_id_str}"
            f"&orderInfo={order_info}"
            f"&partnerCode={partner_code}"
            f"&redirectUrl={return_url}"
            f"&requestId={request_id}"
            f"&requestType={request_type}"
        )
        
        signature = hmac.new(
            secret_key.encode('utf-8'),
            raw_signature.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Payment request
        payload = {
            "partnerCode": partner_code,
            "partnerName": "LuxeFurniture",
            "storeId": "LuxeFurnitureStore",
            "requestId": request_id,
            "amount": int(amount),
            "orderId": order_id_str,
            "orderInfo": order_info,
            "redirectUrl": return_url,
            "ipnUrl": notify_url,
            "requestType": request_type,
            "extraData": "",
            "lang": "vi",
            "signature": signature
        }
        
        # Send request to MoMo
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=payload)
            return response.json()
    
    @staticmethod
    def create_vnpay_payment(
        order_id: int,
        amount: float,
        order_desc: str,
        return_url: str,
        ip_addr: str
    ) -> str:
        """
        Create VNPAY payment URL
        Docs: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
        """
        # VNPAY parameters
        vnp_params = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": settings.VNPAY_TMN_CODE,
            "vnp_Amount": int(amount * 100),  # Convert to smallest currency unit
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": str(order_id),
            "vnp_OrderInfo": order_desc,
            "vnp_OrderType": "other",
            "vnp_Locale": "vn",
            "vnp_ReturnUrl": return_url,
            "vnp_IpAddr": ip_addr,
            "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
        }
        
        # Sort parameters
        sorted_params = sorted(vnp_params.items())
        query_string = "&".join([f"{k}={v}" for k, v in sorted_params])
        
        # Create signature
        signature = hmac.new(
            settings.VNPAY_HASH_SECRET.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()
        
        # Build payment URL
        payment_url = f"{settings.VNPAY_URL}?{query_string}&vnp_SecureHash={signature}"
        
        return payment_url
    
    @staticmethod
    def verify_momo_signature(data: Dict[str, Any]) -> bool:
        """Verify MoMo IPN signature"""
        received_signature = data.get("signature")
        secret_key = settings.MOMO_SECRET_KEY
        
        # Reconstruct signature
        raw_data = (
            f"accessKey={data.get('accessKey')}"
            f"&amount={data.get('amount')}"
            f"&extraData={data.get('extraData', '')}"
            f"&message={data.get('message')}"
            f"&orderId={data.get('orderId')}"
            f"&orderInfo={data.get('orderInfo')}"
            f"&orderType={data.get('orderType')}"
            f"&partnerCode={data.get('partnerCode')}"
            f"&payType={data.get('payType')}"
            f"&requestId={data.get('requestId')}"
            f"&responseTime={data.get('responseTime')}"
            f"&resultCode={data.get('resultCode')}"
            f"&transId={data.get('transId')}"
        )
        
        computed_signature = hmac.new(
            secret_key.encode('utf-8'),
            raw_data.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return computed_signature == received_signature
    
    @staticmethod
    def verify_vnpay_signature(data: Dict[str, Any]) -> bool:
        """Verify VNPAY return signature"""
        received_signature = data.pop("vnp_SecureHash", None)
        secret_key = settings.VNPAY_HASH_SECRET
        
        # Sort and create query string
        sorted_params = sorted(data.items())
        query_string = "&".join([f"{k}={v}" for k, v in sorted_params])
        
        # Compute signature
        computed_signature = hmac.new(
            secret_key.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()
        
        return computed_signature == received_signature
