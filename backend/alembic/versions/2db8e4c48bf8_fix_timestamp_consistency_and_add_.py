"""fix_timestamp_consistency_and_add_performance_indexes

Revision ID: 2db8e4c48bf8
Revises: 993f6850df5b
Create Date: 2025-11-21 17:13:59.877733

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2db8e4c48bf8'
down_revision: Union[str, None] = '993f6850df5b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Fix timestamp consistency and add performance indexes"""
    
    # ===== FIX TIMESTAMP INCONSISTENCY =====
    # Products table uses 'timestamp with time zone' while others use 'without'
    # Standardize to 'timestamp without time zone' for consistency
    op.alter_column('products', 'created_at',
                    type_=sa.DateTime(timezone=False),
                    existing_type=sa.DateTime(timezone=True),
                    existing_nullable=True)
    
    op.alter_column('products', 'updated_at',
                    type_=sa.DateTime(timezone=False),
                    existing_type=sa.DateTime(timezone=True),
                    existing_nullable=True)
    
    # ===== ADD PERFORMANCE INDEXES =====
    # These indexes dramatically improve query performance for common filters
    
    # 1. Orders - Filter by status (admin dashboard)
    op.create_index('ix_orders_status', 'orders', ['status'])
    
    # 2. Orders - Filter by user (customer order history)
    op.create_index('ix_orders_user_id', 'orders', ['user_id'])
    
    # 3. Orders - Sort by created_at (most common sort)
    op.create_index('ix_orders_created_at', 'orders', ['created_at'])
    
    # 4. Products - Filter by category (product listing)
    op.create_index('ix_products_category_id', 'products', ['category_id'])
    
    # 5. Products - Filter by collection (collection pages)
    op.create_index('ix_products_collection_id', 'products', ['collection_id'])
    
    # 6. Products - Filter by is_active (public product queries)
    op.create_index('ix_products_is_active', 'products', ['is_active'])
    
    # 7. Products - Filter by is_featured (homepage)
    op.create_index('ix_products_is_featured', 'products', ['is_featured'])
    
    # 8. Order Items - Query by order (order details page)
    op.create_index('ix_order_items_order_id', 'order_items', ['order_id'])
    
    # 9. Order Items - Query by product (product sales analytics)
    op.create_index('ix_order_items_product_id', 'order_items', ['product_id'])
    
    # 10. Users - Filter by role (admin user management)
    op.create_index('ix_users_role', 'users', ['role'])
    
    # 11. Users - Filter by vip_tier (VIP customer queries)
    op.create_index('ix_users_vip_tier', 'users', ['vip_tier'])
    
    # 12. Chat Sessions - Filter by status (admin chat dashboard)
    op.create_index('ix_chat_sessions_status', 'chat_sessions', ['status'])
    
    # 13. Chat Sessions - Filter by user (customer chat history)
    op.create_index('ix_chat_sessions_user_id', 'chat_sessions', ['user_id'])


def downgrade() -> None:
    """Remove performance indexes and revert timestamp changes"""
    
    # Drop indexes
    op.drop_index('ix_chat_sessions_user_id', 'chat_sessions')
    op.drop_index('ix_chat_sessions_status', 'chat_sessions')
    op.drop_index('ix_users_vip_tier', 'users')
    op.drop_index('ix_users_role', 'users')
    op.drop_index('ix_order_items_product_id', 'order_items')
    op.drop_index('ix_order_items_order_id', 'order_items')
    op.drop_index('ix_products_is_featured', 'products')
    op.drop_index('ix_products_is_active', 'products')
    op.drop_index('ix_products_collection_id', 'products')
    op.drop_index('ix_products_category_id', 'products')
    op.drop_index('ix_orders_created_at', 'orders')
    op.drop_index('ix_orders_user_id', 'orders')
    op.drop_index('ix_orders_status', 'orders')
    
    # Revert timestamp changes
    op.alter_column('products', 'updated_at',
                    type_=sa.DateTime(timezone=True),
                    existing_type=sa.DateTime(timezone=False),
                    existing_nullable=True)
    
    op.alter_column('products', 'created_at',
                    type_=sa.DateTime(timezone=True),
                    existing_type=sa.DateTime(timezone=False),
                    existing_nullable=True)
