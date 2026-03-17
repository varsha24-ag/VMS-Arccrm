from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class VisitStatusOut(BaseModel):
    visit_id: int
    visitor_id: int
    visitor_name: str
    host_name: Optional[str] = None
    status: str
    created_at: datetime
