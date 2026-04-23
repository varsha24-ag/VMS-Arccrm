"""create base schema

Revision ID: 20260309_create_base_schema
Revises:
Create Date: 2026-03-09
"""

from alembic import op


revision = "20260309_create_base_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS employees (
            id SERIAL PRIMARY KEY,
            name VARCHAR NOT NULL,
            email VARCHAR UNIQUE,
            phone VARCHAR UNIQUE,
            password_hash VARCHAR NOT NULL,
            role VARCHAR NOT NULL,
            department VARCHAR
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_employees_id ON employees (id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_employees_email ON employees (email)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_employees_phone ON employees (phone)")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS visitors (
            id SERIAL PRIMARY KEY,
            name VARCHAR NOT NULL,
            status VARCHAR NOT NULL DEFAULT 'pending'
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_visitors_id ON visitors (id)")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS visits (
            id SERIAL PRIMARY KEY,
            visitor_id INTEGER NOT NULL REFERENCES visitors(id),
            host_employee_id INTEGER REFERENCES employees(id),
            purpose VARCHAR,
            checkin_time TIMESTAMPTZ,
            checkout_time TIMESTAMPTZ
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_visits_id ON visits (id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_visits_visitor_id ON visits (visitor_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_visits_host_employee_id ON visits (host_employee_id)")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS visitor_access_passes (
            id SERIAL PRIMARY KEY,
            visitor_id INTEGER NOT NULL REFERENCES visitors(id),
            host_employee_id INTEGER REFERENCES employees(id),
            valid_from TIMESTAMPTZ NOT NULL,
            valid_to TIMESTAMPTZ NOT NULL,
            max_visits INTEGER NOT NULL,
            remaining_visits INTEGER NOT NULL,
            qr_code VARCHAR NOT NULL UNIQUE
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_visitor_access_passes_id ON visitor_access_passes (id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_visitor_access_passes_visitor_id ON visitor_access_passes (visitor_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_visitor_access_passes_host_employee_id ON visitor_access_passes (host_employee_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_visitor_access_passes_qr_code ON visitor_access_passes (qr_code)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS visitor_access_passes")
    op.execute("DROP TABLE IF EXISTS visits")
    op.execute("DROP TABLE IF EXISTS visitors")
    op.execute("DROP TABLE IF EXISTS employees")
