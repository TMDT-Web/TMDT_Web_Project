from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.inventory import schemas, services
from app.users import dependencies as deps
from app.users.models import User

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("/suppliers", response_model=list[schemas.SupplierRead])
def list_suppliers(
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root", "staff")),
) -> list[schemas.SupplierRead]:
    suppliers = services.list_suppliers(db)
    return [schemas.SupplierRead.model_validate(supplier) for supplier in suppliers]


@router.post("/suppliers", response_model=schemas.SupplierRead, status_code=status.HTTP_201_CREATED)
def create_supplier(
    payload: schemas.SupplierCreate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> schemas.SupplierRead:
    supplier = services.create_supplier(db, payload)
    return schemas.SupplierRead.model_validate(supplier)


@router.get("/stock-entries", response_model=list[schemas.PurchaseOrderRead])
def list_purchase_orders(
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root", "staff")),
) -> list[schemas.PurchaseOrderRead]:
    purchase_orders = services.list_purchase_orders(db)
    return [schemas.PurchaseOrderRead.model_validate(po) for po in purchase_orders]


@router.post("/stock-entries", response_model=schemas.PurchaseOrderRead, status_code=status.HTTP_201_CREATED)
def create_purchase_order(
    payload: schemas.PurchaseOrderCreate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root", "staff")),
) -> schemas.PurchaseOrderRead:
    purchase_order = services.create_purchase_order(db, payload)
    return schemas.PurchaseOrderRead.model_validate(purchase_order)
