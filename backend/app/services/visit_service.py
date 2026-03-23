from datetime import datetime, time, timedelta, timezone
from typing import List, Optional
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session
import anyio

from app.core.realtime import publish_event
from app.models.access_pass import VisitorAccessPass
from app.models.employee import Employee
from app.models.id_card import IdCard
from app.models.visit import Visit
from app.models.visitor import Visitor
from app.schemas.visit import (
    AccessPassCreate,
    AccessPassOut,
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
from app.services.notification_service import send_host_notification
from app.services.notification_service import send_visitor_access_pass

VALIDITY_GRACE_PERIOD = timedelta(minutes=1)


def _emit_host_qr_checkin_event(
    visit: Visit,
    visitor: Visitor | None,
) -> None:
    if not visit.host_employee_id:
        return
    anyio.from_thread.run(
        publish_event,
        {
            "type": "host_qr_checkin",
            "visit_id": visit.id,
            "visitor_id": visit.visitor_id,
            "visitor_name": visitor.name if visitor else "Visitor",
            "host_employee_id": visit.host_employee_id,
            "status": visit.status,
            "target_user_ids": [visit.host_employee_id],
        },
    )


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


def normalize_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        local_tz = datetime.now().astimezone().tzinfo or timezone.utc
        return value.replace(tzinfo=local_tz)
    return value


def evaluate_validity_window(valid_from: datetime | None, valid_to: datetime | None) -> tuple[bool, str | None]:
    start = normalize_datetime(valid_from)
    end = normalize_datetime(valid_to)
    now = datetime.now((start or end or datetime.now().astimezone()).tzinfo or timezone.utc)

    if start and end:
        today = now.date()
        if today < start.date() or today > end.date():
            return False, "QR date is not valid for today"

        window_start = start - VALIDITY_GRACE_PERIOD
        window_end = end + VALIDITY_GRACE_PERIOD
        if now < window_start:
            return False, "QR is not active yet"
        if now > window_end:
            return False, "QR has expired"
        return True, None

    if start and now < (start - VALIDITY_GRACE_PERIOD):
        return False, "QR is not active yet"
    if end and now > (end + VALIDITY_GRACE_PERIOD):
        return False, "QR has expired"
    return True, None


def create_qr_invite(db: Session, payload: QRInviteCreate) -> QRInviteOut:
    host = db.query(Employee).filter(Employee.id == payload.host_employee_id).first()
    if not host:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Host employee not found")
    visitor = Visitor(
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        company=payload.company,
        visitor_type=payload.visitor_type or "invited",
        status="approved",
        photo_url=_normalize_photo_url(payload.photo_url),
    )
    db.add(visitor)
    db.commit()
    db.refresh(visitor)

    visit = Visit(
        visitor_id=visitor.id,
        host_employee_id=payload.host_employee_id,
        purpose=payload.purpose,
        status="approved",
        approved_at=datetime.now(timezone.utc),
        qr_code=f"INVITE-{uuid4().hex}",
        source="qr_invite",
        qr_expiry=datetime.now(timezone.utc) + timedelta(hours=8),
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)

    return QRInviteOut(
        visit_id=visit.id,
        visitor_id=visitor.id,
        qr_code=visit.qr_code or "",
        created_at=visit.created_at,
        qr_checkin_url=f"/qr-checkin?code={visit.qr_code}",
    )


def create_visitor(db: Session, payload: VisitorCreate) -> VisitorOut:
    try:
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
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    db.add(visitor)
    db.commit()
    db.refresh(visitor)

    visit = Visit(
        visitor_id=visitor.id,
        host_employee_id=payload.host_employee,
        purpose=payload.purpose,
        status="pending",
        approval_token=uuid4().hex,
        source="manual",
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

    if payload.photo_url:
        visitor.photo_url = payload.photo_url

    access_pass = None
    if payload.qr_code:
        access_pass = (
            db.query(VisitorAccessPass)
            .filter(VisitorAccessPass.qr_code == payload.qr_code, VisitorAccessPass.visitor_id == payload.visitor_id)
            .first()
        )

    existing_visit = None
    if payload.visit_id is not None:
        existing_visit = db.query(Visit).filter(Visit.id == payload.visit_id).first()
        if not existing_visit:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")
        if existing_visit.visitor_id != payload.visitor_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Visit does not match visitor")
    elif access_pass:
        existing_visit = (
            db.query(Visit)
            .filter(Visit.visitor_id == payload.visitor_id, Visit.qr_code == access_pass.qr_code)
            .order_by(desc(Visit.id))
            .first()
        )
    else:
        existing_visit = (
            db.query(Visit)
            .filter(Visit.visitor_id == payload.visitor_id)
            .order_by(desc(Visit.id))
            .first()
        )
    now = datetime.now(timezone.utc)

    if existing_visit and existing_visit.source == "qr_invite":
        if existing_visit.qr_expiry and now >= existing_visit.qr_expiry:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="QR Expired")
        if existing_visit.status == "checked_in" and existing_visit.checkout_time is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Visitor already checked in")
        if existing_visit.status in {"checked_out", "auto_checked_out"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite already closed")

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
        existing_visit.checkin_time = now
        existing_visit.status = "checked_in"
        existing_visit.policy_accepted = bool(payload.policy_accepted)
        existing_visit.qr_code = payload.qr_code
        db.commit()
        db.refresh(existing_visit)
        visit = existing_visit
    elif access_pass:
        if access_pass.valid_from > now or access_pass.valid_to < now:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Access pass expired")
        if access_pass.remaining_visits <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Visit limit exceeded")
        if existing_visit and existing_visit.status == "checked_in" and existing_visit.checkout_time is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Visitor already checked in")

        visit = Visit(
            visitor_id=payload.visitor_id,
            host_employee_id=access_pass.host_employee_id,
            purpose=access_pass.purpose or "Recurring visitor access",
            checkin_time=now,
            status="checked_in",
            policy_accepted=bool(payload.policy_accepted),
            qr_code=access_pass.qr_code,
            source="access_pass",
        )
        db.add(visit)
        access_pass.remaining_visits -= 1
        db.commit()
        db.refresh(visit)
    else:
        visit = Visit(
            visitor_id=payload.visitor_id,
            host_employee_id=payload.host_employee_id,
            purpose=payload.purpose,
            checkin_time=now,
            status="checked_in",
            policy_accepted=bool(payload.policy_accepted),
            qr_code=payload.qr_code,
            source="manual",
        )
        db.add(visit)
        db.commit()
        db.refresh(visit)

    _emit_host_qr_checkin_event(visit, visitor)

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
        source=visit.source,
        qr_expiry=visit.qr_expiry,
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
    elif payload.id_number:
        visitor = db.query(Visitor).filter(Visitor.id_number == payload.id_number.strip()).first()
        if visitor:
            visit = (
                db.query(Visit)
                .filter(Visit.visitor_id == visitor.id, Visit.status == "checked_in")
                .order_by(desc(Visit.checkin_time))
                .first()
            )

    if not visit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")

    if visit.status == "checked_out":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Visitor is already checked out")

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
        source=visit.source,
        qr_expiry=visit.qr_expiry,
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
                created_at=visit.created_at,
                checkin_time=visit.checkin_time,
                checkout_time=visit.checkout_time,
                status=visit.status,
                qr_code=visit.qr_code,
                source=visit.source,
                qr_expiry=visit.qr_expiry,
            )
        )

    return history


