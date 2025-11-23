"""
Product Service
"""
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from app.models.product import Product, Category, Collection
from app.schemas.product import ProductCreate, ProductUpdate, CategoryCreate, CategoryUpdate
from app.core.exceptions import NotFoundException, BadRequestException


class ProductService:
    """Product service with proper error handling and validation"""
    
    @staticmethod
    def get_products(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        category_id: Optional[int] = None,
        collection_id: Optional[int] = None,
        search: Optional[str] = None,
        is_featured: Optional[bool] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None
    ) -> tuple[List[Product], int]:
        """Get products with filters"""
        query = db.query(Product).filter(Product.is_active == True)
        
        if category_id:
            query = query.filter(Product.category_id == category_id)
            
        if collection_id:
            query = query.filter(Product.collection_id == collection_id)
        
        if search:
            query = query.filter(
                or_(
                    Product.name.ilike(f"%{search}%"),
                    Product.description.ilike(f"%{search}%")
                )
            )
        
        if is_featured is not None:
            query = query.filter(Product.is_featured == is_featured)
        
        # Price filters
        if min_price is not None:
            query = query.filter(Product.price >= min_price)
        
        if max_price is not None:
            query = query.filter(Product.price <= max_price)
        
        total = query.count()
        products = query.offset(skip).limit(limit).all()
        
        return products, total
    
    @staticmethod
    def get_product_by_id(db: Session, product_id: int) -> Product:
        """Get product by ID"""
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise NotFoundException("Product not found")
        
        return product
    
    @staticmethod
    def get_product_by_slug(db: Session, slug: str) -> Product:
        """Get product by slug"""
        product = db.query(Product).filter(Product.slug == slug).first()
        if not product:
            raise NotFoundException("Product not found")
        
        return product
    
    @staticmethod
    def create_product(db: Session, data: ProductCreate) -> Product:
        """Create new product with error handling"""
        try:
            product = Product(**data.model_dump())
            db.add(product)
            db.commit()
            db.refresh(product)
            return product
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to create product: {str(e)}")
    
    @staticmethod
    def update_product(db: Session, product_id: int, data: ProductUpdate) -> Product:
        """Update product with error handling"""
        try:
            product = db.query(Product).filter(Product.id == product_id).first()
            if not product:
                raise NotFoundException("Product not found")
            
            update_data = data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(product, field, value)
            
            db.commit()
            db.refresh(product)
            return product
        except NotFoundException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to update product: {str(e)}")
    
    @staticmethod
    def delete_product(db: Session, product_id: int) -> None:
        """Delete product with error handling"""
        try:
            product = db.query(Product).filter(Product.id == product_id).first()
            if not product:
                raise NotFoundException("Product not found")
            
            db.delete(product)
            db.commit()
        except NotFoundException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to delete product: {str(e)}")
    
    # Category methods
    @staticmethod
    def get_categories(db: Session) -> List[Category]:
        """Get all categories"""
        return db.query(Category).all()
    
    @staticmethod
    def create_category(db: Session, data: CategoryCreate) -> Category:
        """Create new category with error handling"""
        try:
            category = Category(**data.model_dump())
            db.add(category)
            db.commit()
            db.refresh(category)
            return category
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to create category: {str(e)}")
    
    @staticmethod
    def update_category(db: Session, category_id: int, data: CategoryUpdate) -> Category:
        """Update category with error handling"""
        try:
            category = db.query(Category).filter(Category.id == category_id).first()
            if not category:
                raise NotFoundException("Category not found")
            
            update_data = data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(category, field, value)
            
            db.commit()
            db.refresh(category)
            return category
        except NotFoundException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to update category: {str(e)}")
    
    @staticmethod
    def delete_category(db: Session, category_id: int) -> None:
        """Delete category with validation (prevents deletion if category has products)"""
        try:
            category = db.query(Category).filter(Category.id == category_id).first()
            if not category:
                raise NotFoundException("Category not found")
            
            # CRITICAL: Check if category has products before deletion
            product_count = db.query(Product).filter(Product.category_id == category_id).count()
            if product_count > 0:
                raise BadRequestException(
                    f"Cannot delete category. It has {product_count} product(s) associated with it. "
                    "Please reassign or delete the products first."
                )
            
            db.delete(category)
            db.commit()
        except (NotFoundException, BadRequestException):
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to delete category: {str(e)}")
