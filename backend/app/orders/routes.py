from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.orders import schemas, services
from app.users import dependencies as deps
from app.users.models import User

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=schemas.OrderCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> schemas.OrderCreateResponse:
    order, payment_response = await services.create_order(db, current_user, payload)
    return schemas.OrderCreateResponse(
        order=schemas.OrderRead.model_validate(order),
        payment=payment_response,
    )


@router.get("", response_model=schemas.OrderListResponse)
def list_orders(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> schemas.OrderListResponse:
    orders, total = services.get_orders_for_user(db, current_user, page, size)
    return schemas.OrderListResponse(
        items=[schemas.OrderRead.model_validate(order) for order in orders],
        total=total,
        page=page,
        size=size,
    )


@router.get("/{order_id}", response_model=schemas.OrderRead)
def get_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> schemas.OrderRead:
    order = services.get_order(db, order_id)
    if order.user_id != current_user.id:
        deps.require_roles("admin", "root")(current_user)
    return schemas.OrderRead.model_validate(order)


@router.post("/{order_id}/cancel", response_model=schemas.OrderRead)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> schemas.OrderRead:
    order = services.get_order(db, order_id)
    if order.user_id != current_user.id:
        deps.require_roles("admin", "root")(current_user)
    order = services.cancel_order(db, order, order.user)
    return schemas.OrderRead.model_validate(order)


admin_router = APIRouter(prefix="/admin/orders", tags=["Orders"])


@admin_router.get("", response_model=schemas.OrderListResponse)
def admin_list_orders(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> schemas.OrderListResponse:
    orders, total = services.admin_list_orders(db, page, size)
    return schemas.OrderListResponse(
        items=[schemas.OrderRead.model_validate(order) for order in orders],
        total=total,
        page=page,
        size=size,
    )


@admin_router.patch("/{order_id}/status", response_model=schemas.OrderRead)
def update_order_status(
    order_id: int,
    payload: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> schemas.OrderRead:
    order = services.get_order(db, order_id)
    order = services.update_order_status(db, order, payload)
    return schemas.OrderRead.model_validate(order)


router.include_router(admin_router)
