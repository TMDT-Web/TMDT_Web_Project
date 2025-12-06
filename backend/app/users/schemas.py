# app/users/schemas.py
from __future__ import annotations
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class RolePermissionsRead(BaseModel):
    role_id: int
    permission_ids: List[int]

class RolePermissionsUpdate(BaseModel):
    permission_ids: List[int] = []

# =========================
# Role Schemas
# =========================
class RoleRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_system: bool = False

    class Config:
        from_attributes = True  # Pydantic v2


# Dùng bởi routes/create_role.py
class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_system: Optional[bool] = False


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_system: Optional[bool] = None


# =========================
# Permission Schemas
# =========================
class PermissionRead(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    is_system: bool = True

    class Config:
        from_attributes = True


# =========================
# User Schemas
# =========================
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone_number: Optional[str] = None


class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: bool = True
    roles: List[RoleRead] = []

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    # cập nhật linh hoạt: gửi field nào sửa field đó
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: Optional[bool] = None

    # để tương thích logic cũ (nếu route tận dụng)
    role_ids: Optional[List[int]] = None

    # một số route có thể cho phép đổi mật khẩu chung endpoint
    password: Optional[str] = None


class PasswordChange(BaseModel):
    password: str


# =========================
# Auth / Token Schemas
# =========================
class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    user: UserRead
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# =========================
# Role Assignment Schemas
# =========================
class RoleAssignRequest(BaseModel):
    user_id: int
    role_ids: List[int]


class AdminUserRoleUpdate(BaseModel):
    role_ids: List[int]


# =========================
# User Address Schemas (phục vụ create_address.py và các route địa chỉ)
# =========================
class UserAddressCreate(BaseModel):
    receiver_name: str
    phone_number: str
    province: str
    district: str
    ward: str
    address_line: str
    is_default: Optional[bool] = False


class UserAddressUpdate(BaseModel):
    receiver_name: Optional[str] = None
    phone_number: Optional[str] = None
    province: Optional[str] = None
    district: Optional[str] = None
    ward: Optional[str] = None
    address_line: Optional[str] = None
    is_default: Optional[bool] = None


class UserAddressRead(BaseModel):
    id: int
    user_id: int
    receiver_name: str
    phone_number: str
    province: str
    district: str
    ward: str
    address_line: str
    is_default: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PermissionRead(BaseModel):
    id: int
    code: str
    name: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True  # Pydantic v2, thay thế orm_mode

# Gói permission_ids phục vụ GET/PUT /users/{id}/permissions
class UserPermissionIds(BaseModel):
    permission_ids: List[int]

# (Nếu bạn chưa có 2 schema dưới cho role <-> permissions, giữ lại.)
class RolePermissionsRead(BaseModel):
    role_id: int
    permission_ids: List[int]

class RolePermissionsUpdate(BaseModel):
    permission_ids: List[int]