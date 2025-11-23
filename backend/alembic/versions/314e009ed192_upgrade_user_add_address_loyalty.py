"""upgrade_user_add_address_loyalty

Revision ID: 314e009ed192
Revises: a4e67dbf4339
Create Date: 2025-11-21 13:35:59.284488

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '314e009ed192'
down_revision: Union[str, None] = 'a4e67dbf4339'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create enums (with existence check)
    conn = op.get_bind()
    
    # Check if viptier exists
    result = conn.execute(sa.text(
        "SELECT 1 FROM pg_type WHERE typname = 'viptier'"
    )).fetchone()
    if not result:
        op.execute("CREATE TYPE viptier AS ENUM ('MEMBER', 'SILVER', 'GOLD', 'DIAMOND')")
    
    # Check if userrole exists
    result = conn.execute(sa.text(
        "SELECT 1 FROM pg_type WHERE typname = 'userrole'"
    )).fetchone()
    if not result:
        op.execute("CREATE TYPE userrole AS ENUM ('CUSTOMER', 'STAFF', 'ADMIN')")
    
    # 2. Add new columns to users table
    op.add_column('users', sa.Column('avatar_url', sa.String(500), nullable=True))
    op.add_column('users', sa.Column('loyalty_points', sa.Integer(), nullable=False, server_default='0'))
    op.execute("ALTER TABLE users ADD COLUMN vip_tier viptier NOT NULL DEFAULT 'MEMBER'::viptier")
    op.execute("ALTER TABLE users ADD COLUMN role userrole NOT NULL DEFAULT 'CUSTOMER'::userrole")
    
    # 3. Migrate is_admin to role
    op.execute("""
        UPDATE users 
        SET role = CASE 
            WHEN is_admin = true THEN 'ADMIN'::userrole
            ELSE 'CUSTOMER'::userrole
        END
    """)
    
    # 4. Create indexes on users
    op.create_index('ix_users_full_name', 'users', ['full_name'], unique=False)
    op.create_index('ix_users_phone', 'users', ['phone'], unique=False)
    
    # 5. Create addresses table
    op.create_table(
        'addresses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('receiver_name', sa.String(255), nullable=False),
        sa.Column('receiver_phone', sa.String(20), nullable=False),
        sa.Column('address_line', sa.String(500), nullable=False),
        sa.Column('ward', sa.String(100), nullable=True),
        sa.Column('district', sa.String(100), nullable=False),
        sa.Column('city', sa.String(100), nullable=False),
        sa.Column('postal_code', sa.String(20), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notes', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('NOW()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_addresses_id', 'addresses', ['id'], unique=False)
    op.create_index('ix_addresses_user_id', 'addresses', ['user_id'], unique=False)
    op.create_index('ix_addresses_user_default', 'addresses', ['user_id', 'is_default'], unique=False)
    
    # 6. Migrate existing user.address to addresses table
    op.execute("""
        INSERT INTO addresses (user_id, name, receiver_name, receiver_phone, address_line, district, city, is_default)
        SELECT 
            id as user_id,
            'Địa chỉ mặc định' as name,
            full_name as receiver_name,
            COALESCE(phone, 'N/A') as receiver_phone,
            COALESCE(address, 'Chưa cập nhật') as address_line,
            'Chưa cập nhật' as district,
            'Chưa cập nhật' as city,
            true as is_default
        FROM users
        WHERE address IS NOT NULL AND address != ''
    """)
    
    # 7. Drop old is_admin column (replaced by role)
    op.drop_column('users', 'is_admin')
    
    # 8. Drop old address column (moved to addresses table)
    op.drop_column('users', 'address')


def downgrade() -> None:
    # 1. Restore is_admin column
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), server_default='false', nullable=False))
    op.execute("""
        UPDATE users 
        SET is_admin = (role = 'admin'::userrole)
    """)
    
    # 2. Restore address column
    op.add_column('users', sa.Column('address', sa.String(500), nullable=True))
    op.execute("""
        UPDATE users u
        SET address = (
            SELECT address_line 
            FROM addresses 
            WHERE user_id = u.id AND is_default = true 
            LIMIT 1
        )
    """)
    
    # 3. Drop indexes on users
    op.drop_index('ix_users_phone', table_name='users')
    op.drop_index('ix_users_full_name', table_name='users')
    
    # 4. Drop addresses table
    op.drop_index('ix_addresses_user_default', table_name='addresses')
    op.drop_index('ix_addresses_user_id', table_name='addresses')
    op.drop_index('ix_addresses_id', table_name='addresses')
    op.drop_table('addresses')
    
    # 5. Drop new columns from users
    op.drop_column('users', 'role')
    op.drop_column('users', 'vip_tier')
    op.drop_column('users', 'loyalty_points')
    op.drop_column('users', 'avatar_url')
    
    # 6. Drop enums
    op.execute('DROP TYPE IF EXISTS userrole')
    op.execute('DROP TYPE IF EXISTS viptier')
