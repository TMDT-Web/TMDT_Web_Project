from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_admin_user
from app.models.user import User
from app.schemas.user import UserUpdate, UserResponse, UserListResponse
from app.models.enums import VipTier, UserRole

router = APIRouter()


@router.get("", response_model=UserListResponse)
def admin_get_users(db: Session = Depends(get_db), admin=Depends(get_current_admin_user)):
    users = db.query(User).order_by(User.id).all()
    return UserListResponse(users=users, total=len(users))


@router.put("/{user_id}", response_model=UserResponse)
def admin_update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.phone is not None:
        user.phone = data.phone
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
    if data.role is not None:
        if data.role not in ["customer", "staff", "admin"]:
            raise HTTPException(400, "Invalid role")
        user.role = UserRole(data.role)
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.address_id is not None:
        user.default_address_id = data.address_id

    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}/upgrade-vip", response_model=UserResponse)
def admin_upgrade_vip(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    tier_order = ["member", "silver", "gold", "diamond"]

    current_index = tier_order.index(user.vip_tier.value)
    if current_index < len(tier_order) - 1:
        next_tier = tier_order[current_index + 1]
        user.vip_tier = VipTier(next_tier)

    db.commit()
    db.refresh(user)
    return user
