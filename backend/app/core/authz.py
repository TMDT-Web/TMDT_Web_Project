# backend/app/core/authz.py
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Iterable

from app.core.database import get_db
from app.users.dependencies import get_current_user
from app.users.models import User, Role, RolePermission, Permission  # chỉnh import theo project của bạn

def is_root(user: User) -> bool:
    """
    Kiểm tra xem user có role root không.
    Root có full quyền, bypass mọi kiểm tra permission.
    """
    if not user or not user.roles:
        return False
    return any(r.name == "root" for r in user.roles)

def user_permissions(db: Session, user: User) -> set[str]:
    """
    Lấy tập permission code của user qua roles.
    ROOT user có tất cả permissions.
    """
    if not user:
        return set()
    
    # ROOT bypass - có tất cả permissions
    if is_root(user):
        all_perms = db.query(Permission.code).all()
        return set([row[0] for row in all_perms])
    
    # Join role_permissions -> permissions
    q = (
        db.query(Permission.code)
        .join(RolePermission, RolePermission.permission_code == Permission.code)
        .join(Role, Role.id == RolePermission.role_id)
        .join(User.roles)  # relationship many-to-many User.roles
        .filter(User.id == user.id)
    )
    return set([row[0] for row in q.all()])

def has_any_permission(db: Session, user: User, perms: Iterable[str]) -> bool:
    if not perms:
        return True
    
    # ROOT bypass - always has permission
    if is_root(user):
        return True
    
    up = user_permissions(db, user)
    return any(p in up for p in perms)

def require_permissions(*perms: str):
    """
    Dependency: yêu cầu user có ít nhất 1 trong các permission.
    ROOT user luôn pass.
    Dùng: Depends(require_permissions("user.update", "user.read"))
    """
    def _check(
        db: Session = Depends(get_db),
        user: User = Depends(get_current_user),
    ):
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        
        # ROOT bypass
        if is_root(user):
            return True
        
        if not has_any_permission(db, user, perms):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return True
    return _check
