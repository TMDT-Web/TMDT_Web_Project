"""
Database Initialization Script
Creates default admin user if not exists
"""
import sys
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine
from app.models.base import Base
from app.models.user import User
from app.models.enums import UserRole, VipTier
from app.core.security import get_password_hash


def init_db():
    """Initialize database with default data"""
    print("Initializing database...")
    
    # Create image folders
    import os
    folders = [
        "static/images/products",
        "static/images/categories",
        "static/images/banners",
        "static/images/collections"
    ]
    for folder in folders:
        os.makedirs(folder, exist_ok=True)
    print("✓ Image folders created")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created")
    
    # Create session
    db: Session = SessionLocal()
    
    try:
        # Check if admin user exists
        admin = db.query(User).filter(User.email == "admin@luxefurniture.com").first()
        
        if not admin:
            # Create admin user
            admin = User(
                email="admin@luxefurniture.com",
                full_name="Admin User",
                hashed_password=get_password_hash("Admin@123456"),
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
                vip_tier=VipTier.DIAMOND
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"✓ Admin user created: {admin.email}")
        else:
            print(f"✓ Admin user already exists: {admin.email}")
            # Ensure admin has correct role
            if admin.role != UserRole.ADMIN:
                admin.role = UserRole.ADMIN
                db.commit()
                print("  Updated role to ADMIN")
        
        print("\n" + "="*50)
        print("Database initialization complete!")
        print("="*50)
        print("\nDefault Credentials:")
        print(f"  Email: admin@luxefurniture.com")
        print(f"  Password: Admin@123456")
        print("="*50)
        
    except Exception as e:
        print(f"Error during initialization: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
