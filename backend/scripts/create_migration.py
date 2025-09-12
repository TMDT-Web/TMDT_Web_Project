#!/usr/bin/env python3
"""
Script to create initial migration for C2C Marketplace database
"""
import os
import sys
import subprocess
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def create_migration():
    """Create initial migration"""
    print("Creating initial migration...")
    
    # Change to project directory
    os.chdir(project_root)
    
    try:
        # Generate migration
        result = subprocess.run([
            "alembic", "revision", "--autogenerate", 
            "-m", "Initial migration - C2C Marketplace schema"
        ], check=True, capture_output=True, text=True)
        
        print("Migration created successfully!")
        print(result.stdout)
        
        # List migration files
        migrations_dir = project_root / "migrations" / "versions"
        if migrations_dir.exists():
            migration_files = list(migrations_dir.glob("*.py"))
            if migration_files:
                print(f"\nMigration files created:")
                for file in migration_files:
                    print(f"  - {file.name}")
        
    except subprocess.CalledProcessError as e:
        print(f"Error creating migration: {e}")
        print(f"Error output: {e.stderr}")
        return False
    
    return True

if __name__ == "__main__":
    success = create_migration()
    sys.exit(0 if success else 1)
