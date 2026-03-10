"""fix visitors schema

Revision ID: 20260310_visitor_schema_fix
Revises:
Create Date: 2026-03-10
"""

from alembic import op


revision = "20260310_visitor_schema_fix"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'visitors' AND column_name = 'full_name'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'visitors' AND column_name = 'name'
            ) THEN
                ALTER TABLE visitors RENAME COLUMN full_name TO name;
            END IF;
        END
        $$;
        """
    )

    op.execute("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS phone VARCHAR")
    op.execute("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS email VARCHAR")
    op.execute("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS company VARCHAR")
    op.execute("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS visitor_type VARCHAR")
    op.execute("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS photo_url VARCHAR")
    op.execute("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now()")


def downgrade() -> None:
    op.execute("ALTER TABLE visitors DROP COLUMN IF EXISTS created_at")
    op.execute("ALTER TABLE visitors DROP COLUMN IF EXISTS photo_url")
    op.execute("ALTER TABLE visitors DROP COLUMN IF EXISTS visitor_type")
    op.execute("ALTER TABLE visitors DROP COLUMN IF EXISTS company")
    op.execute("ALTER TABLE visitors DROP COLUMN IF EXISTS email")
    op.execute("ALTER TABLE visitors DROP COLUMN IF EXISTS phone")

    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'visitors' AND column_name = 'name'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'visitors' AND column_name = 'full_name'
            ) THEN
                ALTER TABLE visitors RENAME COLUMN name TO full_name;
            END IF;
        END
        $$;
        """
    )
