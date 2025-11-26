"""
Application Configuration Settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Union
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/luxefurniture"
    
    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    
    
    # Security
    SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # CORS - can be comma-separated string or list
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8000"
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 5242880  # 5MB
    UPLOAD_DIR: str = "static/images"
    ALLOWED_EXTENSIONS: str = "jpg,jpeg,png,gif,webp"
    
    # Email (Optional)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@luxefurniture.com"
    
    # Payment Gateways
    MOMO_PARTNER_CODE: str = ""
    MOMO_ACCESS_KEY: str = ""
    MOMO_SECRET_KEY: str = ""
    MOMO_ENDPOINT: str = "https://test-payment.momo.vn"
    
    VNPAY_TMN_CODE: str = ""
    VNPAY_HASH_SECRET: str = ""
    VNPAY_URL: str = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    VNPAY_RETURN_URL: str = "http://localhost:8000/api/payments/vnpay/callback"
    
    # JWT
    JWT_SECRET_KEY: str = "your-jwt-secret-key"
    JWT_REFRESH_SECRET_KEY: str = "your-jwt-refresh-secret-key"
    JWT_ALGORITHM: str = "HS256"
    
    # OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"
    
    # Loyalty
    REWARD_POINT_RATE: float = 0.05
    POINTS_PER_VOUCHER: int = 100
    VOUCHER_VALUE: int = 50000
    
    # Admin
    ADMIN_EMAIL: str = "admin@luxefurniture.com"
    ADMIN_PASSWORD: str = "Admin@123456"
    
    # Project
    PROJECT_NAME: str = "Furniture Store API"
    API_PREFIX: str = "/api"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )
    
    def get_cors_origins(self) -> List[str]:
        """Get CORS origins as a list"""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS
    
    def get_allowed_extensions(self) -> List[str]:
        """Get allowed extensions as a list"""
        if isinstance(self.ALLOWED_EXTENSIONS, str):
            return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",")]
        return self.ALLOWED_EXTENSIONS


# Create settings instance
settings = Settings()
