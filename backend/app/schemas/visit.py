from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class VisitorCreate(BaseModel):
    name: str = Field(..., min_length=1)
    phone: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    visitor_type: Optional[str] = None
    host_employee: Optional[int] = Field(default=None, description="Host employee id")
    purpose: Optional[str] = None
    photo_url: Optional[str] = None


class VisitorOut(BaseModel):
    id: int
    visit_id: Optional[int] = None
    name: str
    id_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    visitor_type: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime
    status: Optional[str] = None
    email_sent: Optional[bool] = None
    email_error: Optional[str] = None


class VisitCheckin(BaseModel):
    visitor_id: int
    host_employee_id: Optional[int] = None
    purpose: Optional[str] = None
    policy_accepted: Optional[bool] = False
    qr_code: Optional[str] = None
    id_number: Optional[str] = None


class VisitCheckout(BaseModel):
    visit_id: Optional[int] = None
    visitor_id: Optional[int] = None
    id_number: Optional[str] = None


class VisitOut(BaseModel):
    id: int
    visitor_id: int
    host_employee_id: Optional[int] = None
    purpose: Optional[str] = None
    checkin_time: Optional[datetime] = None
    checkout_time: Optional[datetime] = None
    status: str
    policy_accepted: bool = False
    qr_code: Optional[str] = None


class VisitHistoryItem(BaseModel):
    visit_id: int
    visitor_id: int
    visitor_name: str
    id_number: Optional[str] = None
    visitor_phone: Optional[str] = None
    visitor_email: Optional[str] = None
    company: Optional[str] = None
    photo_url: Optional[str] = None
    host_employee_id: Optional[int] = None
    purpose: Optional[str] = None
    created_at: datetime
    checkin_time: Optional[datetime] = None
    checkout_time: Optional[datetime] = None
    status: str
    qr_code: Optional[str] = None


class AccessPassCreate(BaseModel):
    visitor_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    host_employee_id: Optional[int] = None
    valid_from: datetime
    valid_to: datetime
    max_visits: int = Field(..., ge=1)


class AccessPassOut(BaseModel):
    id: int
    visitor_id: int
    host_employee_id: Optional[int] = None
    valid_from: datetime
    valid_to: datetime
    max_visits: int
    remaining_visits: int
    qr_code: str


class QRCheckin(BaseModel):
    qr_code: str
    policy_accepted: Optional[bool] = False


class PhotoUploadOut(BaseModel):
    photo_url: str


class EmailResendRequest(BaseModel):
    visit_id: int


class EmailResendOut(BaseModel):
    sent: bool
