"""reconcile employee schema

Revision ID: 20260403_reconcile_employees
Revises: 20260319_add_visit_invite_fields
Create Date: 2026-04-03
"""

from alembic import op
import sqlalchemy as sa

revision = "20260403_reconcile_employees"
down_revision = "20260319_add_visit_invite_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Adding columns with IF NOT EXISTS logic via op.execute for robustness
    op.execute(
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS resource_id INTEGER")
    op.execute("ALTER TABLE employees ADD COLUMN IF NOT EXISTS project VARCHAR")
    op.execute(
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS project_lead VARCHAR")
    op.execute("ALTER TABLE employees ADD COLUMN IF NOT EXISTS shift VARCHAR")
    op.execute(
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE")
    op.execute(
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()")
    op.execute(
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()")

    # Ensure uniqueness and indices
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_employees_resource_id ON employees (resource_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_employees_resource_id")
    op.execute("ALTER TABLE employees DROP COLUMN IF EXISTS updated_at")
    op.execute("ALTER TABLE employees DROP COLUMN IF EXISTS created_at")
    op.execute("ALTER TABLE employees DROP COLUMN IF EXISTS is_active")
    op.execute("ALTER TABLE employees DROP COLUMN IF EXISTS shift")
    op.execute("ALTER TABLE employees DROP COLUMN IF EXISTS project_lead")
    op.execute("ALTER TABLE employees DROP COLUMN IF EXISTS project")
    op.execute("ALTER TABLE employees DROP COLUMN IF EXISTS resource_id")
