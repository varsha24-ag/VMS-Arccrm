"""add id_cards table

Revision ID: 20260312_add_id_cards
Revises: 20260311_add_id_number
Create Date: 2026-03-12
"""

from alembic import op


revision = "20260312_add_id_cards"
down_revision = "20260311_add_id_number"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS id_cards (
            id SERIAL PRIMARY KEY,
            id_number VARCHAR NOT NULL UNIQUE,
            status VARCHAR NOT NULL DEFAULT 'available',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS id_cards")
