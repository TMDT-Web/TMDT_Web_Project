"""
Authentication Schemas
"""
from pydantic import BaseModel, EmailStr
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
    password: str
    full_name: str
    phone: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    """Change password request"""
    old_password: str
    new_password: str


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
