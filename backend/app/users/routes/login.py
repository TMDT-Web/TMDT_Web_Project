from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.users import schemas, services

from . import router


@router.post("/auth/login", response_model=schemas.TokenPair)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)) -> schemas.TokenPair:
    user = services.authenticate_user(db, payload.email, payload.password)
    return services.issue_token_pair(user)
