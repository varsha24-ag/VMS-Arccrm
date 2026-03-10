import re
from typing import Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.models.employee import Employee
from app.schemas.auth import LoginRequest, LoginResponse, UserOut

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_REGEX = re.compile(r"^\+?[0-9]{10,15}$")


def find_user_by_identifier(db: Session, identifier: str) -> Optional[Employee]:
    """
    Finds a user by email or phone number.
    Ensures case-insensitive search for email and clean lookup for phone.
    """
    clean_id = identifier.strip()
    
    # Try email lookup if it looks like an email
    if EMAIL_REGEX.match(clean_id):
        return db.query(Employee).filter(func.lower(Employee.email) == clean_id.lower()).first()
    
    # Try phone lookup if it looks like a phone number
    if PHONE_REGEX.match(clean_id):
        return db.query(Employee).filter(Employee.phone == clean_id).first()
    
    # Fallback to combined search if format is ambiguous
    return db.query(Employee).filter(
        or_(
            func.lower(Employee.email) == clean_id.lower(),
            Employee.phone == clean_id
        )
    ).first()


def login_employee(db: Session, data: LoginRequest) -> LoginResponse:
    """
    Core login logic. Validates credentials and returns JWT session.
    """
    user = find_user_by_identifier(db, data.identifier)
    
    if not user:
        raise ValueError("Invalid user or credentials")

    if not verify_password(data.password, user.password_hash):
        raise ValueError("Invalid user or credentials")

    token = create_access_token(user_id=user.id, role=user.role)
    
    return LoginResponse(
        access_token=token,
        user=UserOut(
            id=user.id, 
            name=user.name, 
            role=user.role
        ),
    )
