from __future__ import annotations

from fastapi import Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.users import schemas, services, dependencies as deps
from app.users.models import User

from . import router


@router.post("/users/me/addresses", response_model=schemas.UserAddressRead, status_code=status.HTTP_201_CREATED)
def create_address(
    payload: schemas.UserAddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> schemas.UserAddressRead:
    address = services.create_address(db, current_user, payload)
    return schemas.UserAddressRead.model_validate(address)
