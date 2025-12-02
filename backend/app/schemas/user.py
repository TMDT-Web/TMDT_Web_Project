"""
User Schemas - Enhanced with Loyalty & Address
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

from app.schemas.base import TimestampSchema
from app.models.enums import VipTier, UserRole


# ============ ADDRESS SCHEMAS ============

class AddressBase(BaseModel):
    """Address base schema"""
    name: str = Field(..., max_length=100, description="Nickname (e.g., Home, Office)")
    receiver_name: str = Field(..., max_length=255)
    receiver_phone: str = Field(..., max_length=20)
    address_line: str = Field(..., max_length=500)
    ward: Optional[str] = Field(None, max_length=100)
    district: str = Field(..., max_length=100)
    city: str = Field(..., max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = Field(None, max_length=500)


class AddressCreate(AddressBase):
    """Address create schema"""
    is_default: bool = False


class AddressUpdate(BaseModel):
    """Address update schema"""
    name: Optional[str] = None
    receiver_name: Optional[str] = None
    receiver_phone: Optional[str] = None
    address_line: Optional[str] = None
    ward: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    is_default: Optional[bool] = None
    notes: Optional[str] = None


class AddressResponse(TimestampSchema, AddressBase):
    """Address response schema"""
    user_id: int
    is_default: bool
    
    class Config:
        from_attributes = True


# ============ USER SCHEMAS ============

class UserBase(BaseModel):
    """User base schema"""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = Field(None, max_length=500)


class UserCreate(UserBase):
    """User create schema"""
    password: str = Field(..., min_length=6)


class UserRegister(UserCreate):
    """User registration schema"""
    pass


class UserUpdate(BaseModel):
    """User update schema - regular users can only update their personal info"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = None
    address_id: Optional[int] = None


class AdminUserUpdate(BaseModel):
    """Admin user update schema - includes all fields admins can modify"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    address_id: Optional[int] = None


class PasswordChange(BaseModel):
    """Password change schema"""
    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=8, description="New password must be at least 8 characters")



class UserResponse(TimestampSchema, UserBase):
    """User response schema"""
    role: UserRole
    is_active: bool
    is_verified: bool
    loyalty_points: int
    vip_tier: VipTier
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserProfile(UserResponse):
    """User profile with addresses"""
    addresses: list[AddressResponse] = []
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """User list response"""
    users: list[UserResponse]
    total: int


# ============ LOYALTY SCHEMAS ============

class LoyaltyInfo(BaseModel):
    """Loyalty program information"""
    current_points: int
    current_tier: VipTier
    next_tier: Optional[VipTier] = None
    points_to_next_tier: Optional[int] = None
    tier_discount: float  # Percentage discount
    
    class Config:
        from_attributes = True

from pydantic import BaseModel

class UserRoleUpdate(BaseModel):
    role: str


class UserStatusUpdate(BaseModel):
    status: str
