from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime


class LegalAcceptanceItem(BaseModel):
    document_type: str = Field(..., description="terms_and_conditions | privacy_policy | cookie_policy | event_submission_terms")
    document_version: str = Field(..., description="e.g. 1.0")
    status: str = Field(default="accepted", description="accepted | acknowledged | withdrawn")


class LegalAcceptanceBatchRequest(BaseModel):
    acceptances: List[LegalAcceptanceItem]


class LegalAcceptanceResponse(BaseModel):
    id: int
    user_id: int
    document_type: str
    document_version: str
    accepted_at: datetime
    status: str

    class Config:
        from_attributes = True


class LegalStatusResponse(BaseModel):
    requires_acceptance: bool
    missing_documents: List[str]
    current_versions: Dict[str, str]
    accepted_versions: Dict[str, Optional[str]]


class LegalVersionsResponse(BaseModel):
    current_versions: Dict[str, str]
    effective_dates: Dict[str, str]
    operator_name: str
    privacy_officer_name: str
    privacy_officer_email: str
    grievance_officer_name: str
    grievance_officer_email: str
    grievance_officer_address: str
