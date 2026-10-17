from sqlalchemy import Column, Integer, Boolean, TIMESTAMP
from sqlalchemy.sql import func
from app.database import Base

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True)
    disable_student_registration = Column(Boolean, default=False, nullable=False)
    disable_role_signup = Column(Boolean, default=False, nullable=False)
    force_login = Column(Boolean, default=False, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now(), server_default=func.now())
