from urllib.parse import urlparse

from sqlalchemy import inspect, or_, text
from sqlalchemy.orm import Session
from typing import Optional

from app.core.db import Base, SessionLocal, engine
from app.core.security import get_password_hash
from app.models import Employee, Visitor, IdCard  # noqa: F401 - ensures table metadata is registered


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
        if "id_number" not in columns:
            connection.execute(text("ALTER TABLE visitors ADD COLUMN id_number VARCHAR"))
            columns.add("id_number")
        if "approval_token" not in columns:
            connection.execute(text("ALTER TABLE visitors ADD COLUMN approval_token VARCHAR"))
            columns.add("approval_token")
        if "approved_at" not in columns:
            connection.execute(text("ALTER TABLE visitors ADD COLUMN approved_at TIMESTAMPTZ"))
            columns.add("approved_at")
        if "rejected_at" not in columns:
            connection.execute(text("ALTER TABLE visitors ADD COLUMN rejected_at TIMESTAMPTZ"))
            columns.add("rejected_at")
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
        if "approval_token" not in columns:
            connection.execute(text("ALTER TABLE visits ADD COLUMN approval_token VARCHAR"))
            columns.add("approval_token")
        if "approved_at" not in columns:
            connection.execute(text("ALTER TABLE visits ADD COLUMN approved_at TIMESTAMPTZ"))
            columns.add("approved_at")
        if "rejected_at" not in columns:
            connection.execute(text("ALTER TABLE visits ADD COLUMN rejected_at TIMESTAMPTZ"))
            columns.add("rejected_at")
        if "approval_email_sent" not in columns:
            connection.execute(text("ALTER TABLE visits ADD COLUMN approval_email_sent BOOLEAN"))
            columns.add("approval_email_sent")
        if "approval_email_error" not in columns:
            connection.execute(text("ALTER TABLE visits ADD COLUMN approval_email_error VARCHAR"))
            columns.add("approval_email_error")
        if "approval_email_last_attempt_at" not in columns:
            connection.execute(text("ALTER TABLE visits ADD COLUMN approval_email_last_attempt_at TIMESTAMPTZ"))
            columns.add("approval_email_last_attempt_at")
        if "source" not in columns:
            connection.execute(text("ALTER TABLE visits ADD COLUMN source VARCHAR DEFAULT 'manual'"))
            columns.add("source")
        if "qr_expiry" not in columns:
            connection.execute(text("ALTER TABLE visits ADD COLUMN qr_expiry TIMESTAMPTZ"))
            columns.add("qr_expiry")


def repair_access_pass_schema() -> None:
    inspector = inspect(engine)
    if "visitor_access_passes" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("visitor_access_passes")}

    with engine.begin() as connection:
        if "purpose" not in columns:
            connection.execute(text("ALTER TABLE visitor_access_passes ADD COLUMN purpose VARCHAR"))
            columns.add("purpose")


def normalize_photo_url(value: Optional[str]) -> Optional[str]:
    if not value:
        return value
    if value.startswith("/uploads/"):
        return value
    if value.startswith("http://") or value.startswith("https://"):
        try:
            parsed = urlparse(value)
            if parsed.path.startswith("/uploads/"):
                return parsed.path
        except Exception:
            return value
    return value


def normalize_visitor_photo_urls(db: Session) -> int:
    visitors = db.query(Visitor).filter(Visitor.photo_url.isnot(None)).all()
    updated = 0
    for visitor in visitors:
        normalized = normalize_photo_url(visitor.photo_url)
        if normalized != visitor.photo_url:
            visitor.photo_url = normalized
            updated += 1
    if updated:
        db.commit()
    return updated


def seed_employees(db: Session) -> int:
    seed_users = [
        {
            "name": "Front Desk",
            "email": "reception@arccrm.local",
            "phone": "9900000002",
            "password": "Reception@123",
            "role": "receptionist",
            "department": "Operations",
        },
        {
            "name": "Default Employee",
            "email": "employee@arccrm.local",
            "phone": "9900000003",
            "password": "Employee@123",
            "role": "employee",
            "department": "General",
        },
        {
            "name": "Varsha Nagda",
            "email": "varsha.nagda@arcgate.com",
            "phone": "9900000004",
            "password": "Employee@123",
            "role": "employee",
            "department": "Admin",
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


def create_admin_user(db: Session) -> bool:
    """
    Ensures a default admin user exists in the database.
    """
    admin_email = "admin@arccrm.local"
    admin_user = db.query(Employee).filter(Employee.email == admin_email).first()

    if admin_user:
        return False

    db.add(
        Employee(
            name="System Admin",
            email=admin_email,
            phone="9900000001",
            password_hash=get_password_hash("Admin@123"),
            role="admin",
            department="IT",
        )
    )
    db.commit()
    return True


def seed_id_cards(db: Session) -> int:
    existing = db.query(IdCard).count()
    if existing > 0:
        return 0

    seed_cards = ["ID-1001", "ID-1002", "ID-1003", "ID-1004", "ID-1005"]
    for card_number in seed_cards:
        db.add(IdCard(id_number=card_number, status="available"))
    db.commit()
    return len(seed_cards)


def bootstrap_database() -> int:
    create_tables()
    repair_visitor_schema()
    repair_visit_schema()
    repair_access_pass_schema()
    db = SessionLocal()
    try:
        create_admin_user(db)
        created_employees = seed_employees(db)
        created_cards = seed_id_cards(db)
        normalize_visitor_photo_urls(db)
        return created_employees + created_cards
    finally:
        db.close()


if __name__ == "__main__":
    created = bootstrap_database()
    print(f"Database bootstrapped. Seeded records: {created}")
