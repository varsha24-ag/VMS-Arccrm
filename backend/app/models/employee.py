from sqlalchemy import Boolean, Column, DateTime, Integer, String, func
from sqlalchemy.orm import validates

from app.core.db import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, unique=True, index=True, nullable=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)
    department = Column(String, nullable=True)
    project = Column(String, nullable=True)
    project_lead = Column(String, nullable=True)
    shift = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    @validates("phone")
    def validate_phone(self, key, value):
        if value is None:
            return value
        # Strip any non-digit characters for length check
        digits = "".join(filter(str.isdigit, value))
        if not (10 <= len(digits) <= 15):
            raise ValueError("Phone number must be between 10 and 15 digits")
        # Store the original value (preserving + prefix if present)
        return value
