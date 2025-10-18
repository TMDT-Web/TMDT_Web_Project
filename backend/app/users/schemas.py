from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field

from app.schemas.base import OrmBaseModel


class RoleBase(OrmBaseModel):
    name: str = Field(max_length=50)
    description: Optional[str] = None


class RoleCreate(RoleBase):
    is_system: bool = False


class RoleRead(RoleBase):
    id: int
    is_system: bool


class UserBase(OrmBaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone_number: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserUpdate(OrmBaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: Optional[bool] = None
    role_ids: Optional[List[int]] = None


class UserRead(UserBase):
    id: int
    is_active: bool
    google_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    roles: List[RoleRead] = []


class UserAddressCreate(OrmBaseModel):
    label: Optional[str] = "Default"
    recipient_name: str
    recipient_phone: str
    address_line: str
    ward: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    country: str = "Vietnam"
    is_default: bool = False


class UserAddressRead(UserAddressCreate):
    id: int
    created_at: datetime


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthInitResponse(BaseModel):
    authorization_url: str
    state: str


class GoogleAuthCallbackResponse(TokenPair):
    is_new_user: bool
