"""
VNPay Payment Gateway Service
Vietnamese Payment Gateway - VNPay Integration
"""

import hashlib
import hmac
import urllib.parse
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
import requests

from app.core.config import settings


class VNPayService:
    """VNPay payment gateway service"""
    
    def __init__(self):
        self.vnp_url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
        self.vnp_api_url = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"
        self.vnp_hash_secret = settings.VNPAY_SECRET_KEY
        self.vnp_tmn_code = settings.VNPAY_TMN_CODE
        self.return_url = settings.VNPAY_RETURN_URL
        
    def create_payment_url(
        self,
        order_id: int,
        amount: float,
        user_email: str,
        order_description: str = "Thanh toán đơn hàng"
    ) -> str:
        """
        Create VNPay payment URL
        
        Args:
            order_id: Order ID in system
            amount: Amount to pay (VND)
            user_email: User email
            order_description: Order description
            
        Returns:
            VNPay payment URL
        """
        
        # Convert amount to VND (multiply by 100 for VNPay)
        amount_vnp = int(amount * 100)
        
        # Create transaction reference
        txn_ref = f"ORDER{order_id}{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Prepare VNPay parameters
        vnp_params = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": self.vnp_tmn_code,
            "vnp_Amount": str(amount_vnp),
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": txn_ref,
            "vnp_OrderInfo": f"{order_description} - Order {order_id}",
            "vnp_OrderType": "other",
            "vnp_Locale": "vn",
            "vnp_ReturnUrl": self.return_url,
            "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
            "vnp_IpAddr": "127.0.0.1",
            "vnp_ExpireDate": (datetime.now() + timedelta(minutes=15)).strftime("%Y%m%d%H%M%S"),
        }
        
        # Sort parameters by key
        vnp_params_sorted = sorted(vnp_params.items())
        
        # Create query string
        query_string = "&".join([f"{key}={urllib.parse.quote_plus(str(value))}" for key, value in vnp_params_sorted])
        
        # Create secure hash
        secure_hash = self._create_secure_hash(query_string)
        
        # Final URL
        payment_url = f"{self.vnp_url}?{query_string}&vnp_SecureHash={secure_hash}"
        
        return payment_url
    
    def verify_payment(self, vnp_params: Dict[str, str]) -> Tuple[bool, Optional[str]]:
        """
        Verify VNPay payment response
        
        Args:
            vnp_params: VNPay response parameters
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        
        # Extract secure hash from params
        secure_hash = vnp_params.get("vnp_SecureHash", "")
        
        # Create list of params without secure hash
        vnp_params_no_hash = {k: v for k, v in vnp_params.items() if k != "vnp_SecureHash"}
        
        # Sort and create query string
        vnp_params_sorted = sorted(vnp_params_no_hash.items())
        query_string = "&".join([f"{key}={urllib.parse.quote_plus(str(value))}" for key, value in vnp_params_sorted])
        
        # Verify secure hash
        calculated_hash = self._create_secure_hash(query_string)
        
        if secure_hash != calculated_hash:
            return False, "Secure hash verification failed"
        
        # Check response code
        vnp_response_code = vnp_params.get("vnp_ResponseCode")
        if vnp_response_code != "00":
            return False, f"Payment failed with code: {vnp_response_code}"
        
        return True, None
    
    def get_transaction_info(self, txn_ref: str) -> Optional[Dict]:
        """
        Get transaction information from VNPay
        
        Args:
            txn_ref: Transaction reference
            
        Returns:
            Transaction info or None
        """
        
        try:
            headers = {
                "Content-Type": "application/json",
            }
            
            payload = {
                "TmnCode": self.vnp_tmn_code,
                "TxnRef": txn_ref,
                "OrderInfo": "",
                "BeginDate": "",
                "EndDate": "",
                "CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
            }
            
            response = requests.post(
                self.vnp_api_url,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            
            return None
            
        except Exception as e:
            print(f"Error getting transaction info: {str(e)}")
            return None
    
    def _create_secure_hash(self, data: str) -> str:
        """
        Create VNPay secure hash using HMAC SHA512
        
        Args:
            data: Query string to hash
            
        Returns:
            Secure hash hex string
        """
        
        return hmac.new(
            self.vnp_hash_secret.encode('utf-8'),
            data.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()


# Singleton instance
vnpay_service = VNPayService()
