from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.products import schemas, services

from . import router


@router.get("/suggestions", response_model=schemas.SuggestionResponse)
def suggest_products(q: str, db: Session = Depends(get_db)) -> schemas.SuggestionResponse:
    suggestions = services.suggest_products(db, q)
    return schemas.SuggestionResponse(suggestions=suggestions)
