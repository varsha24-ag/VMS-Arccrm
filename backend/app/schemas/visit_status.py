from pydantic import BaseModel


class VisitStatusOut(BaseModel):
    visit_id: int
    visitor_id: int
    visitor_name: str
    host_name: str | None = None
    status: str
