from datetime import datetime, timezone
from typing import List, Optional
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.access_pass import VisitorAccessPass
from app.models.employee import Employee
from app.models.id_card import IdCard
from app.models.visit import Visit
from app.models.visitor import Visitor
from app.schemas.visit import (
    AccessPassCreate,
    AccessPassOut,
    QRCheckin,
    VisitCheckin,
    VisitCheckout,
    VisitHistoryItem,
    VisitOut,
    VisitorCreate,
    VisitorOut,
)
from app.services.notification_service import send_host_notification


def _normalize_photo_url(photo_url: Optional[str]) -> Optional[str]:
    if not photo_url:
        return None
    if photo_url.startswith("/uploads/"):
        return photo_url
    if photo_url.startswith("http://") or photo_url.startswith("https://"):
        try:
            parsed = urlparse(photo_url)
            if parsed.path.startswith("/uploads/"):
                return parsed.path
        except Exception:
            return photo_url
    return photo_url


def create_visitor(db: Session, payload: VisitorCreate) -> VisitorOut:
    visitor = Visitor(
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        company=payload.company,
        visitor_type=payload.visitor_type,
        status="pending",
        approval_token=uuid4().hex,
        photo_url=_normalize_photo_url(payload.photo_url),
    )
    db.add(visitor)
    db.commit()
    db.refresh(visitor)

    visit = Visit(
        visitor_id=visitor.id,
        host_employee_id=payload.host_employee,
        purpose=payload.purpose,
        status="pending",
        approval_token=uuid4().hex,
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)

    email_sent = None
    email_error = None
    if payload.host_employee:
        host = db.query(Employee).filter(Employee.id == payload.host_employee).first()
        if host and host.email:
            sent = send_host_notification(
                host.email,
                host.name,
                visitor.name,
                payload.purpose,
                payload.phone,
                payload.company,
                visitor.photo_url,
                visit.approval_token,
                visit.id,
            )
            email_sent = sent
            if not sent:
                email_error = "Email send failed. Please resend."
        else:
            # Host email missing or host not found; skip notification.
            email_sent = None

    return VisitorOut(
        id=visitor.id,
        visit_id=visit.id,
        name=visitor.name,
        id_number=visitor.id_number,
        phone=visitor.phone,
        email=visitor.email,
        company=visitor.company,
        visitor_type=visitor.visitor_type,
        photo_url=visitor.photo_url,
        created_at=visitor.created_at,
        status=visitor.status,
        email_sent=email_sent,
        email_error=email_error,
    )


def resend_host_notification(db: Session, visit_id: int) -> bool:
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")

    visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
    if not visitor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visitor not found")

    if not visit.host_employee_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Host employee not set")

    host = db.query(Employee).filter(Employee.id == visit.host_employee_id).first()
    if not host or not host.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Host email missing")

    sent = send_host_notification(
        host.email,
        host.name,
        visitor.name,
        visit.purpose,
        visitor.phone,
        visitor.company,
        visitor.photo_url,
        visit.approval_token,
        visit.id,
    )
    if not sent:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Email send failed")
    return True


def checkin_visit(db: Session, payload: VisitCheckin) -> VisitOut:
    visitor = db.query(Visitor).filter(Visitor.id == payload.visitor_id).first()
    if not visitor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visitor not found")

    existing_visit = (
        db.query(Visit)
        .filter(Visit.visitor_id == payload.visitor_id)
        .order_by(desc(Visit.id))
        .first()
    )

    if existing_visit and existing_visit.status in {"pending", "approved", "rejected"}:
        if existing_visit.status == "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Visitor pending approval")
        if existing_visit.status == "rejected":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Visitor request rejected")
        if existing_visit.status == "approved" and not (payload.id_number or visitor.id_number):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID card number required")

    if payload.id_number:
        assign_id_card(db, visitor, payload.id_number)

    if payload.host_employee_id:
        host = db.query(Employee).filter(Employee.id == payload.host_employee_id).first()
        if not host:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Host employee not found")

    if existing_visit and existing_visit.status == "approved":
        existing_visit.checkin_time = datetime.now(timezone.utc)
        existing_visit.status = "checked_in"
        existing_visit.policy_accepted = bool(payload.policy_accepted)
        existing_visit.qr_code = payload.qr_code
        db.commit()
        db.refresh(existing_visit)
        visit = existing_visit
    else:
        visit = Visit(
            visitor_id=payload.visitor_id,
            host_employee_id=payload.host_employee_id,
            purpose=payload.purpose,
            checkin_time=datetime.now(timezone.utc),
            status="checked_in",
            policy_accepted=bool(payload.policy_accepted),
            qr_code=payload.qr_code,
        )
        db.add(visit)
        db.commit()
        db.refresh(visit)

    return VisitOut(
        id=visit.id,
        visitor_id=visit.visitor_id,
        host_employee_id=visit.host_employee_id,
        purpose=visit.purpose,
        checkin_time=visit.checkin_time,
        checkout_time=visit.checkout_time,
        status=visit.status,
        policy_accepted=visit.policy_accepted,
        qr_code=visit.qr_code,
    )


