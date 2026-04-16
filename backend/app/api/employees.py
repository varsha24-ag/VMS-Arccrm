from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_user
from app.models.employee import Employee
from app.schemas.visit import AccessPassListItem, VisitHistoryItem
from app.services.visit_service import get_employee_access_passes, get_employee_visit_history

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("/hosts")
def list_hosts(
    db: Session = Depends(get_db),
    exclude_role: Optional[str] = None,
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
) -> List[dict]:
    query = db.query(Employee)
    if exclude_role:
        query = query.filter(Employee.role != exclude_role)
    employees = query.all()
    return [
        {
            "id": emp.id,
            "name": emp.name,
            "department": emp.department or "General",
            "email": emp.email,
            "phone": emp.phone,
            "role": emp.role,
        }
        for emp in employees
    ]


@router.get("/me/visitors", response_model=List[VisitHistoryItem])
def list_my_visitors(
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
) -> List[VisitHistoryItem]:
    return get_employee_visit_history(db, current_user.id)


@router.get("/me/passes", response_model=List[AccessPassListItem])
def list_my_passes(
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
) -> List[AccessPassListItem]:
    return get_employee_access_passes(db, current_user.id)
