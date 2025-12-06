from __future__ import annotations

from fastapi import Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.inventory import schemas, services
from app.users import dependencies as deps
from app.users.models import User

from . import router


@router.post("/suppliers", response_model=schemas.SupplierRead, status_code=status.HTTP_201_CREATED)
def create_supplier(
    payload: schemas.SupplierCreate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> schemas.SupplierRead:
    supplier = services.create_supplier(db, payload)
    return schemas.SupplierRead.model_validate(supplier)
