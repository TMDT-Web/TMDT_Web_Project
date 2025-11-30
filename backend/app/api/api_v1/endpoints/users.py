"""
User Management Endpoints
"""
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.user import UserResponse, UserUpdate, UserListResponse, PasswordChange
from app.api.deps import get_current_user, get_current_admin_user
from app.models.user import User
from app.core.exceptions import NotFoundException
from app.core.security import verify_password, get_password_hash

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile"""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_my_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
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
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    total = db.query(User).count()
    users = db.query(User).offset(skip).limit(limit).all()
    
    return UserListResponse(users=users, total=total)


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
