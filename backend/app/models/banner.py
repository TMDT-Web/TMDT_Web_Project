"""
Banner Model - Homepage promotional banners
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func

from app.models.base import Base


class Banner(Base):
    """Banner Model - Homepage sliders/hero banners"""
    __tablename__ = "banners"
    
    # Title and content
    title = Column(String(200), nullable=False)  # Main banner text
    subtitle = Column(String(300), nullable=True)  # Optional tagline/description
    
    # Media
    image_url = Column(String(500), nullable=False)  # Banner image URL
    
    # Action
    link_url = Column(String(500), nullable=True)  # Optional redirect URL
    
    # Display settings
    display_order = Column(Integer, default=0, index=True)  # Sort order (lower = first)
    is_active = Column(Boolean, default=True, index=True)  # Show/hide banner
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<Banner(id={self.id}, title='{self.title}', active={self.is_active}, order={self.display_order})>"
