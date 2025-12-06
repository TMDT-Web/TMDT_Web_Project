"""Add CollectionItem model and bundle support

Revision ID: b5f3a8c91d2e
Revises: a17377bd5532
Create Date: 2025-11-24 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b5f3a8c91d2e'
down_revision: Union[str, None] = 'a17377bd5532'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create collection_items table (association table with quantity)
    op.create_table(
        'collection_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('collection_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.ForeignKeyConstraint(['collection_id'], ['collections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_collection_items_collection_id'), 'collection_items', ['collection_id'], unique=False)
    op.create_index(op.f('ix_collection_items_product_id'), 'collection_items', ['product_id'], unique=False)
    
    # Add sale_price column to collections table
    op.add_column('collections', sa.Column('sale_price', sa.Float(), nullable=True))
    
    # Migrate existing data: Move products from product.collection_id to collection_items
    # This ensures backward compatibility
    op.execute("""
        INSERT INTO collection_items (collection_id, product_id, quantity)
        SELECT collection_id, id, 1
        FROM products
        WHERE collection_id IS NOT NULL
    """)


def downgrade() -> None:
    # Remove sale_price column from collections
    op.drop_column('collections', 'sale_price')
    
    # Drop collection_items table
    op.drop_index(op.f('ix_collection_items_product_id'), table_name='collection_items')
    op.drop_index(op.f('ix_collection_items_collection_id'), table_name='collection_items')
    op.drop_table('collection_items')
