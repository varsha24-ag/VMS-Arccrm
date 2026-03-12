"""add visitor id_number

Revision ID: 20260311_add_id_number
Revises: 20260310_visit_schema_fix
Create Date: 2026-03-11
"""

from alembic import op


revision = "20260311_add_id_number"
down_revision = "20260310_visit_schema_fix"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS id_number VARCHAR")


def downgrade() -> None:
    op.execute("ALTER TABLE visitors DROP COLUMN IF EXISTS id_number")
