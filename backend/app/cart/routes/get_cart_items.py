from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.cart import schemas, services
from app.users import dependencies as deps
from app.users.models import User

from . import router


@router.get("", response_model=list[schemas.CartItemRead])
def get_cart_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> list[schemas.CartItemRead]:
    items = services.get_cart_items(db, current_user)
    return [schemas.CartItemRead.model_validate(item) for item in items]
