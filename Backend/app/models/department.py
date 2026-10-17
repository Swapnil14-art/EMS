from sqlalchemy import Column, Integer, String, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    code = Column(String(20), unique=True, nullable=False)  # e.g. CS, IT, AIML
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    users = relationship("User", back_populates="department")
    clubs = relationship("Club", back_populates="department")
    venues = relationship("Venue", back_populates="department")
