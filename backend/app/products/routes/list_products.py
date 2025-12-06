from __future__ import annotations

from fastapi import Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.products import schemas, services

from . import router


@router.get("", response_model=schemas.ProductListResponse)
def list_products(
    q: str | None = None,
    category_id: int | None = Query(default=None),
    min_price: float | None = Query(default=None),
    max_price: float | None = Query(default=None),
    tag_ids: list[int] | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> schemas.ProductListResponse:
    query = schemas.ProductSearchQuery(
        q=q,
        category_id=category_id,
        min_price=min_price,
        max_price=max_price,
        tag_ids=tag_ids,
        page=page,
        size=size,
    )
    products, total = services.list_products(db, query)
    return schemas.ProductListResponse(
        items=[schemas.ProductListItem.model_validate(product) for product in products],
        total=total,
        page=page,
        size=size,
    )
