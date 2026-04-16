from pathlib import Path
from typing import Annotated, List, Optional
from urllib.parse import parse_qs, urlparse
from uuid import uuid4

from fastapi import status
from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile, HTTPException
from fastapi.responses import RedirectResponse, StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_user, get_user_from_token
from app.core.realtime import event_stream
from app.models.employee import Employee
from app.models.visitor import Visitor
from app.models.id_card import IdCard
from app.models.visit import Visit
from app.schemas.visit import (
    AccessPassCreate,
    AccessPassOut,
    EmailResendOut,
    EmailResendRequest,
    PhotoUploadOut,
    QRInviteCreate,
    QRInviteOut,
    QRCheckin,
    VisitDetailOut,
    VisitCheckin,
    VisitCheckout,
    VisitHistoryItem,
    VisitOut,
    VisitorCreate,
    VisitorOut,
)
from app.schemas.id_card import IdCardOut
from app.schemas.visit_status import VisitStatusOut
from app.services.notification_service import build_qr_png, get_frontend_qr_checkin_url
from app.services.visit_service import (
    checkin_visit,
    checkout_visit,
    create_access_pass,
    create_qr_invite,
    create_visitor,
    get_qr_visitor_detail,
    get_visit_detail,
    get_visit_history,
    qr_checkin,
    resend_host_notification,
)
from app.services.notification_service import send_visitor_access_pass

router = APIRouter(tags=["visits"])
# Keep uploads path aligned with app.mount("/uploads", ...).
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "visitors"
event_bearer_scheme = HTTPBearer(auto_error=False)


def normalize_scanned_code(raw_code: str) -> str:
    code = raw_code.strip()
    if not code:
        return code
    if "?code=" in code:
        parsed = urlparse(code)
        query_code = parse_qs(parsed.query).get("code", [None])[0]
        if query_code:
            return query_code
    return code


@router.post("/visitor/create", response_model=VisitorOut)
def create_visitor_route(
    payload: VisitorCreate,
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
):
    return create_visitor(db, payload)


@router.post("/visit/invite", response_model=QRInviteOut)
def create_qr_invite_route(
    payload: QRInviteCreate,
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
):
    return create_qr_invite(db, payload)


@router.get("/qr-checkin")
def qr_checkin_redirect(code: str):
    return RedirectResponse(url=get_frontend_qr_checkin_url(code), status_code=307)


@router.get("/qr-image")
def qr_image(code: str):
    qr_png, qr_mime = build_qr_png(get_frontend_qr_checkin_url(code))
    if not qr_png or not qr_mime:
        raise HTTPException(status_code=500, detail="Unable to generate QR image")
    return StreamingResponse(iter([qr_png]), media_type=qr_mime)


@router.get("/visitor/{visitor_id}", response_model=VisitorOut)
def get_visitor_route(
    visitor_id: int,
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
):
    visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    return VisitorOut(
        id=visitor.id,
        name=visitor.name,
        id_number=visitor.id_number,
        phone=visitor.phone,
        email=visitor.email,
        company=visitor.company,
        visitor_type=visitor.visitor_type,
        photo_url=visitor.photo_url,
        created_at=visitor.created_at,
        status=visitor.status,
    )


@router.get("/visits/status", response_model=VisitStatusOut)
def get_visit_status_by_code(
    code: str,
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
):
    code = normalize_scanned_code(code)
    visit = None
    if code.isdigit():
        visit = (
            db.query(Visit)
            .filter(Visit.visitor_id == int(code))
            .order_by(Visit.id.desc())
            .first()
        )
        if not visit:
            visit = db.query(Visit).filter(Visit.id == int(code)).first()
    if not visit:
        visit = db.query(Visit).filter(Visit.qr_code == code).first()
    if not visit and not code.isdigit():
        visitor = None
        if "@" in code:
            visitor = (
                db.query(Visitor)
                .filter(Visitor.email.ilike(code))
                .order_by(Visitor.id.desc())
                .first()
            )
        if not visitor:
            visitor = (
                db.query(Visitor)
                .filter(Visitor.phone == code)
                .order_by(Visitor.id.desc())
                .first()
            )
        if not visitor:
            visitor = (
                db.query(Visitor)
                .filter(Visitor.name.ilike(code))
                .order_by(Visitor.id.desc())
                .first()
            )
        if visitor:
            visit = (
                db.query(Visit)
                .filter(Visit.visitor_id == visitor.id)
                .order_by(Visit.id.desc())
                .first()
            )
    if not visit:
        # Check by assigned ID card number
        visitor = db.query(Visitor).filter(Visitor.id_number == code).order_by(Visitor.id.desc()).first()
        if visitor:
            visit = db.query(Visit).filter(Visit.visitor_id == visitor.id).order_by(Visit.id.desc()).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    host_name = None
    if visit.host_employee_id:
        host = db.query(Employee).filter(Employee.id == visit.host_employee_id).first()
        host_name = host.name if host else None

    visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
    visitor_name = visitor.name if visitor else "Unknown"

    return VisitStatusOut(
        visit_id=visit.id,
        visitor_id=visit.visitor_id,
        visitor_name=visitor_name,
        host_name=host_name,
        status=visit.status,
        created_at=visit.created_at,
    )


