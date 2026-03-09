from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.db import Base, SessionLocal, engine
from app.core.security import get_password_hash
from app.models import Employee, Visitor  # noqa: F401 - ensures table metadata is registered


def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


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
    db = SessionLocal()
    try:
        return seed_employees(db)
    finally:
        db.close()


if __name__ == "__main__":
    created = bootstrap_database()
    print(f"Database bootstrapped. Seeded employees: {created}")
