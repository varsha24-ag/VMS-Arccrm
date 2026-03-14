from sqlalchemy import Column, DateTime, Integer, String, func, text

from app.core.db import Base


class IdCard(Base):
    __tablename__ = "id_cards"

    id = Column(Integer, primary_key=True, index=True)
    id_number = Column(String, nullable=False, unique=True, index=True)
    status = Column(String, nullable=False, server_default=text("'available'"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
