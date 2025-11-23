"""
Banner Schemas
"""
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from datetime import datetime

from app.schemas.base import TimestampSchema


class BannerBase(BaseModel):
    """Banner base schema"""
    title: str = Field(..., min_length=1, max_length=200)
    subtitle: Optional[str] = Field(None, max_length=300)
    image_url: str = Field(..., min_length=1, max_length=500)
    link_url: Optional[str] = Field(None, max_length=500)
    display_order: int = Field(default=0)
    is_active: bool = Field(default=True)


class BannerCreate(BannerBase):
    """Banner create schema"""
    pass


class BannerUpdate(BaseModel):
    """Banner update schema - all fields optional"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    subtitle: Optional[str] = Field(None, max_length=300)
    image_url: Optional[str] = Field(None, min_length=1, max_length=500)
    link_url: Optional[str] = Field(None, max_length=500)
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class BannerResponse(TimestampSchema, BannerBase):
    """Banner response schema with timestamps"""
    pass


class BannerListResponse(BaseModel):
    """Banner list response with pagination"""
    banners: List[BannerResponse]
    total: int
