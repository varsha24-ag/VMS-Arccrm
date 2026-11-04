"""add system_settings table

Revision ID: 20261102_add_system_settings
Revises: 45ca6eb5fb95
Create Date: 2026-11-02 11:30:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = '20261102_add_system_settings'
down_revision = '45ca6eb5fb95'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'system_settings',
        sa.Column('key', sa.String(), nullable=False),
        sa.Column('value', sa.String(), nullable=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('key')
    )
    op.create_index(op.f('ix_system_settings_key'), 'system_settings', ['key'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_system_settings_key'), table_name='system_settings')
    op.drop_table('system_settings')

