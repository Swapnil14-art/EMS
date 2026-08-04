from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Text, Numeric, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class EventRndReport(Base):
    __tablename__ = "event_rnd_reports"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"), unique=True, nullable=False)
    submitted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    submitted_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Core report fields
    event_summary = Column(Text, nullable=False)
    actual_budget = Column(Numeric(10, 2), nullable=False)
    outcomes = Column(Text, nullable=False)
    issues = Column(Text, nullable=True)
    feedback = Column(Text, nullable=True)

    # Participant breakdown
    student_count = Column(Integer, nullable=False, default=0)
    faculty_count = Column(Integer, nullable=False, default=0)
    external_count = Column(Integer, nullable=False, default=0)

    # Derived total (kept for backward compat)
    @property
    def participant_count(self):
        return (self.student_count or 0) + (self.faculty_count or 0) + (self.external_count or 0)

    # Program type dropdown
    program_type = Column(String(100), nullable=True)

    # Objective and learning benefit
    objective = Column(String(200), nullable=True)
    learning_benefit = Column(String(300), nullable=True)

    # Guest speakers
    guest_speakers = Column(JSON, nullable=True)

    # Faculty and student coordinators
    faculty_coordinators = Column(JSON, nullable=True)
    student_coordinators = Column(JSON, nullable=True)

    # Social media links for e-pamphlet
    social_pamphlet = Column(JSON, nullable=True)

    # Social media links for video
    social_video = Column(JSON, nullable=True)

    # Speaker background and session report
    speaker_background = Column(Text, nullable=True)
    session_report = Column(Text, nullable=True)

    # Key outcomes as bullet list
    key_outcomes = Column(JSON, nullable=True)

    # Conclusion
    conclusion = Column(Text, nullable=True)

    # Mode of delivery
    mode_of_delivery = Column(String(20), nullable=True)

    # File paths
    attendance_doc_path = Column(Text, nullable=True)
    flier_path = Column(Text, nullable=True)
    generated_report_path = Column(Text, nullable=True)

    event = relationship("Event", back_populates="rnd_report")
    submitter = relationship("User")
