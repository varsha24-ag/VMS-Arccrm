from typing import Annotated, List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_user
from app.models.employee import Employee

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("/hosts")
def list_hosts(
    db: Session = Depends(get_db),
    current_user: Annotated[Employee, Depends(get_current_user)] = None,
) -> List[dict]:
    employees = db.query(Employee).all()
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
