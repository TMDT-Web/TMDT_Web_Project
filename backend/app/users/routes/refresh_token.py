from __future__ import annotations

from fastapi import Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.users import schemas, services
from app.users.models import User

from . import router


@router.post("/auth/refresh", response_model=schemas.TokenPair)
def refresh_token(
    refresh_token: str = Body(..., embed=True),
    db: Session = Depends(get_db),
) -> schemas.TokenPair:
    payload = decode_token(refresh_token, is_refresh=True)
    user = db.get(User, int(payload.sub))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return services.issue_token_pair(user)
