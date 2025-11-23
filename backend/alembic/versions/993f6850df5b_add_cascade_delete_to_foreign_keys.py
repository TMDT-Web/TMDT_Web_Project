"""add_cascade_delete_to_foreign_keys

Revision ID: 993f6850df5b
Revises: 85cce2bf60c0
Create Date: 2025-11-21 17:07:36.523961

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '993f6850df5b'
down_revision: Union[str, None] = '85cce2bf60c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add CASCADE delete to foreign keys to prevent orphan records"""
    
    # ===== ORDER_ITEMS -> ORDERS =====
    # When an order is deleted, all its items should be deleted too
    op.drop_constraint('order_items_order_id_fkey', 'order_items', type_='foreignkey')
    op.create_foreign_key(
        'order_items_order_id_fkey',
        'order_items', 'orders',
        ['order_id'], ['id'],
        ondelete='CASCADE'
    )
    
    # ===== ORDER_ITEMS -> PRODUCTS =====
    # When a product is deleted, we should NOT delete order items (keep history)
    # But we should set to NULL or keep as-is (we have product_name snapshot)
    # Keep as NO ACTION - historical data preserved
    
    # ===== ORDERS -> USERS =====
    # When a user is deleted, what to do with their orders?
    # Option 1: CASCADE - delete all orders (GDPR compliance)
    # Option 2: SET NULL - keep orders but anonymize (better for analytics)
    # We'll use CASCADE for now (can be changed based on business needs)
    op.drop_constraint('orders_user_id_fkey', 'orders', type_='foreignkey')
    op.create_foreign_key(
        'orders_user_id_fkey',
        'orders', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    """Revert to NO ACTION foreign keys"""
    
    # Orders
    op.drop_constraint('orders_user_id_fkey', 'orders', type_='foreignkey')
    op.create_foreign_key(
        'orders_user_id_fkey',
        'orders', 'users',
        ['user_id'], ['id']
    )
    
    # Order Items
    op.drop_constraint('order_items_order_id_fkey', 'order_items', type_='foreignkey')
    op.create_foreign_key(
        'order_items_order_id_fkey',
        'order_items', 'orders',
        ['order_id'], ['id']
    )
