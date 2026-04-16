from datetime import datetime, timedelta, timezone
from typing import Annotated
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import get_db
from app.core.security import require_roles
from app.models.employee import Employee
from app.models.visit import Visit
from app.models.visitor import Visitor
from app.schemas.admin_dashboard import AdminDashboardSummary, AdminRecentVisitItem

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard/summary", response_model=AdminDashboardSummary)
def get_admin_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(require_roles("admin"))] = None,
):
    tz = ZoneInfo(settings.BUSINESS_TIMEZONE)
    now_local = datetime.now(tz)
    start_local = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
    end_local = start_local + timedelta(days=1)

    start_utc = start_local.astimezone(timezone.utc)
    end_utc = end_local.astimezone(timezone.utc)

    visitors_today = (
        db.query(Visit)
        .filter(Visit.checkin_time.isnot(None))
        .filter(Visit.checkin_time >= start_utc, Visit.checkin_time < end_utc)
        .count()
    )
    checked_in_visitors = db.query(Visit).filter(Visit.status == "checked_in").count()
    checked_out_visitors = (
        db.query(Visit)
        .filter(Visit.checkout_time.isnot(None))
        .filter(Visit.checkout_time >= start_utc, Visit.checkout_time < end_utc)
        .count()
    )
    pending_approvals = db.query(Visit).filter(Visit.status == "pending").count()

    recent_rows = (
        db.query(Visit, Visitor, Employee)
        .join(Visitor, Visitor.id == Visit.visitor_id)
        .outerjoin(Employee, Employee.id == Visit.host_employee_id)
        .order_by(Visit.id.desc())
        .limit(5)
        .all()
    )
    recent_visits = [
        AdminRecentVisitItem(
            visit_id=visit.id,
            visitor_name=visitor.name,
            photo_url=visitor.photo_url,
            host_name=host.name if host else None,
            purpose=visit.purpose,
            checkin_time=visit.checkin_time,
            checkout_time=visit.checkout_time,
            status=visit.status,
        )
        for visit, visitor, host in recent_rows
    ]

    return AdminDashboardSummary(
        visitors_today=visitors_today,
        checked_in_visitors=checked_in_visitors,
        checked_out_visitors=checked_out_visitors,
        pending_approvals=pending_approvals,
        recent_visits=recent_visits,
    )


@router.post("/promote/{employee_id}")
def promote_to_admin(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(require_roles("admin"))] = None,
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp.role = "admin"
    db.commit()
    return {"status": "success", "message": f"{emp.name} is now an admin"}
