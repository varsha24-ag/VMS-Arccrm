from sqlalchemy import Column, DateTime, Integer, String, func, text

from app.core.db import Base


class Visitor(Base):
    __tablename__ = "visitors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    id_number = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    company = Column(String, nullable=True)
    visitor_type = Column(String, nullable=True)
    status = Column(String, nullable=False, server_default=text("'pending'"))
    approval_token = Column(String, nullable=True, unique=True, index=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejected_at = Column(DateTime(timezone=True), nullable=True)
    photo_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
