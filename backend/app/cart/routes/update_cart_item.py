from __future__ import annotations

from fastapi import Depends, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.cart import schemas, services
from app.users import dependencies as deps
from app.users.models import User

from . import router


@router.patch("/{cart_item_id}", response_model=schemas.CartItemRead)
def update_cart_item(
    cart_item_id: int,
    payload: schemas.CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    item = services.update_cart_item(db, current_user, cart_item_id, payload)
    if item is None:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return schemas.CartItemRead.model_validate(item)
