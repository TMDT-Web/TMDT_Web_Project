"""
Google OAuth Schemas
"""
from pydantic import BaseModel, Field


class GoogleAuthURL(BaseModel):
    """Google OAuth authorization URL"""
    auth_url: str = Field(..., description="Google OAuth authorization URL")
    state: str = Field(..., description="CSRF protection state")


class GoogleCallbackRequest(BaseModel):
    """Google OAuth callback data"""
    code: str = Field(..., description="Authorization code from Google")
    state: str = Field(..., description="State parameter for CSRF validation")
