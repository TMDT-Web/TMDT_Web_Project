"""
Application Configuration Settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Any, Union
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres123@localhost:5432/luxefurniture"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Security
    SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # CORS
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173"
    ]
    
    # File Upload
    MAX_FILE_SIZE: int = 10485760  # 10MB
    UPLOAD_DIR: str = "static/images"
    ALLOWED_EXTENSIONS: Union[List[str], str] = ["jpg", "jpeg", "png", "gif", "webp"]
    
    # Email (Optional)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@luxefurniture.com"
    
    # Payment Gateways - Momo
    MOMO_PARTNER_CODE: str = "MOMOTEST123456"
    MOMO_ACCESS_KEY: str = "F8590EC7094EA49A"
    MOMO_SECRET_KEY: str = "fa22d573f9f8d665a3b26a96acd5d02d"
    MOMO_ENDPOINT: str = "https://test-payment.momo.vn"
    MOMO_RETURN_URL: str = "http://localhost:3000/checkout/callback"
    MOMO_NOTIFY_URL: str = "http://localhost:8000/api/v1/payments/momo/notify"
    
    # Payment Gateways - VNPay
    VNPAY_TMN_CODE: str = "TMNCODE123456"
    VNPAY_SECRET_KEY: str = "SECRETKEY123456"
    # Legacy/alternate name expected by PaymentService
    VNPAY_HASH_SECRET: str = "SECRETKEY123456"
    VNPAY_URL: str = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    VNPAY_RETURN_URL: str = "http://localhost:3000/checkout/callback"
    VNPAY_NOTIFY_URL: str = "http://localhost:8000/api/v1/payments/vnpay/notify"

    # Frontend base URL (used for QR payment links and callbacks)
    FRONTEND_BASE_URL: str = "http://localhost:3000"
    
    # Admin
    ADMIN_EMAIL: str = "admin@luxefurniture.com"
    ADMIN_PASSWORD: str = "Admin@123456"
    
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file_encoding='utf-8'
    )

    @field_validator("ALLOWED_ORIGINS", "ALLOWED_EXTENSIONS", mode="before")
    @classmethod
    def parse_list_from_str(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            return [e.strip() for e in v.split(",")]
        return v


# Create settings instance
settings = Settings()
