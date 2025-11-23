"""
Seed data script for LuxeFurniture
Creates admin user and sample data for testing and development.
"""

import sys
import logging
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.enums import UserRole, VipTier
from app.models.product import Category, Product
from app.core.security import get_password_hash

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Sample categories (4 main categories as required)
CATEGORIES = [
    {"name": "Sofa", "slug": "sofa", "description": "Sofa sets and seating furniture"},
    {"name": "Bed", "slug": "bed", "description": "Beds and bedroom furniture"},
    {"name": "Dining Table", "slug": "dining-table", "description": "Dining tables and chairs"},
    {"name": "Wardrobe", "slug": "wardrobe", "description": "Wardrobes and storage furniture"},
]

# Sample products with dummy data
PRODUCTS = [
    {
        "name": "Modern 3-Seater Sofa Monaco",
        "slug": "modern-3-seater-sofa-monaco",
        "description": "Contemporary 3-seater sofa with premium fabric upholstery and solid wood frame. Grey color suits any living room decor.",
        "price": 15900000,
        "sale_price": 12900000,
        "sku": "SOF-MON-001",
        "category_slug": "sofa",
        "stock": 25,
        "weight": 85.5,
        "dimensions": {"length": 220, "width": 90, "height": 85, "unit": "cm"},
        "specs": {"material": "Fabric, Pine Wood, D40 Foam", "color": "Grey"},
        "is_featured": True,
        "images": ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800", 
                   "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800"]
    },
    {
        "name": "Oak Wood Dining Table Milan 6-Seater",
        "slug": "oak-wood-dining-table-milan-6-seater",
        "description": "Natural solid oak dining table with minimalist Nordic design. Spacious surface for 6-8 people. PU finish protects natural wood.",
        "price": 12500000,
        "sale_price": 10200000,
        "sku": "TAB-MIL-001",
        "category_slug": "dining-table",
        "stock": 18,
        "weight": 65.0,
        "dimensions": {"length": 160, "width": 90, "height": 75, "unit": "cm"},
        "specs": {"material": "Natural Oak Wood, PU Finish", "color": "Natural Brown"},
        "is_featured": True,
        "images": ["https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800",
                   "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800"]
    },
    {
        "name": "Luxury King Size Bed 1.8m",
        "slug": "luxury-king-size-bed-1-8m",
        "description": "Modern bed with premium faux leather headboard. MDF frame with melamine coating for moisture and termite resistance. Elegant and comfortable design.",
        "price": 8900000,
        "sale_price": 7500000,
        "sku": "BED-LUX-180",
        "category_slug": "bed",
        "stock": 30,
        "weight": 95.0,
        "dimensions": {"length": 200, "width": 180, "height": 120, "unit": "cm"},
        "specs": {"material": "MDF Wood, Faux Leather, Melamine", "color": "White - Grey"},
        "is_featured": True,
        "images": ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
                   "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800"]
    },
    {
        "name": "Sliding Door Wardrobe Modena 2.4m",
        "slug": "sliding-door-wardrobe-modena-2-4m",
        "description": "3-door sliding wardrobe, space-saving design. Smart interior with hanging rails, drawers and shelves. Integrated full-length mirror.",
        "price": 11200000,
        "sale_price": 9800000,
        "sku": "WAR-MOD-240",
        "category_slug": "wardrobe",
        "stock": 15,
        "weight": 120.0,
        "dimensions": {"length": 240, "width": 60, "height": 220, "unit": "cm"},
        "specs": {"material": "MDF Wood, Glass, Aluminum", "color": "White - Wood Tone"},
        "is_featured": True,
        "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
                   "https://images.unsplash.com/photo-1595428773637-4759b7d63c9b?w=800"]
    },
]

def seed_admin_user() -> None:
    """Create default admin user if it doesn't exist"""
    db = SessionLocal()
    try:
        # Check if admin exists
        existing_admin = db.query(User).filter(User.email == "admin@gmail.com").first()
        
        if existing_admin:
            logger.info("Admin user already exists: admin@gmail.com")
            return
        
        # Create admin with specified credentials
        admin = User(
            email="admin@gmail.com",
            full_name="System Administrator",
            hashed_password=get_password_hash("admin@123"),
            role=UserRole.ADMIN,
            vip_tier=VipTier.DIAMOND,
            is_active=True,
            is_verified=True,
            phone="0123456789"
        )
        db.add(admin)
        db.commit()
        logger.info("Successfully created admin user: admin@gmail.com")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create admin user: {str(e)}")
        raise
    finally:
        db.close()

def seed_categories() -> dict[str, int]:
    """Create categories with idempotency check"""
    db = SessionLocal()
    try:
        category_map = {}
        
        for cat_data in CATEGORIES:
            # Check if category already exists
            category = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
            
            if category:
                logger.info(f"Category already exists: {cat_data['name']}")
                category_map[cat_data["slug"]] = category.id
            else:
                # Create new category
                category = Category(**cat_data)
                db.add(category)
                db.flush()
                category_map[cat_data["slug"]] = category.id
                logger.info(f"Successfully created category: {cat_data['name']}")
        
        db.commit()
        return category_map
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed categories: {str(e)}")
        raise
    finally:
        db.close()

def seed_products(category_map: dict[str, int]) -> None:
    """Create products with proper data structure"""
    db = SessionLocal()
    try:
        for prod_data in PRODUCTS:
            # Check if product already exists
            product = db.query(Product).filter(Product.slug == prod_data["slug"]).first()
            
            if product:
                logger.info(f"Product already exists: {prod_data['name']}")
                continue
            
            # Get category_id from map
            category_slug = prod_data.pop("category_slug")
            category_id = category_map.get(category_slug)
            
            if not category_id:
                logger.warning(f"Category not found for product: {prod_data['name']} (slug: {category_slug})")
                continue
            
            # Extract images and set thumbnail
            images = prod_data.pop("images", [])
            thumbnail_url = images[0] if images else None
            
            # Create product with all required fields
            product = Product(
                category_id=category_id,
                thumbnail_url=thumbnail_url,
                images=images,
                **prod_data
            )
            db.add(product)
            logger.info(f"Successfully created product: {prod_data['name']} with {len(images)} images")
        
        db.commit()
        logger.info(f"Product seeding completed")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed products: {str(e)}")
        raise
    finally:
        db.close()

def main() -> None:
    """Main seeding function with error handling and logging"""
    logger.info("=" * 60)
    logger.info("Starting database seeding process...")
    logger.info("=" * 60)
    
    try:
        # Seed admin user
        logger.info("\n[1/3] Seeding admin user...")
        seed_admin_user()
        
        # Seed categories
        logger.info("\n[2/3] Seeding categories...")
        category_map = seed_categories()
        
        # Seed products
        logger.info("\n[3/3] Seeding products...")
        seed_products(category_map)
        
        # Success summary
        logger.info("\n" + "=" * 60)
        logger.info("✅ Database seeding completed successfully!")
        logger.info("=" * 60)
        logger.info("\nDefault Admin Credentials:")
        logger.info("  Email:    admin@gmail.com")
        logger.info("  Password: admin@123")
        logger.info("  Role:     ADMIN")
        logger.info("  VIP Tier: DIAMOND")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error("\n" + "=" * 60)
        logger.error(f"❌ Database seeding failed with error:")
        logger.error(f"   {str(e)}")
        logger.error("=" * 60)
        raise


if __name__ == "__main__":
    main()
