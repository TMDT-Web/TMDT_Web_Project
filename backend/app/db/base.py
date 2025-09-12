from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.mysql import BINARY
import uuid

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    """Mixin to add created_at and updated_at timestamps"""
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    updated_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6), onupdate=func.current_timestamp(6))

class UUIDMixin:
    """Mixin to add UUID primary key"""
    id = Column(BINARY(16), primary_key=True, default=lambda: uuid.uuid4().bytes)
