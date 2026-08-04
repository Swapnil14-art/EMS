from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Club(Base):
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    coordinator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    level = Column(String(50), nullable=False, default="department")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    department = relationship("Department", back_populates="clubs")
    coordinator = relationship("User", foreign_keys=[coordinator_id])
    coordinators = relationship("User", foreign_keys="User.club_id", back_populates="club")
