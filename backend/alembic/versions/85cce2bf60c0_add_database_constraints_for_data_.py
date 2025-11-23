"""add_database_constraints_for_data_integrity

Revision ID: 85cce2bf60c0
Revises: 83633d33f361
Create Date: 2025-11-21 17:04:45.575658

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '85cce2bf60c0'
down_revision: Union[str, None] = '83633d33f361'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add CHECK constraints for data integrity"""
    
    # ===== PRODUCTS TABLE =====
    # 1. Price must be positive
    op.create_check_constraint(
        'ck_products_price_positive',
        'products',
        'price > 0'
    )
    
    # 2. Sale price must be less than regular price (if set)
    op.create_check_constraint(
        'ck_products_sale_price_valid',
        'products',
        'sale_price IS NULL OR (sale_price >= 0 AND sale_price < price)'
    )
    
    # 3. Stock must be non-negative (prevent negative inventory)
    op.execute('UPDATE products SET stock = 0 WHERE stock IS NULL')
    op.alter_column('products', 'stock',
                    existing_type=sa.Integer(),
                    nullable=False,
                    server_default='0')
    op.create_check_constraint(
        'ck_products_stock_non_negative',
        'products',
        'stock >= 0'
    )
    
    # 4. Weight must be positive (if set)
    op.create_check_constraint(
        'ck_products_weight_positive',
        'products',
        'weight IS NULL OR weight > 0'
    )
    
    # ===== ORDERS TABLE =====
    # 5. All amounts must be non-negative
    op.create_check_constraint(
        'ck_orders_subtotal_non_negative',
        'orders',
        'subtotal >= 0'
    )
    
    op.create_check_constraint(
        'ck_orders_shipping_fee_non_negative',
        'orders',
        'shipping_fee IS NULL OR shipping_fee >= 0'
    )
    
    op.create_check_constraint(
        'ck_orders_discount_non_negative',
        'orders',
        'discount_amount IS NULL OR discount_amount >= 0'
    )
    
    op.create_check_constraint(
        'ck_orders_total_positive',
        'orders',
        'total_amount > 0'
    )
    
    # 6. Deposit cannot exceed total
    op.create_check_constraint(
        'ck_orders_deposit_valid',
        'orders',
        'deposit_amount IS NULL OR (deposit_amount >= 0 AND deposit_amount <= total_amount)'
    )
    
    # 7. Remaining amount must be non-negative
    op.create_check_constraint(
        'ck_orders_remaining_non_negative',
        'orders',
        'remaining_amount IS NULL OR remaining_amount >= 0'
    )
    
    # 8. Deposit + Remaining should equal Total (with small tolerance for floating point)
    op.create_check_constraint(
        'ck_orders_amounts_consistent',
        'orders',
        'deposit_amount IS NULL OR remaining_amount IS NULL OR ABS((deposit_amount + remaining_amount) - total_amount) < 0.01'
    )
    
    # ===== ORDER_ITEMS TABLE =====
    # 9. Quantity must be positive
    op.create_check_constraint(
        'ck_order_items_quantity_positive',
        'order_items',
        'quantity > 0'
    )
    
    # 10. Price at purchase must be non-negative
    op.create_check_constraint(
        'ck_order_items_price_non_negative',
        'order_items',
        'price_at_purchase >= 0'
    )
    
    # ===== USERS TABLE =====
    # 11. Loyalty points must be non-negative
    op.create_check_constraint(
        'ck_users_loyalty_points_non_negative',
        'users',
        'loyalty_points >= 0'
    )


def downgrade() -> None:
    """Remove CHECK constraints"""
    
    # Users
    op.drop_constraint('ck_users_loyalty_points_non_negative', 'users', type_='check')
    
    # Order Items
    op.drop_constraint('ck_order_items_price_non_negative', 'order_items', type_='check')
    op.drop_constraint('ck_order_items_quantity_positive', 'order_items', type_='check')
    
    # Orders
    op.drop_constraint('ck_orders_amounts_consistent', 'orders', type_='check')
    op.drop_constraint('ck_orders_remaining_non_negative', 'orders', type_='check')
    op.drop_constraint('ck_orders_deposit_valid', 'orders', type_='check')
    op.drop_constraint('ck_orders_total_positive', 'orders', type_='check')
    op.drop_constraint('ck_orders_discount_non_negative', 'orders', type_='check')
    op.drop_constraint('ck_orders_shipping_fee_non_negative', 'orders', type_='check')
    op.drop_constraint('ck_orders_subtotal_non_negative', 'orders', type_='check')
    
    # Products
    op.drop_constraint('ck_products_weight_positive', 'products', type_='check')
    op.drop_constraint('ck_products_stock_non_negative', 'products', type_='check')
    op.alter_column('products', 'stock',
                    existing_type=sa.Integer(),
                    nullable=True,
                    server_default=None)
    op.drop_constraint('ck_products_sale_price_valid', 'products', type_='check')
    op.drop_constraint('ck_products_price_positive', 'products', type_='check')
