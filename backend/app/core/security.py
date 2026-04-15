from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional, Union

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import get_db
from app.models.employee import Employee

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


class TokenError(HTTPException):
    def __init__(self, detail: str = "Unauthorized access"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> Employee:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise TokenError("Unauthorized access")

    token = credentials.credentials

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        if not user_id or not role:
            raise TokenError("Unauthorized access")
    except JWTError as exc:
        raise TokenError("Unauthorized access") from exc

    user = db.query(Employee).filter(Employee.resource_id == int(user_id)).first()
    if not user:
        raise TokenError("User not found")

    return user


def get_user_from_token(token: str, db: Session) -> Employee:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        if not user_id or not role:
            raise TokenError("Unauthorized access")
    except JWTError as exc:
        raise TokenError("Unauthorized access") from exc

    user = db.query(Employee).filter(Employee.resource_id == int(user_id)).first()
    if not user:
        raise TokenError("User not found")

    return user


def require_roles(*allowed_roles: str):
    allowed = {r.lower() for r in allowed_roles}

    def role_checker(current_user: Annotated[Employee, Depends(get_current_user)]) -> Employee:
        if current_user.role.lower() not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access")
        return current_user

    return role_checker
