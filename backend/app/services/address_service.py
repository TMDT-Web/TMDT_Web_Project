"""
Address Service - Manage user shipping addresses
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.address import Address
from app.schemas.user import AddressCreate, AddressUpdate


class AddressService:
    """Service for managing user addresses"""
    
    @staticmethod
    def get_user_addresses(db: Session, user_id: int) -> list[Address]:
        """Get all addresses of a user"""
        return db.query(Address).filter(Address.user_id == user_id).all()
    
    @staticmethod
    def get_address_by_id(db: Session, address_id: int, user_id: int) -> Address:
        """Get specific address"""
        address = db.query(Address).filter(
            Address.id == address_id,
            Address.user_id == user_id
        ).first()
        
        if not address:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Address not found"
            )
        return address
    
    @staticmethod
    def create_address(db: Session, user_id: int, address_data: AddressCreate) -> Address:
        """Create new address"""
        # If this is set as default, unset other defaults
        if address_data.is_default:
            db.query(Address).filter(Address.user_id == user_id).update(
                {"is_default": False}
            )
        
        address = Address(
            user_id=user_id,
            **address_data.model_dump()
        )
        db.add(address)
        db.commit()
        db.refresh(address)
        return address
    
    @staticmethod
    def update_address(
        db: Session,
        address_id: int,
        user_id: int,
        address_data: AddressUpdate
    ) -> Address:
        """Update address"""
        address = AddressService.get_address_by_id(db, address_id, user_id)
        
        update_data = address_data.model_dump(exclude_unset=True)
        
        # If setting as default, unset others
        if update_data.get('is_default'):
            db.query(Address).filter(
                Address.user_id == user_id,
                Address.id != address_id
            ).update({"is_default": False})
        
        for field, value in update_data.items():
            setattr(address, field, value)
        
        db.commit()
        db.refresh(address)
        return address
    
    @staticmethod
    def delete_address(db: Session, address_id: int, user_id: int) -> None:
        """Delete address"""
        address = AddressService.get_address_by_id(db, address_id, user_id)
        
        # Don't allow deleting if it's the only address
        address_count = db.query(Address).filter(Address.user_id == user_id).count()
        if address_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the only address"
            )
        
        # If deleting default, set another as default
        if address.is_default:
            another = db.query(Address).filter(
                Address.user_id == user_id,
                Address.id != address_id
            ).first()
            if another:
                another.is_default = True
        
        db.delete(address)
        db.commit()
    
    @staticmethod
    def set_default_address(db: Session, address_id: int, user_id: int) -> Address:
        """Set address as default"""
        address = AddressService.get_address_by_id(db, address_id, user_id)
        
        # Unset all other defaults
        db.query(Address).filter(Address.user_id == user_id).update(
            {"is_default": False}
        )
        
        address.is_default = True
        db.commit()
        db.refresh(address)
        return address
