from __future__ import annotations

import random
import string
from datetime import datetime
from decimal import Decimal
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.inventory import schemas
from app.inventory.models import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus, Supplier
from app.products.models import Product


def generate_reference_code() -> str:
    return "PO-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


def create_supplier(db: Session, payload: schemas.SupplierCreate) -> Supplier:
    supplier = Supplier(**payload.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


def list_suppliers(db: Session) -> List[Supplier]:
    return db.query(Supplier).order_by(Supplier.name).all()


def create_purchase_order(db: Session, payload: schemas.PurchaseOrderCreate) -> PurchaseOrder:
    supplier = db.get(Supplier, payload.supplier_id)
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No items provided")

    purchase_order = PurchaseOrder(
        supplier_id=payload.supplier_id,
        reference_code=generate_reference_code(),
        status=PurchaseOrderStatus.RECEIVED,
        created_at=datetime.utcnow(),
        received_at=datetime.utcnow(),
        notes=payload.notes,
    )
    db.add(purchase_order)
    db.flush()

    total_cost = Decimal(0)
    for item in payload.items:
        product = db.get(Product, item.product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product {item.product_id} not found")
        subtotal = item.unit_cost * item.quantity
        total_cost += subtotal
        db.add(
            PurchaseOrderItem(
                purchase_order_id=purchase_order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_cost=item.unit_cost,
                subtotal=subtotal,
            )
        )
        product.stock_quantity += item.quantity

    purchase_order.total_cost = total_cost
    db.commit()
    db.refresh(purchase_order)
    return purchase_order


def list_purchase_orders(db: Session) -> List[PurchaseOrder]:
    return (
        db.query(PurchaseOrder)
        .options(joinedload(PurchaseOrder.items))
        .order_by(PurchaseOrder.created_at.desc())
        .all()
    )
