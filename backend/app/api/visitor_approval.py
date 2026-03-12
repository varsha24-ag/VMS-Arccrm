from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.visit import Visit
from app.models.visitor import Visitor
from app.services.notification_service import send_reception_notification
from app.core.config import settings

router = APIRouter(tags=["visits-public"])


@router.get("/visits/{visit_id}/approve", response_class=HTMLResponse)
def approve_visit(
    visit_id: int,
    token: str,
    db: Session = Depends(get_db),
):
    visit = db.query(Visit).filter(Visit.id == visit_id, Visit.approval_token == token).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Invalid or expired approval link.")

    visit.status = "approved"
    visit.approved_at = datetime.utcnow()
    db.commit()

    visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
    if visitor:
        visitor.status = "approved"
        db.commit()
        if settings.RECEPTION_EMAIL:
            send_reception_notification(settings.RECEPTION_EMAIL, visitor.name, "approved")

    return HTMLResponse("<h2>Visitor approved successfully.</h2>")


@router.get("/visits/{visit_id}/reject", response_class=HTMLResponse)
def reject_visit(
    visit_id: int,
    token: str,
    db: Session = Depends(get_db),
):
    visit = db.query(Visit).filter(Visit.id == visit_id, Visit.approval_token == token).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Invalid or expired approval link.")

    visit.status = "rejected"
    visit.rejected_at = datetime.utcnow()
    db.commit()

    visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
    if visitor:
        visitor.status = "rejected"
        db.commit()
        if settings.RECEPTION_EMAIL:
            send_reception_notification(settings.RECEPTION_EMAIL, visitor.name, "rejected")

    return HTMLResponse("<h2>Visitor rejected.</h2>")
