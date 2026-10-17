from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ApprovalActionRequest(BaseModel):
    action: str  # approved | rejected | suggested_changes
    remarks: Optional[str] = None
    venue_clash_override: bool = False
    venue_clash_override_reason: Optional[str] = None


class ApprovalOut(BaseModel):
    id: int
    event_id: int
    approver_id: int
    role_at_approval: str
    sequence_order: int
    is_parallel: bool
    action: str
    remarks: Optional[str]
    venue_clash_override: bool
    venue_clash_override_reason: Optional[str]
    actioned_at: Optional[datetime]

    class Config:
        from_attributes = True