@router.get("/visits/list", response_model=List[VisitStatusOut])
def list_visit_status(
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
):
    visits = db.query(Visit).order_by(Visit.id.desc()).all()
    results: List[VisitStatusOut] = []
    for visit in visits:
        host_name = None
        if visit.host_employee_id:
            host = db.query(Employee).filter(Employee.id == visit.host_employee_id).first()
            host_name = host.name if host else None
        visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
        visitor_name = visitor.name if visitor else "Unknown"
        results.append(
            VisitStatusOut(
                visit_id=visit.id,
                visitor_id=visit.visitor_id,
                visitor_name=visitor_name,
                host_name=host_name,
                status=visit.status,
                created_at=visit.created_at,
            )
        )
    return results


@router.get("/visits/{visitor_id}", response_model=VisitStatusOut)
def get_visit_status(
    visitor_id: int,
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
):
    visit = (
        db.query(Visit)
        .filter(Visit.visitor_id == visitor_id)
        .order_by(Visit.id.desc())
        .first()
    )
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    host_name = None
    if visit.host_employee_id:
        host = db.query(Employee).filter(Employee.id == visit.host_employee_id).first()
        host_name = host.name if host else None

    visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
    visitor_name = visitor.name if visitor else "Unknown"

    return VisitStatusOut(
        visit_id=visit.id,
        visitor_id=visitor_id,
        visitor_name=visitor_name,
        host_name=host_name,
        status=visit.status,
        created_at=visit.created_at,
    )


@router.get("/visit/{visit_id}/details", response_model=VisitDetailOut)
def get_visit_detail_route(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
):
    return get_visit_detail(db, visit_id)


@router.get("/qr-visitor/details", response_model=VisitDetailOut)
def get_qr_visitor_detail_route(
    code: str,
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
):
    return get_qr_visitor_detail(db, normalize_scanned_code(code))


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
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
):
    access_pass = create_access_pass(
        db,
        payload,
        default_host_employee_id=current_user.id if current_user else None,
    )
    if payload.email:
        background_tasks.add_task(
            send_visitor_access_pass,
            payload.email,
            payload.visitor_name,
            current_user.name if current_user else "Your host",
            access_pass.qr_code,
            access_pass.valid_to.isoformat(),
            access_pass.max_visits,
        )
    return access_pass


@router.post("/visitor/resend-approval", response_model=EmailResendOut)
def resend_approval_email(
    payload: EmailResendRequest,
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
):
    try:
        sent = resend_host_notification(db, payload.visit_id)
        return EmailResendOut(sent=sent)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to resend approval email")


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


@router.get("/id-cards/available", response_model=List[IdCardOut])
def available_id_cards(
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
):
    cards = (
        db.query(IdCard)
        .filter(IdCard.status == "available")
        .order_by(IdCard.id_number.asc())
        .all()
    )
    return [IdCardOut(id=card.id, id_number=card.id_number, status=card.status) for card in cards]
@router.get("/events/visits")
async def visit_events(
    token: Optional[str] = None,
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(event_bearer_scheme)] = None,
    db: Session = Depends(get_db),
):
    current_user: Employee
    if credentials and credentials.scheme.lower() == "bearer":
        current_user = get_user_from_token(credentials.credentials, db)
    elif token:
        current_user = get_user_from_token(token, db)
    else:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized access")

    if current_user.role.lower() not in {"receptionist", "admin", "employee", "guard"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access")
    return StreamingResponse(
        event_stream(current_user.id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
