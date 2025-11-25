"""add_collection_support_to_cart

Revision ID: aa1947b91743
Revises: f4ac62403424
Create Date: 2025-11-24 17:06:05.222463

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aa1947b91743'
down_revision: Union[str, None] = 'f4ac62403424'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add collection_id column to cart_items (nullable to support both regular products and combo products)
    op.add_column('cart_items', sa.Column('collection_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_cart_items_collection_id',
        'cart_items', 'collections',
        ['collection_id'], ['id'],
        ondelete='CASCADE'
    )
    
    # Add index for performance
    op.create_index('ix_cart_items_collection_id', 'cart_items', ['collection_id'])


def downgrade() -> None:
    op.drop_index('ix_cart_items_collection_id', table_name='cart_items')
    op.drop_constraint('fk_cart_items_collection_id', 'cart_items', type_='foreignkey')
    op.drop_column('cart_items', 'collection_id')
