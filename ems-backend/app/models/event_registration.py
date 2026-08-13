from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class EventRegistration(Base):
    __tablename__ = "event_registrations"
    __table_args__ = (
        UniqueConstraint("event_id", "student_id", name="uq_event_student"),
        UniqueConstraint("event_id", "visitor_email", name="uq_event_visitor_email"),
    )

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for visitor registrations
    participation_type = Column(String(20), nullable=False, default="in_campus")  # in_campus|visitor
    status = Column(String(20), nullable=False, default="registered")  # registered|cancelled
    registered_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Visitor-specific fields (populated only when participation_type == "visitor")
    visitor_name = Column(String(255), nullable=True)
    visitor_email = Column(String(255), nullable=True)
    visitor_phone = Column(String(30), nullable=True)
    visitor_qualification = Column(String(255), nullable=True)
    visitor_school_college = Column(String(255), nullable=True)

    event = relationship("Event", back_populates="registrations")
    student = relationship("User")
