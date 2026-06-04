from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


PROGRAM_TYPES = [
    "Level 1-Expert Talk",
    "Level 1-Exposure Visit",
    "Level 1-Mentoring Session",
    "Level 1-Exhibition",
    "Level 2-Conference",
    "Level 2-Exposure Visit",
    "Level 2-Seminar",
    "Level 2-Workshop",
    "Level 2-Competition",
    "Level 3-Bootcamp",
    "Level 3-Competition/Hackathon",
    "Level 3-Demo Day",
    "Level 3-Exhibition",
    "Level 3-Workshop",
    "Level 3-Exposure Visit",
    "Level 4-Challenges",
    "Level 4-Competition/Hackathon",
    "Level 4-Tech Fest",
    "Level 4-Bootcamp",
    "Level 4-Workshop",
    "Level 4-Exhibition/Demo Day",
]


class GuestSpeaker(BaseModel):
    name: str
    designation: Optional[str] = None
    organization: Optional[str] = None
    expertise: Optional[str] = None


class SocialLinks(BaseModel):
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    x: Optional[str] = None
    linkedin: Optional[str] = None


class ReportSubmit(BaseModel):
    # Core
    event_summary: str
    actual_budget: Decimal
    outcomes: str
    issues: Optional[str] = None
    feedback: Optional[str] = None

    # Participant breakdown
    student_count: int = 0
    faculty_count: int = 0
    external_count: int = 0

    # Program info
    program_type: Optional[str] = None
    mode_of_delivery: Optional[str] = None  # "offline" / "online"

    # Character-limited fields
    objective: Optional[str] = None
    learning_benefit: Optional[str] = None

    # Structured fields
    guest_speakers: Optional[List[GuestSpeaker]] = None
    faculty_coordinators: Optional[List[str]] = None
    student_coordinators: Optional[List[str]] = None
    social_pamphlet: Optional[SocialLinks] = None
    social_video: Optional[SocialLinks] = None

    # Long text
    speaker_background: Optional[str] = None
    session_report: Optional[str] = None

    # Key outcomes list
    key_outcomes: Optional[List[str]] = None

    # Conclusion
    conclusion: Optional[str] = None

    @field_validator("objective")
    @classmethod
    def check_objective_length(cls, v):
        if v and len(v) > 100:
            raise ValueError("Objective must be 100 characters or fewer")
        return v

    @field_validator("learning_benefit")
    @classmethod
    def check_learning_benefit_length(cls, v):
        if v and len(v) > 150:
            raise ValueError("Learning benefit must be 150 characters or fewer")
        return v

    @field_validator("program_type")
    @classmethod
    def check_program_type(cls, v):
        if v and v not in PROGRAM_TYPES:
            raise ValueError(f"Invalid program type: {v}")
        return v

    @field_validator("mode_of_delivery")
    @classmethod
    def check_mode(cls, v):
        if v and v.lower() not in ("offline", "online"):
            raise ValueError("mode_of_delivery must be 'offline' or 'online'")
        return v.lower() if v else v


class ReportOut(BaseModel):
    id: int
    event_id: int
    submitted_by: int
    submitted_at: datetime
    event_summary: str
    actual_budget: Decimal
    outcomes: str
    issues: Optional[str]
    feedback: Optional[str]

    student_count: int
    faculty_count: int
    external_count: int

    program_type: Optional[str]
    mode_of_delivery: Optional[str]
    objective: Optional[str]
    learning_benefit: Optional[str]

    guest_speakers: Optional[list]
    faculty_coordinators: Optional[list]
    student_coordinators: Optional[list]
    social_pamphlet: Optional[dict]
    social_video: Optional[dict]

    speaker_background: Optional[str]
    session_report: Optional[str]
    key_outcomes: Optional[list]
    conclusion: Optional[str]

    attendance_doc_path: Optional[str]
    flier_path: Optional[str]
    generated_report_path: Optional[str]

    class Config:
        from_attributes = True
