from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import validates

from app.core.db import Base


class Visitor(Base):
    __tablename__ = "visitors"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    host_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    status = Column(String, nullable=False, default="checked_in")
    check_in_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    check_out_at = Column(DateTime(timezone=True), nullable=True)

    @validates("phone")
    def validate_phone(self, key, value):
        if value is None:
            return value
        # Strip any non-digit characters
        digits = "".join(filter(str.isdigit, value))
        if len(digits) != 10:
            raise ValueError("Phone number must be exactly 10 digits")
        return digits
