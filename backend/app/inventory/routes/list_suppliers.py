from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.inventory import schemas, services
from app.users import dependencies as deps
from app.users.models import User

from . import router


@router.get("/suppliers", response_model=list[schemas.SupplierRead])
def list_suppliers(
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root", "staff")),
) -> list[schemas.SupplierRead]:
    suppliers = services.list_suppliers(db)
    return [schemas.SupplierRead.model_validate(supplier) for supplier in suppliers]
