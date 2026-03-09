from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.auth import LoginRequest, LoginResponse
from app.services.auth_service import login_employee

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        return login_employee(db, payload)
    except ValueError as exc:
        message = str(exc)
        if message == "User not found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message) from exc
        if message == "Invalid credentials":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=message) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Login failed") from exc
