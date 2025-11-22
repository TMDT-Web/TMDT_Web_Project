from __future__ import annotations

from fastapi import Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.products import services
from app.users import dependencies as deps
from app.users.models import User

from . import category_router


@category_router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
):
    services.delete_category(db, category_id)
