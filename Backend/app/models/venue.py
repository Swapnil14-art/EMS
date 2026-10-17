from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Venue(Base):
    __tablename__ = "venues"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    location = Column(String(255), nullable=True)
    max_capacity = Column(Integer, nullable=False, default=1)  # max simultaneous events
    aliases = Column(Text, nullable=True)                      # comma-separated for fuzzy match
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)  # NULL = shared
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Tree layout
    parent_id = Column(Integer, ForeignKey("venues.id"), nullable=True)

    department = relationship("Department", back_populates="venues")
    parent = relationship("Venue", remote_side=[id], back_populates="children")
    children = relationship("Venue", back_populates="parent")
