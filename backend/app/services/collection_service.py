"""
Collection Service - Bundle/Combo Support
"""
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.models.collection import Collection, CollectionItem
from app.models.product import Product
from app.schemas.product import CollectionCreate, CollectionUpdate, CollectionItemCreate
from app.core.exceptions import NotFoundException, ConflictException, BadRequestException


class CollectionService:
    """Collection service with proper error handling and validation"""
    
    @staticmethod
    def get_collections(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> tuple[List[Collection], int]:
        """Get all collections"""
        query = db.query(Collection)
        
        if is_active is not None:
            query = query.filter(Collection.is_active == is_active)
        
        total = query.count()
        collections = query.offset(skip).limit(limit).all()
        
        return collections, total
    
    @staticmethod
    def get_collection_by_id(db: Session, collection_id: int) -> Collection:
        """Get collection by ID with items loaded"""
        collection = db.query(Collection)\
            .options(joinedload(Collection.items).joinedload(CollectionItem.product))\
            .filter(Collection.id == collection_id)\
            .first()
        if not collection:
            raise NotFoundException("Collection not found")
        
        return collection
    
    @staticmethod
    def get_collection_by_slug(db: Session, slug: str) -> Collection:
        """Get collection by slug with items loaded"""
        collection = db.query(Collection)\
            .options(joinedload(Collection.items).joinedload(CollectionItem.product))\
            .filter(Collection.slug == slug)\
            .first()
        if not collection:
            raise NotFoundException("Collection not found")
        
        return collection
    
    @staticmethod
    def create_collection(
        db: Session,
        data: CollectionCreate,
        product_ids: Optional[List[int]] = None  # Backward compatibility
    ) -> Collection:
        """Create new collection with bundle items"""
        try:
            # Check if slug already exists
            existing = db.query(Collection).filter(Collection.slug == data.slug).first()
            if existing:
                raise ConflictException(f"Collection with slug '{data.slug}' already exists")
            
            # Check if name already exists
            existing = db.query(Collection).filter(Collection.name == data.name).first()
            if existing:
                raise ConflictException(f"Collection with name '{data.name}' already exists")
            
            # Create collection
            collection_data = data.model_dump(exclude={'items'})
            collection = Collection(**collection_data)
            db.add(collection)
            db.flush()  # Get collection ID
            
            # Add bundle items
            if data.items:
                CollectionService._add_items_to_collection(db, collection.id, data.items)
            
            # Backward compatibility: handle product_ids if provided
            if product_ids:
                for product_id in product_ids:
                    item = CollectionItem(
                        collection_id=collection.id,
                        product_id=product_id,
                        quantity=1
                    )
                    db.add(item)
            
            db.commit()
            db.refresh(collection)
            
            return collection
            
        except (ConflictException, NotFoundException):
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to create collection: {str(e)}")
    
    @staticmethod
    def update_collection(
        db: Session,
        collection_id: int,
        data: CollectionUpdate,
        product_ids: Optional[List[int]] = None  # Backward compatibility
    ) -> Collection:
        """Update collection and bundle items"""
        try:
            collection = db.query(Collection).filter(Collection.id == collection_id).first()
            if not collection:
                raise NotFoundException("Collection not found")
            
            # Check slug uniqueness if being updated
            if data.slug and data.slug != collection.slug:
                existing = db.query(Collection).filter(
                    Collection.slug == data.slug,
                    Collection.id != collection_id
                ).first()
                if existing:
                    raise ConflictException(f"Collection with slug '{data.slug}' already exists")
            
            # Check name uniqueness if being updated
            if data.name and data.name != collection.name:
                existing = db.query(Collection).filter(
                    Collection.name == data.name,
                    Collection.id != collection_id
                ).first()
                if existing:
                    raise ConflictException(f"Collection with name '{data.name}' already exists")
            
            # Update collection fields
            update_data = data.model_dump(exclude_unset=True, exclude={'items'})
            for field, value in update_data.items():
                setattr(collection, field, value)
            
            # Update bundle items if provided
            if data.items is not None:
                # Remove existing items
                db.query(CollectionItem).filter(CollectionItem.collection_id == collection_id).delete()
                # Add new items
                if data.items:
                    CollectionService._add_items_to_collection(db, collection_id, data.items)
            
            # Backward compatibility: handle product_ids if provided
            if product_ids is not None:
                # Clear existing items
                db.query(CollectionItem).filter(CollectionItem.collection_id == collection_id).delete()
                # Add new items with quantity 1
                for product_id in product_ids:
                    item = CollectionItem(
                        collection_id=collection_id,
                        product_id=product_id,
                        quantity=1
                    )
                    db.add(item)
            
            db.commit()
            db.refresh(collection)
            
            return collection
            
        except (NotFoundException, ConflictException):
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to update collection: {str(e)}")
    
    @staticmethod
    def delete_collection(db: Session, collection_id: int) -> None:
        """Delete collection (cascade deletes collection items)"""
        try:
            collection = db.query(Collection).filter(Collection.id == collection_id).first()
            if not collection:
                raise NotFoundException("Collection not found")
            
            # Remove collection reference from products (backward compatibility)
            db.query(Product).filter(Product.collection_id == collection_id).update(
                {"collection_id": None}
            )
            
            # Delete collection (cascade will delete CollectionItems)
            db.delete(collection)
            db.commit()
            
        except NotFoundException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to delete collection: {str(e)}")
    
    @staticmethod
    def _add_items_to_collection(
        db: Session,
        collection_id: int,
        items: List[CollectionItemCreate]
    ) -> None:
        """Internal method to add items to collection"""
        # Validate all products exist
        product_ids = [item.product_id for item in items]
        products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        found_ids = {p.id for p in products}
        missing_ids = set(product_ids) - found_ids
        
        if missing_ids:
            raise NotFoundException(f"Products not found: {missing_ids}")
        
        # Create collection items
        for item_data in items:
            item = CollectionItem(
                collection_id=collection_id,
                product_id=item_data.product_id,
                quantity=item_data.quantity
            )
            db.add(item)
    
    @staticmethod
    def _assign_products(db: Session, collection_id: int, product_ids: List[int]) -> None:
        """Internal method for backward compatibility - assigns products to collection"""
        # Validate all products exist
        products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        found_ids = {p.id for p in products}
        missing_ids = set(product_ids) - found_ids
        
        if missing_ids:
            raise NotFoundException(f"Products not found: {missing_ids}")
        
        # Update products to have this collection_id
        db.query(Product).filter(Product.id.in_(product_ids)).update(
            {"collection_id": collection_id},
            synchronize_session=False
        )
    
    @staticmethod
    def add_products_to_collection(
        db: Session,
        collection_id: int,
        product_ids: List[int]
    ) -> Collection:
        """Add products to existing collection as bundle items (quantity 1)"""
        try:
            collection = CollectionService.get_collection_by_id(db, collection_id)
            
            # Validate products exist
            products = db.query(Product).filter(Product.id.in_(product_ids)).all()
            found_ids = {p.id for p in products}
            missing_ids = set(product_ids) - found_ids
            
            if missing_ids:
                raise NotFoundException(f"Products not found: {missing_ids}")
            
            # Get existing product IDs in collection
            existing_product_ids = {item.product_id for item in collection.items}
            
            # Add only new products
            for product_id in product_ids:
                if product_id not in existing_product_ids:
                    item = CollectionItem(
                        collection_id=collection_id,
                        product_id=product_id,
                        quantity=1
                    )
                    db.add(item)
            
            db.commit()
            db.refresh(collection)
            return collection
        except NotFoundException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to add products to collection: {str(e)}")
    
    @staticmethod
    def remove_products_from_collection(
        db: Session,
        collection_id: int,
        product_ids: List[int]
    ) -> Collection:
        """Remove products from collection (delete collection items)"""
        try:
            collection = CollectionService.get_collection_by_id(db, collection_id)
            
            # Delete collection items for specified products
            db.query(CollectionItem).filter(
                CollectionItem.collection_id == collection_id,
                CollectionItem.product_id.in_(product_ids)
            ).delete(synchronize_session=False)
            
            db.commit()
            db.refresh(collection)
            return collection
        except NotFoundException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to remove products from collection: {str(e)}")
