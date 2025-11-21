from fastapi import APIRouter

router = APIRouter(prefix="/products", tags=["Products"])
category_router = APIRouter(prefix="/categories", tags=["Categories"])
tag_router = APIRouter(prefix="/tags", tags=["Tags"])

from . import list_products, suggest_products, get_product, create_product, update_product, delete_product  # noqa: E402,F401
from . import list_categories, create_category  # noqa: E402,F401
from . import list_tags, create_tag  # noqa: E402,F401
from . import upload_image  # noqa: E402,F401

router.include_router(category_router)
router.include_router(tag_router)

__all__ = ["router"]
