from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.users import schemas, services

from . import router


@router.get("/auth/google/callback", response_model=schemas.GoogleAuthCallbackResponse)
async def google_oauth_callback(code: str, db: Session = Depends(get_db)) -> schemas.GoogleAuthCallbackResponse:
    user, created = await services.exchange_google_code(db, code)
    token_pair = services.issue_token_pair(user)
    return schemas.GoogleAuthCallbackResponse(**token_pair.model_dump(), is_new_user=created)
