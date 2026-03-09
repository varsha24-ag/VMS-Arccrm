import re

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.models.employee import Employee
from app.schemas.auth import LoginRequest, LoginResponse, UserOut

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_REGEX = re.compile(r"^\+?[0-9]{10,15}$")


def normalize_identifier(identifier: str) -> str:
    return identifier.strip()


def find_user_by_identifier(db: Session, identifier: str) -> Employee | None:
    identifier = normalize_identifier(identifier)
    if EMAIL_REGEX.match(identifier):
        return (
            db.query(Employee)
            .filter(func.lower(Employee.email) == identifier.lower())
            .first()
        )

    if PHONE_REGEX.match(identifier):
        return db.query(Employee).filter(Employee.phone == identifier).first()

    return (
        db.query(Employee)
        .filter((func.lower(Employee.email) == identifier.lower()) | (Employee.phone == identifier))
        .first()
    )


def login_employee(db: Session, data: LoginRequest) -> LoginResponse:
    user = find_user_by_identifier(db, data.identifier)
    if not user:
        raise ValueError("User not found")

    if not verify_password(data.password, user.password_hash):
        raise ValueError("Invalid credentials")

    token = create_access_token(user_id=user.id, role=user.role)
    return LoginResponse(
        access_token=token,
        user=UserOut(id=user.id, name=user.name, role=user.role),
    )