def checkout_visit(db: Session, payload: VisitCheckout) -> VisitOut:
    visit = None
    if payload.visit_id:
        visit = db.query(Visit).filter(Visit.id == payload.visit_id).first()
    elif payload.visitor_id:
        visit = (
            db.query(Visit)
            .filter(Visit.visitor_id == payload.visitor_id)
            .order_by(desc(Visit.checkin_time))
            .first()
        )

    if not visit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")

    visit.checkout_time = datetime.now(timezone.utc)
    visit.status = "checked_out"

    visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
    if visitor and visitor.id_number:
        card = db.query(IdCard).filter(IdCard.id_number == visitor.id_number).first()
        if card:
            card.status = "available"
        visitor.id_number = None
    db.commit()
    db.refresh(visit)

    return VisitOut(
        id=visit.id,
        visitor_id=visit.visitor_id,
        host_employee_id=visit.host_employee_id,
        purpose=visit.purpose,
        checkin_time=visit.checkin_time,
        checkout_time=visit.checkout_time,
        status=visit.status,
        policy_accepted=visit.policy_accepted,
        qr_code=visit.qr_code,
    )


def get_visit_history(db: Session) -> List[VisitHistoryItem]:
    visits = (
        db.query(Visit, Visitor)
        .join(Visitor, Visitor.id == Visit.visitor_id)
        .order_by(desc(Visit.checkin_time))
        .all()
    )

    history: List[VisitHistoryItem] = []
    for visit, visitor in visits:
        history.append(
            VisitHistoryItem(
                visit_id=visit.id,
                visitor_id=visitor.id,
                visitor_name=visitor.name,
                id_number=visitor.id_number,
                visitor_phone=visitor.phone,
                visitor_email=visitor.email,
                company=visitor.company,
                photo_url=visitor.photo_url,
                host_employee_id=visit.host_employee_id,
                purpose=visit.purpose,
                checkin_time=visit.checkin_time,
                checkout_time=visit.checkout_time,
                status=visit.status,
                qr_code=visit.qr_code,
            )
        )

    return history


def assign_id_card(db: Session, visitor: Visitor, id_number: str) -> None:
    clean_number = id_number.strip()
    if not clean_number:
        return

    existing_card = db.query(IdCard).filter(IdCard.id_number == clean_number).first()
    if existing_card and existing_card.status == "in_use" and visitor.id_number != clean_number:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID card already in use")

    if visitor.id_number and visitor.id_number != clean_number:
        previous_card = db.query(IdCard).filter(IdCard.id_number == visitor.id_number).first()
        if previous_card:
            previous_card.status = "available"

    if not existing_card:
        existing_card = IdCard(id_number=clean_number, status="in_use")
        db.add(existing_card)
    else:
        existing_card.status = "in_use"

    visitor.id_number = clean_number


def create_access_pass(db: Session, payload: AccessPassCreate) -> AccessPassOut:
    visitor = Visitor(
        name=payload.visitor_name,
        phone=payload.phone,
        email=payload.email,
        company=payload.company,
        visitor_type="recurring",
    )
    db.add(visitor)
    db.commit()
    db.refresh(visitor)

    qr_code = f"PASS-{uuid4().hex}"
    access_pass = VisitorAccessPass(
        visitor_id=visitor.id,
        host_employee_id=payload.host_employee_id,
        valid_from=payload.valid_from,
        valid_to=payload.valid_to,
        max_visits=payload.max_visits,
        remaining_visits=payload.max_visits,
        qr_code=qr_code,
    )
    db.add(access_pass)
    db.commit()
    db.refresh(access_pass)

    return AccessPassOut(
        id=access_pass.id,
        visitor_id=access_pass.visitor_id,
        host_employee_id=access_pass.host_employee_id,
        valid_from=access_pass.valid_from,
        valid_to=access_pass.valid_to,
        max_visits=access_pass.max_visits,
        remaining_visits=access_pass.remaining_visits,
        qr_code=access_pass.qr_code,
    )


def qr_checkin(db: Session, payload: QRCheckin) -> VisitOut:
    access_pass = (
        db.query(VisitorAccessPass)
        .filter(VisitorAccessPass.qr_code == payload.qr_code)
        .first()
    )
    if not access_pass:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access pass not found")

    now = datetime.now(timezone.utc)
    if access_pass.valid_from > now or access_pass.valid_to < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Access pass expired")

    if access_pass.remaining_visits <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Visit limit exceeded")

    visit = Visit(
        visitor_id=access_pass.visitor_id,
        host_employee_id=access_pass.host_employee_id,
        purpose="Recurring visitor access",
        checkin_time=now,
        status="checked_in",
        policy_accepted=bool(payload.policy_accepted),
        qr_code=access_pass.qr_code,
    )
    db.add(visit)
    access_pass.remaining_visits -= 1
    db.commit()
    db.refresh(visit)

    return VisitOut(
        id=visit.id,
        visitor_id=visit.visitor_id,
        host_employee_id=visit.host_employee_id,
        purpose=visit.purpose,
        checkin_time=visit.checkin_time,
        checkout_time=visit.checkout_time,
        status=visit.status,
        policy_accepted=visit.policy_accepted,
        qr_code=visit.qr_code,
    )