def get_visit_detail(db: Session, visit_id: int) -> VisitDetailOut:
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")

    visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
    if not visitor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visitor not found")

    host_name = None
    if visit.host_employee_id:
        host = db.query(Employee).filter(Employee.id == visit.host_employee_id).first()
        host_name = host.name if host else None

    valid_from = visit.created_at
    valid_to = visit.qr_expiry
    is_currently_valid, validity_error = evaluate_validity_window(valid_from, valid_to)

    return VisitDetailOut(
        visit_id=visit.id,
        visitor_id=visitor.id,
        visitor_name=visitor.name,
        phone=visitor.phone,
        email=visitor.email,
        company=visitor.company,
        purpose=visit.purpose,
        host_name=host_name,
        photo_url=visitor.photo_url,
        status=visit.status,
        created_at=visit.created_at,
        qr_code=visit.qr_code,
        valid_from=valid_from,
        is_currently_valid=is_currently_valid,
        validity_error=validity_error,
        source=visit.source,
        qr_expiry=visit.qr_expiry,
    )


def get_qr_visitor_detail(db: Session, qr_code: str) -> VisitDetailOut:
    visit = db.query(Visit).filter(Visit.qr_code == qr_code).order_by(desc(Visit.id)).first()
    if visit:
        return get_visit_detail(db, visit.id)

    access_pass = db.query(VisitorAccessPass).filter(VisitorAccessPass.qr_code == qr_code).first()
    if not access_pass:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")

    visitor = db.query(Visitor).filter(Visitor.id == access_pass.visitor_id).first()
    if not visitor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visitor not found")

    host_name = None
    if access_pass.host_employee_id:
        host = db.query(Employee).filter(Employee.id == access_pass.host_employee_id).first()
        host_name = host.name if host else None

    is_currently_valid, validity_error = evaluate_validity_window(access_pass.valid_from, access_pass.valid_to)

    return VisitDetailOut(
        visit_id=None,
        visitor_id=visitor.id,
        visitor_name=visitor.name,
        phone=visitor.phone,
        email=visitor.email,
        company=visitor.company,
        purpose=access_pass.purpose or "Recurring visitor access",
        host_name=host_name,
        photo_url=visitor.photo_url,
        status="approved",
        created_at=access_pass.created_at,
        qr_code=access_pass.qr_code,
        valid_from=access_pass.valid_from,
        is_currently_valid=is_currently_valid,
        validity_error=validity_error,
        source="access_pass",
        qr_expiry=access_pass.valid_to,
    )


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


