from __future__ import annotations

from fastapi import Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.users import schemas, services
from . import router


@router.post("/auth/register", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def register_user(payload: schemas.UserCreate, db: Session = Depends(get_db)) -> schemas.UserRead:
    # tạo user mặc định role=customer (id 3) hoặc để services tự gán
    user = services.create_user(db, payload, default_roles=["customer"])
    return schemas.UserRead.model_validate(user)
