from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ReportSubmit(BaseModel):
    event_summary: str
    actual_budget: Decimal
    participant_count: int
    outcomes: str
    issues: Optional[str] = None
    feedback: Optional[str] = None


class ReportOut(BaseModel):
    id: int
    event_id: int
    submitted_by: int
    submitted_at: datetime
    event_summary: str
    actual_budget: Decimal
    participant_count: int
    outcomes: str
    issues: Optional[str]
    feedback: Optional[str]
    attendance_doc_path: Optional[str]
    generated_report_path: Optional[str]

    class Config:
        from_attributes = True
