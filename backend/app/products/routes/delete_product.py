from __future__ import annotations

from fastapi import Depends, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.products import services
from app.users import dependencies as deps
from app.users.models import User

from . import router


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> Response:
    services.delete_product(db, product_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
