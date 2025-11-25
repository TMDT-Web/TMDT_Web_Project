"""add is_collection to cart_items

Revision ID: c3f4a2b5e8d1
Revises: aa1947b91743
Create Date: 2025-11-25 02:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c3f4a2b5e8d1'
down_revision = 'aa1947b91743'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_collection column to cart_items table
    op.add_column('cart_items', sa.Column('is_collection', sa.Boolean(), nullable=False, server_default='false'))


def downgrade():
    # Remove is_collection column
    op.drop_column('cart_items', 'is_collection')
