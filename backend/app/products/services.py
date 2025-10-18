from __future__ import annotations

from typing import Iterable, List, Optional, Sequence, Tuple

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.products import schemas
from app.products.models import Category, Product, ProductImage, Tag


def list_products(db: Session, query: schemas.ProductSearchQuery) -> Tuple[List[Product], int]:
    queryset = (
        db.query(Product)
        .options(joinedload(Product.category), joinedload(Product.tags))
    )

    filters = []
    if query.q:
        pattern = f"%{query.q.lower()}%"
        filters.append(
            or_(func.lower(Product.name).like(pattern), func.lower(Product.description).like(pattern))
        )
    if query.category_id:
        filters.append(Product.category_id == query.category_id)
    if query.min_price is not None:
        filters.append(Product.price >= query.min_price)
    if query.max_price is not None:
        filters.append(Product.price <= query.max_price)
    if query.tag_ids:
        queryset = queryset.join(Product.tags).filter(Tag.id.in_(query.tag_ids))

    if filters:
        queryset = queryset.filter(*filters)

    total = queryset.distinct(Product.id).count()

    items = (
        queryset.order_by(Product.created_at.desc())
        .offset((query.page - 1) * query.size)
        .limit(query.size)
        .distinct()
        .all()
    )
    return items, total


def get_product(db: Session, product_id: int) -> Product:
    product = (
        db.query(Product)
        .options(joinedload(Product.category), joinedload(Product.tags), joinedload(Product.images))
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


def _assign_tags(db: Session, product: Product, tag_ids: Iterable[int]) -> None:
    tags = db.query(Tag).filter(Tag.id.in_(list(tag_ids))).all()
    if len(tags) != len(set(tag_ids)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more tags not found")
    product.tags = tags


def create_product(db: Session, payload: schemas.ProductCreate) -> Product:
    if db.query(Product).filter(Product.sku == payload.sku).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SKU already exists")
    product = Product(
        sku=payload.sku,
        name=payload.name,
        description=payload.description,
        price=payload.price,
        stock_quantity=payload.stock_quantity,
        specifications=payload.specifications or {},
        main_image=payload.main_image,
        category_id=payload.category_id,
    )
    db.add(product)
    db.flush()
    if payload.tag_ids:
        _assign_tags(db, product, payload.tag_ids)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product_id: int, payload: schemas.ProductUpdate) -> Product:
    product = get_product(db, product_id)
    for field in [
        "name",
        "description",
        "price",
        "stock_quantity",
        "specifications",
        "main_image",
        "category_id",
        "is_active",
    ]:
        value = getattr(payload, field)
        if value is not None:
            setattr(product, field, value)
    if payload.tag_ids is not None:
        _assign_tags(db, product, payload.tag_ids)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int) -> None:
    product = get_product(db, product_id)
    db.delete(product)
    db.commit()


def create_category(db: Session, payload: schemas.CategoryCreate) -> Category:
    category = Category(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def list_categories(db: Session) -> List[Category]:
    return db.query(Category).order_by(Category.name).all()


def create_tag(db: Session, payload: schemas.TagCreate) -> Tag:
    tag = Tag(**payload.model_dump())
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def list_tags(db: Session) -> List[Tag]:
    return db.query(Tag).order_by(Tag.name).all()


def suggest_products(db: Session, query: str, limit: int = 10) -> List[str]:
    stmt = (
        select(Product.name)
        .where(Product.name.ilike(f"%{query}%"))
        .order_by(Product.name.asc())
        .limit(limit)
    )
    return [row[0] for row in db.execute(stmt).all()]