def create_access_pass(
    db: Session,
    payload: AccessPassCreate,
    default_host_employee_id: int | None = None,
) -> AccessPassOut:
    host_employee_id = payload.host_employee_id or default_host_employee_id
    valid_from = payload.valid_from or datetime.now(timezone.utc)
    valid_to = payload.valid_to
    if (
        valid_to.hour == 0
        and valid_to.minute == 0
        and valid_to.second == 0
        and valid_to.microsecond == 0
    ):
        valid_to = datetime.combine(valid_to.date(), time.max, tzinfo=valid_to.tzinfo or timezone.utc)

    try:
        visitor = Visitor(
            name=payload.visitor_name,
            phone=payload.phone,
            email=payload.email,
            company=payload.company,
            visitor_type="recurring",
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    db.add(visitor)
    db.commit()
    db.refresh(visitor)

    qr_code = f"PASS-{uuid4().hex}"
    access_pass = VisitorAccessPass(
        visitor_id=visitor.id,
        host_employee_id=host_employee_id,
        purpose=payload.purpose,
        valid_from=valid_from,
        valid_to=valid_to,
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
        qr_checkin_url=f"/qr-checkin?code={access_pass.qr_code}",
        email_sent=None,
        email_error=None,
    )


def qr_checkin(db: Session, payload: QRCheckin) -> VisitOut:
    invite_visit = (
        db.query(Visit)
        .filter(Visit.qr_code == payload.qr_code, Visit.source == "qr_invite")
        .first()
    )
    if invite_visit:
        now = datetime.now(timezone.utc)
        if invite_visit.qr_expiry and now >= invite_visit.qr_expiry:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="QR Expired")
        if invite_visit.status == "checked_in" and invite_visit.checkout_time is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Visitor already checked in")
        if invite_visit.status in {"checked_out", "auto_checked_out"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite already closed")

        invite_visit.checkin_time = now
        invite_visit.status = "checked_in"
        invite_visit.policy_accepted = bool(payload.policy_accepted)
        db.commit()
        db.refresh(invite_visit)
        visitor = db.query(Visitor).filter(Visitor.id == invite_visit.visitor_id).first()
        _emit_host_qr_checkin_event(invite_visit, visitor)

        return VisitOut(
            id=invite_visit.id,
            visitor_id=invite_visit.visitor_id,
            host_employee_id=invite_visit.host_employee_id,
            purpose=invite_visit.purpose,
            checkin_time=invite_visit.checkin_time,
            checkout_time=invite_visit.checkout_time,
            status=invite_visit.status,
            policy_accepted=invite_visit.policy_accepted,
            qr_code=invite_visit.qr_code,
            source=invite_visit.source,
            qr_expiry=invite_visit.qr_expiry,
        )

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
        source="access_pass",
    )
    db.add(visit)
    access_pass.remaining_visits -= 1
    db.commit()
    db.refresh(visit)
    visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
    _emit_host_qr_checkin_event(visit, visitor)

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
        source=visit.source,
        qr_expiry=visit.qr_expiry,
    )


def auto_checkout_expired_qr_invites(db: Session) -> int:
    now = datetime.now(timezone.utc)
    visits = (
        db.query(Visit)
        .filter(
            Visit.source == "qr_invite",
            Visit.qr_expiry.is_not(None),
            Visit.qr_expiry < now,
            Visit.checkout_time.is_(None),
        )
        .all()
    )

    updated = 0
    for visit in visits:
        visit.checkout_time = visit.qr_expiry
        visit.status = "auto_checked_out"
        updated += 1

    if updated:
        db.commit()

    return updated
