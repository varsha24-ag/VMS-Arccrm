"""add visit invite fields

Revision ID: 20260319_add_visit_invite_fields
Revises: 20260312_add_id_cards
Create Date: 2026-03-19
"""

from alembic import op


revision = "20260319_add_visit_invite_fields"
down_revision = "20260312_add_id_cards"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE visits ADD COLUMN IF NOT EXISTS source VARCHAR DEFAULT 'manual'")
    op.execute("ALTER TABLE visits ADD COLUMN IF NOT EXISTS qr_expiry TIMESTAMPTZ")
    op.execute("UPDATE visits SET source = 'manual' WHERE source IS NULL")


def downgrade() -> None:
    op.execute("ALTER TABLE visits DROP COLUMN IF EXISTS qr_expiry")
    op.execute("ALTER TABLE visits DROP COLUMN IF EXISTS source")
