from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class AdminRecentVisitItem(BaseModel):
    visit_id: int
    visitor_name: str
    photo_url: Optional[str] = None
    host_name: Optional[str] = None
    purpose: Optional[str] = None
    checkin_time: Optional[datetime] = None
    checkout_time: Optional[datetime] = None
    status: str


class AdminDashboardSummary(BaseModel):
    visitors_today: int
    checked_in_visitors: int
    checked_out_visitors: int
    pending_approvals: int
    recent_visits: List[AdminRecentVisitItem]
