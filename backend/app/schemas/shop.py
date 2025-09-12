from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class ShopBase(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    logo_url: Optional[str] = None
    policies: Optional[Dict[str, Any]] = None

class ShopCreate(ShopBase):
    pass

class ShopUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=1, max_length=255)
    logo_url: Optional[str] = None
    policies: Optional[Dict[str, Any]] = None

class ShopResponse(ShopBase):
    id: str
    owner_user_id: str
    rating_count: int
    rating_sum: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PayoutAccountBase(BaseModel):
    bank: str = Field(..., min_length=1, max_length=128)
    account_no_masked: str = Field(..., min_length=1, max_length=64)
    owner_name: str = Field(..., min_length=1, max_length=255)

class PayoutAccountCreate(PayoutAccountBase):
    pass

class PayoutAccountResponse(PayoutAccountBase):
    id: str
    shop_id: str
    verified_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
