from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.employee import Employee

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("/hosts")
def list_hosts(db: Session = Depends(get_db)) -> List[dict]:
    employees = db.query(Employee).all()
    return [
        {"id": emp.id, "name": emp.name, "department": emp.department or "General", "email": emp.email}
        for emp in employees
    ]
