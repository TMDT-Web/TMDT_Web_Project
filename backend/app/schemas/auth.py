"""
Authentication Schemas
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class Token(BaseModel):
    """JWT Token Response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data"""
    user_id: Optional[int] = None
    email: Optional[str] = None
    is_admin: bool = False


class LoginRequest(BaseModel):
    """Login request"""
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    """Register request"""
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    """Change password request"""
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)


class ResetPasswordRequest(BaseModel):
    """Reset password request"""
    email: EmailStr


class ConfirmResetPassword(BaseModel):
    """Confirm password reset"""
    token: str
    new_password: str


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str
