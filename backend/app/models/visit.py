from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func

from app.core.db import Base


class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    visitor_id = Column(Integer, ForeignKey("visitors.id"), nullable=False, index=True)
    host_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True, index=True)
    purpose = Column(String, nullable=True)
    checkin_time = Column(DateTime(timezone=True), nullable=True)
    checkout_time = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, nullable=False, default="checked_in")
    policy_accepted = Column(Boolean, nullable=False, default=False)
    qr_code = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
