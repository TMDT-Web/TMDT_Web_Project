from __future__ import annotations

from fastapi import Depends, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.cart import services
from app.users import dependencies as deps
from app.users.models import User

from . import router


@router.delete("/{cart_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_cart_item(
    cart_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Response:
    services.remove_cart_item(db, current_user, cart_item_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
