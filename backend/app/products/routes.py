from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.users import dependencies as deps
from app.users.models import User
from app.products import schemas, services

router = APIRouter(prefix="/products", tags=["Products"])


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


@router.get("/suggestions", response_model=schemas.SuggestionResponse)
def suggest_products(q: str, db: Session = Depends(get_db)) -> schemas.SuggestionResponse:
    suggestions = services.suggest_products(db, q)
    return schemas.SuggestionResponse(suggestions=suggestions)


@router.get("/{product_id}", response_model=schemas.ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)) -> schemas.ProductRead:
    product = services.get_product(db, product_id)
    return schemas.ProductRead.model_validate(product)


@router.post("", response_model=schemas.ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: schemas.ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> schemas.ProductRead:
    product = services.create_product(db, payload)
    return schemas.ProductRead.model_validate(product)


@router.patch("/{product_id}", response_model=schemas.ProductRead)
def update_product(
    product_id: int,
    payload: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> schemas.ProductRead:
    product = services.update_product(db, product_id, payload)
    return schemas.ProductRead.model_validate(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> Response:
    services.delete_product(db, product_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


category_router = APIRouter(prefix="/categories", tags=["Categories"])


@category_router.get("", response_model=list[schemas.CategoryRead])
def list_categories(db: Session = Depends(get_db)) -> list[schemas.CategoryRead]:
    categories = services.list_categories(db)
    return [schemas.CategoryRead.model_validate(cat) for cat in categories]


@category_router.post("", response_model=schemas.CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> schemas.CategoryRead:
    category = services.create_category(db, payload)
    return schemas.CategoryRead.model_validate(category)


tag_router = APIRouter(prefix="/tags", tags=["Tags"])


@tag_router.get("", response_model=list[schemas.TagRead])
def list_tags(db: Session = Depends(get_db)) -> list[schemas.TagRead]:
    tags = services.list_tags(db)
    return [schemas.TagRead.model_validate(tag) for tag in tags]


@tag_router.post("", response_model=schemas.TagRead, status_code=status.HTTP_201_CREATED)
def create_tag(
    payload: schemas.TagCreate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> schemas.TagRead:
    tag = services.create_tag(db, payload)
    return schemas.TagRead.model_validate(tag)


router.include_router(category_router)
router.include_router(tag_router)
