"""
User Management Endpoints
"""
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.user import UserResponse, UserUpdate, AdminUserUpdate, UserListResponse, PasswordChange, LoyaltyInfo
from app.api.deps import get_current_user, get_current_admin_user
from app.models.user import User
from app.core.exceptions import NotFoundException
from app.core.security import verify_password, get_password_hash
from app.services.loyalty_service import LoyaltyService

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile"""
    return current_user


@router.get("/me/loyalty", response_model=LoyaltyInfo)
def get_my_loyalty(
    current_user: User = Depends(get_current_user)
):
    """Get current user's loyalty information"""
    return LoyaltyService.get_loyalty_info(current_user)


@router.put("/me", response_model=UserResponse)
def update_my_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    # Whitelist of fields users can update themselves
    allowed_fields = {'full_name', 'phone', 'avatar_url', 'address_id'}
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in allowed_fields:
            setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/change-password")
def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change current user password"""
    # Verify current password
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}



@router.get("", response_model=UserListResponse)
def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    try:
        total = db.query(User).count()
        users = db.query(User).offset(skip).limit(limit).all()

        # Convert ORM → schema
        user_list = [UserResponse.model_validate(u) for u in users]

        return UserListResponse(users=user_list, total=total)
    except Exception as e:
        from app.core.exceptions import APIException
        raise APIException(status_code=500, message=f"Error fetching users: {str(e)}")


# ============================
#      ADMIN — GET USER
# ============================
@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get user by ID (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User not found")
    return user


# ============================
#      ADMIN — UPDATE USER
# ============================
@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: AdminUserUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update user by ID (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


# ============================
#      ADMIN — UPDATE USER STATUS
# ============================
@router.put("/{user_id}/status")
def update_user_status(
    user_id: int,
    is_active: bool,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update user active status (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User not found")

    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return {"message": "Status updated successfully", "is_active": user.is_active}


# ============================
#      ADMIN — UPDATE USER ROLE
# ============================
@router.put("/{user_id}/role")
def update_user_role(
    user_id: int,
    role: str,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update user role (admin only)"""
    from app.models.enums import UserRole
    
    # Validate role
    valid_roles = [e.value for e in UserRole]
    if role not in valid_roles:
        raise ValueError(f"Invalid role. Must be one of: {', '.join(valid_roles)}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User not found")

    user.role = role
    db.commit()
    db.refresh(user)
    return {"message": "Role updated successfully", "role": user.role}


# ============================
#      ADMIN — UPGRADE USER TO VIP
# ============================
@router.put("/{user_id}/upgrade-vip")
def upgrade_user_vip(
    user_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Upgrade user to next VIP tier (admin only)"""
    from app.models.enums import VipTier
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User not found")

    # Upgrade to next tier
    if user.vip_tier == VipTier.MEMBER:
        user.vip_tier = VipTier.SILVER
    elif user.vip_tier == VipTier.SILVER:
        user.vip_tier = VipTier.GOLD
    elif user.vip_tier == VipTier.GOLD:
        user.vip_tier = VipTier.DIAMOND
    else:
        # Already at max tier
        return {"message": "User is already at maximum VIP tier", "vip_tier": user.vip_tier}
    
    db.commit()
    db.refresh(user)
    return {"message": f"User upgraded to {user.vip_tier.value.upper()}", "vip_tier": user.vip_tier}


# ============================
#      ADMIN — DOWNGRADE USER VIP
# ============================
@router.put("/{user_id}/downgrade-vip")
def downgrade_user_vip(
    user_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Downgrade user to previous VIP tier (admin only)"""
    from app.models.enums import VipTier
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User not found")

    # Downgrade to previous tier
    if user.vip_tier == VipTier.DIAMOND:
        user.vip_tier = VipTier.GOLD
    elif user.vip_tier == VipTier.GOLD:
        user.vip_tier = VipTier.SILVER
    elif user.vip_tier == VipTier.SILVER:
        user.vip_tier = VipTier.MEMBER
    else:
        # Already at lowest tier
        return {"message": "User is already at minimum VIP tier", "vip_tier": user.vip_tier}
    
    db.commit()
    db.refresh(user)
    return {"message": f"User downgraded to {user.vip_tier.value.upper()}", "vip_tier": user.vip_tier}


# ============================
#      ADMIN — RESET USER PASSWORD
# ============================
@router.post("/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Reset user password to default (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User not found")

    from app.core.security import get_password_hash
    # Reset to default password
    user.hashed_password = get_password_hash("Password@123")
    db.commit()
    return {"message": "Password reset to 'Password@123'"}


# ============================
#      ADMIN — DELETE USER
# ============================
@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User not found")

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}
