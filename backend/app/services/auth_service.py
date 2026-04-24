import requests
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models.employee import Employee
from app.schemas.auth import LoginRequest, LoginResponse, UserOut
from app.core.config import settings


def find_user_by_email_and_resource_id(db: Session, email: str, resource_id: int) -> Optional[Employee]:
    """
    Finds a user by email and resource_id in the local DB.
    """
    return db.query(Employee).filter(
        func.lower(Employee.email) == email.strip().lower(),
        Employee.resource_id == int(resource_id)
    ).first()


def login_employee(db: Session, data: LoginRequest) -> LoginResponse:
    """
    Core login logic. Validates credentials against ARCCRM API and returns JWT session.
    """
    app_id = settings.APP_ID or ""
    api_url = f"{settings.THIRD_PARTY_API_DOMAIN}/api/SignIn/AppSignIn/validate"

    payload = {
        "EMail": data.email,
        "Password": data.password,
        "AppId": app_id
    }

    try:
        response = requests.post(api_url, json=payload, timeout=10)
        response.raise_for_status()
        api_data = response.json()
    except Exception:
        raise ValueError("Login failed")

    auth_status = str(api_data.get("Authentication_status")).lower()
    if auth_status != "true":
        raise ValueError("Login failed")

    resource_id = api_data.get("ResourceID")
    login_role = api_data.get("LoginRole")

    if not resource_id or not login_role:
        raise ValueError("Login failed")

    # Role mapping update
    if login_role.lower() in ["receptionist", "reception"]:
        login_role = "guard"

    user = find_user_by_email_and_resource_id(db, data.email, resource_id)
    # print(user)

    if not user:
        raise ValueError("Login failed")

    token = create_access_token(user_id=resource_id, role=user.role)

    return LoginResponse(
        access_token=token,
        user=UserOut(
            id=resource_id,
            name=user.name,
            role=user.role
        ),
    )
