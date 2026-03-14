"""fix visits schema

Revision ID: 20260310_visit_schema_fix
Revises: 20260310_visitor_schema_fix
Create Date: 2026-03-10
"""

from alembic import op


revision = "20260310_visit_schema_fix"
down_revision = "20260310_visitor_schema_fix"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE visits ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'checked_in'")
    op.execute("ALTER TABLE visits ADD COLUMN IF NOT EXISTS policy_accepted BOOLEAN DEFAULT FALSE")
    op.execute("ALTER TABLE visits ADD COLUMN IF NOT EXISTS qr_code VARCHAR")
    op.execute("ALTER TABLE visits ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now()")


def downgrade() -> None:
    op.execute("ALTER TABLE visits DROP COLUMN IF EXISTS created_at")
    op.execute("ALTER TABLE visits DROP COLUMN IF EXISTS qr_code")
    op.execute("ALTER TABLE visits DROP COLUMN IF EXISTS policy_accepted")
    op.execute("ALTER TABLE visits DROP COLUMN IF EXISTS status")
