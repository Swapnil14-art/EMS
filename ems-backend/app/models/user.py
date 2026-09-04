from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=True)
    is_first_login = Column(Boolean, nullable=False, default=True)
    name = Column(String(150), nullable=True)
    role = Column(String(50), nullable=False, default="student", index=True)  # super_admin|director|associate_dean|club_coordinator|student|additional
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True)
    year_of_study = Column(String(10), nullable=True)
    branch = Column(String(100), nullable=True)
    course = Column(String(100), nullable=True)
    sap_id = Column(String(50), nullable=True, unique=True)
    phone_number = Column(String(20), nullable=True)
    club_coordinator_request = Column(Boolean, nullable=False, default=False)
    # Dynamic permission list for 'additional' role users (JSON array of permission codes)
    extra_permissions = Column(JSON, nullable=True, default=list)
    # Optional registration audience for Additional-role coordinators: student|Faculty
    coordinator_type = Column(String(20), nullable=True)

    status = Column(String(20), nullable=False, default="active")  # active|inactive
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    last_login_at = Column(TIMESTAMP(timezone=True), nullable=True)

    # Relationships
    department = relationship("Department", back_populates="users")
    club = relationship("Club", foreign_keys=[club_id])



class PreApprovedUser(Base):
    __tablename__ = "pre_approved_users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    role = Column(String(50), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    consumed = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    creator = relationship("User", foreign_keys=[created_by])


class PendingSignup(Base):
    """A temporary credential issued before a student account is activated."""
    __tablename__ = "pending_signups"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    sent_count = Column(Integer, nullable=False, default=1)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=False)
    last_sent_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
