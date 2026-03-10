from pathlib import Path
from typing import Annotated, List
from uuid import uuid4

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_user
from app.models.employee import Employee
from app.schemas.visit import (
    AccessPassCreate,
    AccessPassOut,
    PhotoUploadOut,
    QRCheckin,
    VisitCheckin,
    VisitCheckout,
    VisitHistoryItem,
    VisitOut,
    VisitorCreate,
    VisitorOut,
)
from app.services.visit_service import (
    checkin_visit,
    checkout_visit,
    create_access_pass,
    create_visitor,
    get_visit_history,
    qr_checkin,
)

router = APIRouter(tags=["visits"])
# Keep uploads path aligned with app.mount("/uploads", ...).
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "visitors"


@router.post("/visitor/create", response_model=VisitorOut)
def create_visitor_route(
    payload: VisitorCreate,
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
):
    return create_visitor(db, payload)


@router.post("/visit/checkin", response_model=VisitOut)
def checkin_route(
    payload: VisitCheckin,
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
):
    return checkin_visit(db, payload)


@router.post("/visit/checkout", response_model=VisitOut)
def checkout_route(
    payload: VisitCheckout,
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
):
    return checkout_visit(db, payload)


@router.post("/visitor/photo", response_model=PhotoUploadOut)
def upload_photo(
    file: UploadFile = File(...),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
):
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "").suffix or ".jpg"
    file_name = f"visitor-{uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / file_name
    with file_path.open("wb") as buffer:
        buffer.write(file.file.read())
    return PhotoUploadOut(photo_url=f"/uploads/visitors/{file_name}")


@router.post("/access-pass/create", response_model=AccessPassOut)
def access_pass_route(
    payload: AccessPassCreate,
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
):
    return create_access_pass(db, payload)


@router.post("/visit/qr-checkin", response_model=VisitOut)
def qr_checkin_route(
    payload: QRCheckin,
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
):
    return qr_checkin(db, payload)


@router.get("/visit/history", response_model=List[VisitHistoryItem])
def history_route(
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
):
    return get_visit_history(db)
