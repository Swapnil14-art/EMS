from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Text, Numeric, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class EventReport(Base):
    __tablename__ = "event_reports"

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

    # New: participant breakdown
    student_count = Column(Integer, nullable=False, default=0)
    faculty_count = Column(Integer, nullable=False, default=0)
    external_count = Column(Integer, nullable=False, default=0)

    # Derived total (kept for backward compat)
    @property
    def participant_count(self):
        return (self.student_count or 0) + (self.faculty_count or 0) + (self.external_count or 0)

    # New: program type dropdown
    program_type = Column(String(100), nullable=True)

    # New: objective and learning benefit (character-constrained in schema/UI)
    objective = Column(String(200), nullable=True)       # 100 chars strict (stored generously)
    learning_benefit = Column(String(300), nullable=True)  # 150 chars strict

    # New: guest speakers — list of {name, designation, organization, expertise}
    guest_speakers = Column(JSON, nullable=True)  # [{"name": "", "designation": "", "organization": "", "expertise": ""}]

    # New: faculty and student coordinators — list of names
    faculty_coordinators = Column(JSON, nullable=True)   # ["Name1", "Name2"]
    student_coordinators = Column(JSON, nullable=True)   # ["Name1", "Name2"]

    # New: social media links for e-pamphlet
    social_pamphlet = Column(JSON, nullable=True)  # {"facebook": "", "instagram": "", "x": "", "linkedin": ""}

    # New: social media links for video
    social_video = Column(JSON, nullable=True)     # {"facebook": "", "instagram": "", "x": "", "linkedin": ""}

    # New: speaker background and session report (long text)
    speaker_background = Column(Text, nullable=True)
    session_report = Column(Text, nullable=True)

    # New: key outcomes as bullet list
    key_outcomes = Column(JSON, nullable=True)  # ["outcome1", "outcome2", ...]

    # New: conclusion
    conclusion = Column(Text, nullable=True)

    # New: mode of delivery
    mode_of_delivery = Column(String(20), nullable=True)  # "offline" or "online"

    # File paths
    attendance_doc_path = Column(Text, nullable=True)
    flier_path = Column(Text, nullable=True)          # 1 compulsory flier
    generated_report_path = Column(Text, nullable=True)

    event = relationship("Event", back_populates="report")
    submitter = relationship("User")
