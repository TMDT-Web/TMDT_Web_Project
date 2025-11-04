from __future__ import annotations

from fastapi import Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.cart import schemas, services
from app.users import dependencies as deps
from app.users.models import User

from . import router


@router.post("", response_model=schemas.CartItemRead, status_code=status.HTTP_201_CREATED)
def add_to_cart(
    payload: schemas.CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> schemas.CartItemRead:
    item = services.add_to_cart(db, current_user, payload)
    return schemas.CartItemRead.model_validate(item)
