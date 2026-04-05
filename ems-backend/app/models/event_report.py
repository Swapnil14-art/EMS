from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class EventReport(Base):
    __tablename__ = "event_reports"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"), unique=True, nullable=False)
    submitted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    submitted_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    event_summary = Column(Text, nullable=False)
    actual_budget = Column(Numeric(10, 2), nullable=False)
    participant_count = Column(Integer, nullable=False)
    outcomes = Column(Text, nullable=False)
    issues = Column(Text, nullable=True)
    feedback = Column(Text, nullable=True)
    attendance_doc_path = Column(Text, nullable=True)
    generated_report_path = Column(Text, nullable=True)

    event = relationship("Event", back_populates="report")
    submitter = relationship("User")
