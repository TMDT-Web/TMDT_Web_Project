"""
Momo Payment Gateway Service
Vietnamese Payment Gateway - Momo Integration
"""

import hashlib
import json
from datetime import datetime
from typing import Dict, Optional, Tuple
import requests

from app.core.config import settings


class MomoService:
    """Momo payment gateway service"""
    
    def __init__(self):
        self.endpoint = "https://test-payment.momo.vn/v3/gateway/api/create"
        self.partner_code = settings.MOMO_PARTNER_CODE
        self.access_key = settings.MOMO_ACCESS_KEY
        self.secret_key = settings.MOMO_SECRET_KEY
        self.return_url = settings.MOMO_RETURN_URL
        self.notify_url = settings.MOMO_NOTIFY_URL
        
    def create_payment_url(
        self,
        order_id: int,
        amount: float,
        user_name: str = "Customer",
        order_description: str = "Thanh toán đơn hàng"
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Create Momo payment URL
        
        Args:
            order_id: Order ID in system
            amount: Amount to pay (VND)
            user_name: User name
            order_description: Order description
            
        Returns:
            Tuple of (success, payment_url, error_message)
        """
        
        try:
            # Generate unique request ID
            request_id = f"ORDER{order_id}{datetime.now().strftime('%Y%m%d%H%M%S')}"
            order_info = f"{order_description} - {order_id}"
            
            # Create request data
            request_data = {
                "partnerCode": self.partner_code,
                "partnerName": "Luxe Furniture",
                "storeId": "MomoTestStore",
                "requestId": request_id,
                "amount": int(amount),
                "orderId": str(order_id),
                "orderInfo": order_info,
                "redirectUrl": self.return_url,
                "ipnUrl": self.notify_url,
                "requestType": "captureWallet",
                "signature": "",
                "lang": "vi"
            }
            
            # Create signature
            signature = self._create_signature(request_data)
            request_data["signature"] = signature
            
            # Send request to Momo
            headers = {"Content-Type": "application/json"}
            response = requests.post(
                self.endpoint,
                json=request_data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                response_data = response.json()
                
                if response_data.get("resultCode") == 0:
                    return True, response_data.get("payUrl"), None
                else:
                    error_msg = response_data.get("message", "Unknown error")
                    return False, None, error_msg
            else:
                return False, None, f"HTTP {response.status_code}"
                
        except Exception as e:
            return False, None, f"Error creating payment: {str(e)}"
    
    def verify_payment(self, notify_data: Dict) -> Tuple[bool, Optional[str]]:
        """
        Verify Momo payment notification
        
        Args:
            notify_data: Data from Momo IPN callback
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        
        try:
            # Extract signature
            signature = notify_data.get("signature", "")
            
            # Create data for verification
            verify_data = {
                "partnerCode": notify_data.get("partnerCode"),
                "accessKey": self.access_key,
                "requestId": notify_data.get("requestId"),
                "amount": notify_data.get("amount"),
                "orderId": notify_data.get("orderId"),
                "orderInfo": notify_data.get("orderInfo"),
                "orderType": notify_data.get("orderType"),
                "transId": notify_data.get("transId"),
                "resultCode": notify_data.get("resultCode"),
                "responseTime": notify_data.get("responseTime"),
                "message": notify_data.get("message"),
                "payType": notify_data.get("payType"),
                "paymentOption": notify_data.get("paymentOption"),
            }
            
            # Create signature string
            signature_str = "&".join([f"{k}={v}" for k, v in verify_data.items()])
            
            # Calculate expected signature
            expected_signature = hashlib.sha256(
                signature_str.encode('utf-8')
            ).hexdigest()
            
            # Verify signature
            if signature != expected_signature:
                return False, "Signature verification failed"
            
            # Check result code
            result_code = notify_data.get("resultCode")
            if result_code == 0:
                return True, None
            else:
                return False, f"Payment failed with code: {result_code}"
                
        except Exception as e:
            return False, f"Error verifying payment: {str(e)}"
    
    def _create_signature(self, data: Dict) -> str:
        """
        Create Momo signature using HMAC SHA256
        
        Args:
            data: Data dictionary to sign
            
        Returns:
            Signature hex string
        """
        
        # Create signature string (sorted by key)
        signature_str = "&".join([
            f"{k}={v}" for k, v in sorted(data.items())
            if k not in ["signature"]
        ])
        
        # Add access key
        signature_str = f"accessKey={self.access_key}&" + signature_str
        
        # Create HMAC SHA256
        signature = hashlib.sha256(
            signature_str.encode('utf-8')
        ).hexdigest()
        
        # Hash with secret key
        signature = hashlib.sha256(
            f"{self.secret_key}{signature_str}{self.secret_key}".encode('utf-8')
        ).hexdigest()
        
        return signature


# Singleton instance
momo_service = MomoService()
