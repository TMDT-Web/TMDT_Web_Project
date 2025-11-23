"""
Address Model - Multiple shipping addresses per user
"""
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base


class Address(Base):
    """
    Address Model - Critical for furniture delivery!
    Users can have multiple addresses: Home, New apartment, Office, Parents' house...
    """
    __tablename__ = "addresses"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Nickname for easy identification (e.g., "Home", "Vinhomes Apartment", "Office")
    name = Column(String(100), nullable=False)
    
    # Receiver info (may differ from account owner)
    receiver_name = Column(String(255), nullable=False)
    receiver_phone = Column(String(20), nullable=False)
    
    # Full address details
    address_line = Column(String(500), nullable=False)  # Street number, street name, ward
    ward = Column(String(100), nullable=True)
    district = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=True)
    
    # Default address flag
    is_default = Column(Boolean, default=False, nullable=False)
    
    # Additional notes (e.g., "Call 30 minutes before", "Has guard dog")
    notes = Column(String(500), nullable=True)
    
    # Relationship
    user = relationship("User", back_populates="addresses")
    
    def __repr__(self):
        return f"<Address(id={self.id}, name='{self.name}', city='{self.city}')>"
    
    @property
    def full_address(self) -> str:
        """Get formatted full address"""
        parts = [self.address_line, self.ward, self.district, self.city]
        return ", ".join([p for p in parts if p])
