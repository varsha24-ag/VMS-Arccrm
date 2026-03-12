from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func

from app.core.db import Base


class VisitorAccessPass(Base):
    __tablename__ = "visitor_access_passes"

    id = Column(Integer, primary_key=True, index=True)
    visitor_id = Column(Integer, ForeignKey("visitors.id"), nullable=False, index=True)
    host_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True, index=True)
    valid_from = Column(DateTime(timezone=True), nullable=False)
    valid_to = Column(DateTime(timezone=True), nullable=False)
    max_visits = Column(Integer, nullable=False)
    remaining_visits = Column(Integer, nullable=False)
    qr_code = Column(String, nullable=False, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
