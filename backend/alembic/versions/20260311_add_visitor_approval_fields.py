"""add visitor approval fields

Revision ID: 20260311_add_visitor_approval_fields
Revises: 20260311_add_id_number
Create Date: 2026-03-11
"""

from alembic import op


revision = "20260311_add_visitor_approval_fields"
down_revision = "20260311_add_id_number"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS approval_token VARCHAR")
    op.execute("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ")
    op.execute("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ")


def downgrade() -> None:
    op.execute("ALTER TABLE visitors DROP COLUMN IF EXISTS rejected_at")
    op.execute("ALTER TABLE visitors DROP COLUMN IF EXISTS approved_at")
    op.execute("ALTER TABLE visitors DROP COLUMN IF EXISTS approval_token")
