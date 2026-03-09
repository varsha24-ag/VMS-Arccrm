from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.security import get_current_user, require_roles
from app.models.employee import Employee

router = APIRouter(prefix="/visitors", tags=["visitors"])


@router.get("/")
def get_visitors(current_user: Annotated[Employee, Depends(get_current_user)]):
    return {
        "message": "Protected visitors list",
        "requested_by": {
            "id": current_user.id,
            "name": current_user.name,
            "role": current_user.role,
        },
        "visitors": [],
    }


@router.get("/admin-only")
def admin_only_route(current_user: Annotated[Employee, Depends(require_roles("admin"))]):
    return {"message": "Admin access granted", "user": current_user.name}
