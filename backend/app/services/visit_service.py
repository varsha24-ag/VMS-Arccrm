from datetime import datetime, timezone
from typing import List
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.access_pass import VisitorAccessPass
from app.models.employee import Employee
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


def create_visitor(db: Session, payload: VisitorCreate) -> VisitorOut:
    visitor = Visitor(
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        company=payload.company,
        visitor_type=payload.visitor_type,
        status="pending",
        approval_token=uuid4().hex,
        photo_url=payload.photo_url,
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

    if payload.host_employee:
        host = db.query(Employee).filter(Employee.id == payload.host_employee).first()
        if host and host.email:
            try:
                send_host_notification(
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
            except Exception:
                pass
        else:
            # Host email missing or host not found; skip notification.
            pass

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
        visitor.id_number = payload.id_number

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
