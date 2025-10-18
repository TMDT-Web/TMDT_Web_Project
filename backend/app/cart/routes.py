from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.cart import schemas, services
from app.users import dependencies as deps
from app.users.models import User

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("", response_model=list[schemas.CartItemRead])
def get_cart_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> list[schemas.CartItemRead]:
    items = services.get_cart_items(db, current_user)
    return [schemas.CartItemRead.model_validate(item) for item in items]


@router.post("", response_model=schemas.CartItemRead, status_code=status.HTTP_201_CREATED)
def add_to_cart(
    payload: schemas.CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> schemas.CartItemRead:
    item = services.add_to_cart(db, current_user, payload)
    return schemas.CartItemRead.model_validate(item)


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


@router.delete("/{cart_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_cart_item(
    cart_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Response:
    services.remove_cart_item(db, current_user, cart_item_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Response:
    services.clear_cart(db, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
