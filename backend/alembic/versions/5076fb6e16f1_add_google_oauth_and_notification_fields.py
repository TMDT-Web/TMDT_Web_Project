"""add_google_oauth_and_notification_fields

Revision ID: 5076fb6e16f1
Revises: 7639dc7054dd
Create Date: 2025-12-02 04:19:50.888636

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5076fb6e16f1'
down_revision: Union[str, None] = '7639dc7054dd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add Google OAuth fields to users table (check if not exists)
    from sqlalchemy import inspect
    from alembic import op
    
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'google_id' not in columns:
        op.add_column('users', sa.Column('google_id', sa.String(255), nullable=True))
        op.create_index('ix_users_google_id', 'users', ['google_id'], unique=False)
    
    if 'email_verified' not in columns:
        op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'))
    
    # Check and create tables if they don't exist
    tables = inspector.get_table_names()
    
    if 'user_notification_preferences' not in tables:
        op.create_table(
            'user_notification_preferences',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('email_enabled', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('sms_enabled', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('push_enabled', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('order_updates', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('promotions', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('user_id')
        )
        op.create_index('ix_user_notification_preferences_user_id', 'user_notification_preferences', ['user_id'])
    
    if 'notifications' not in tables:
        op.create_table(
            'notifications',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('event_type', sa.String(50), nullable=False),
            sa.Column('title', sa.String(255), nullable=False),
            sa.Column('message', sa.Text(), nullable=False),
            sa.Column('data', sa.JSON(), nullable=True),
            sa.Column('read', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
        op.create_index('ix_notifications_event_type', 'notifications', ['event_type'])
    
    if 'notification_logs' not in tables:
        op.create_table(
            'notification_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('notification_id', sa.Integer(), nullable=False),
            sa.Column('channel', sa.String(20), nullable=False),
            sa.Column('status', sa.String(20), nullable=False),
            sa.Column('provider_response', sa.Text(), nullable=True),
            sa.Column('attempt', sa.Integer(), nullable=False, server_default='1'),
            sa.Column('sent_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['notification_id'], ['notifications.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_notification_logs_notification_id', 'notification_logs', ['notification_id'])
        op.create_index('ix_notification_logs_channel', 'notification_logs', ['channel'])
    
    if 'push_subscriptions' not in tables:
        op.create_table(
            'push_subscriptions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('endpoint', sa.Text(), nullable=False),
            sa.Column('p256dh', sa.Text(), nullable=False),
            sa.Column('auth', sa.Text(), nullable=False),
            sa.Column('user_agent', sa.String(500), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_push_subscriptions_user_id', 'push_subscriptions', ['user_id'])
        op.create_index('ix_push_subscriptions_endpoint', 'push_subscriptions', ['endpoint'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_push_subscriptions_endpoint', table_name='push_subscriptions')
    op.drop_index('ix_push_subscriptions_user_id', table_name='push_subscriptions')
    op.drop_table('push_subscriptions')
    
    op.drop_index('ix_notification_logs_channel', table_name='notification_logs')
    op.drop_index('ix_notification_logs_notification_id', table_name='notification_logs')
    op.drop_table('notification_logs')
    
    op.drop_index('ix_notifications_event_type', table_name='notifications')
    op.drop_index('ix_notifications_user_id', table_name='notifications')
    op.drop_table('notifications')
    
    op.drop_index('ix_user_notification_preferences_user_id', table_name='user_notification_preferences')
    op.drop_table('user_notification_preferences')
    
    op.drop_index('ix_users_google_id', table_name='users')
    op.drop_column('users', 'email_verified')
    op.drop_column('users', 'google_id')
