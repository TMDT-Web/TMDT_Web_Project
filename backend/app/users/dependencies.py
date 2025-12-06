from __future__ import annotations

from typing import Callable, Iterable, List, Optional

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import TokenPayload, decode_token, oauth2_scheme
from app.users.models import Role, User


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    payload: TokenPayload = decode_token(token)
    user = db.execute(select(User).where(User.id == int(payload.sub))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User inactive")
    return current_user


def require_roles(*role_names: str) -> Callable[[User], User]:
    required = set(role_names)

    def _checker(current_user: User = Depends(get_current_active_user)) -> User:
        user_roles = {role.name for role in current_user.roles}
        if "root" in user_roles:
            return current_user
        if required and not required.intersection(user_roles):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user

    return _checker
