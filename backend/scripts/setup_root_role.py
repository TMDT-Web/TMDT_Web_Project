"""
Script để tạo role root và gán full permissions
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.users.services import (
    ensure_system_roles,
    ensure_permissions_catalog,
    ensure_permissions_have_names,
    attach_permissions_to_system_roles,
)
from app.core.database import SessionLocal


def main():
    print("🔧 Setting up root role and permissions...")
    
    db = SessionLocal()
    try:
        # 1. Tạo system roles
        print("📝 Creating system roles (root, admin, manager, staff, customer)...")
        ensure_system_roles(db)
        
        # 2. Tạo permissions catalog
        print("🔐 Creating permissions catalog...")
        ensure_permissions_catalog(db)
        
        # 3. Đảm bảo permissions có names
        print("✏️  Ensuring permissions have names...")
        ensure_permissions_have_names(db)
        
        # 4. Gán permissions cho roles
        print("🔗 Attaching permissions to system roles...")
        attach_permissions_to_system_roles(db)
        
        print("✅ Root role created with full permissions!")
        print("✅ All system roles configured successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()
