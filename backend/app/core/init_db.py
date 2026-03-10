from sqlalchemy import inspect, or_, text
from sqlalchemy.orm import Session

from app.core.db import Base, SessionLocal, engine
from app.core.security import get_password_hash
from app.models import Employee, Visitor  # noqa: F401 - ensures table metadata is registered


def create_tables() -> None:
    Base.metadata.create_all(bind=engine)

def repair_visitor_schema() -> None:
    inspector = inspect(engine)
    if "visitors" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("visitors")}

    with engine.begin() as connection:
        if "full_name" in columns and "name" not in columns:
            connection.execute(text("ALTER TABLE visitors RENAME COLUMN full_name TO name"))
            columns.add("name")
        if "phone" not in columns:
            connection.execute(text("ALTER TABLE visitors ADD COLUMN phone VARCHAR"))
            columns.add("phone")
        if "email" not in columns:
            connection.execute(text("ALTER TABLE visitors ADD COLUMN email VARCHAR"))
            columns.add("email")
        if "company" not in columns:
            connection.execute(text("ALTER TABLE visitors ADD COLUMN company VARCHAR"))
            columns.add("company")
        if "visitor_type" not in columns:
            connection.execute(text("ALTER TABLE visitors ADD COLUMN visitor_type VARCHAR"))
            columns.add("visitor_type")
        if "photo_url" not in columns:
            connection.execute(text("ALTER TABLE visitors ADD COLUMN photo_url VARCHAR"))
            columns.add("photo_url")
        if "created_at" not in columns:
            connection.execute(text("ALTER TABLE visitors ADD COLUMN created_at TIMESTAMPTZ DEFAULT now()"))
            columns.add("created_at")

def repair_visit_schema() -> None:
    inspector = inspect(engine)
    if "visits" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("visits")}

    with engine.begin() as connection:
        if "status" not in columns:
            connection.execute(text("ALTER TABLE visits ADD COLUMN status VARCHAR DEFAULT 'checked_in'"))
            columns.add("status")
        if "policy_accepted" not in columns:
            connection.execute(text("ALTER TABLE visits ADD COLUMN policy_accepted BOOLEAN DEFAULT FALSE"))
            columns.add("policy_accepted")
        if "qr_code" not in columns:
            connection.execute(text("ALTER TABLE visits ADD COLUMN qr_code VARCHAR"))
            columns.add("qr_code")
        if "created_at" not in columns:
            connection.execute(text("ALTER TABLE visits ADD COLUMN created_at TIMESTAMPTZ DEFAULT now()"))
            columns.add("created_at")


def seed_employees(db: Session) -> int:
    seed_users = [
        {
            "name": "System Admin",
            "email": "admin@arccrm.local",
            "phone": "+919900000001",
            "password": "Admin@123",
            "role": "admin",
            "department": "Administration",
        },
        {
            "name": "Front Desk",
            "email": "reception@arccrm.local",
            "phone": "+919900000002",
            "password": "Reception@123",
            "role": "receptionist",
            "department": "Operations",
        },
        {
            "name": "Default Employee",
            "email": "employee@arccrm.local",
            "phone": "+919900000003",
            "password": "Employee@123",
            "role": "employee",
            "department": "General",
        },
    ]

    created_count = 0
    for user in seed_users:
        existing_user = (
            db.query(Employee)
            .filter(or_(Employee.email == user["email"], Employee.phone == user["phone"]))
            .first()
        )
        if existing_user:
            continue

        db.add(
            Employee(
                name=user["name"],
                email=user["email"],
                phone=user["phone"],
                password_hash=get_password_hash(user["password"]),
                role=user["role"],
                department=user["department"],
            )
        )
        created_count += 1

    db.commit()
    return created_count


def bootstrap_database() -> int:
    create_tables()
    repair_visitor_schema()
    repair_visit_schema()
    db = SessionLocal()
    try:
        return seed_employees(db)
    finally:
        db.close()


if __name__ == "__main__":
    created = bootstrap_database()
    print(f"Database bootstrapped. Seeded employees: {created}")
