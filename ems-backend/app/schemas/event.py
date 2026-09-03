from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date, time
from decimal import Decimal


class BudgetItem(BaseModel):
    category: str
    amount: Decimal
    description: Optional[str] = None

    class Config:
        from_attributes = True


class EventCreate(BaseModel):
    title: str
    event_type: str
    school_department: str
    event_incharge_name: str
    event_incharge_contact: str
    target_audience: str
    is_club_event: bool = True
    club_id: Optional[int] = None
    is_collaborative: bool = False
    collaborating_club_ids: Optional[List[int]] = None
    is_sponsored: bool = False
    sponsor_name: Optional[str] = None
    objectives: Optional[List[str]] = None
    start_datetime: datetime
    end_datetime: datetime
    registration_start_datetime: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    venue_id: Optional[int] = None
    venue_ids: Optional[List[int]] = None
    venue_custom: Optional[str] = None
    venue_type: Optional[str] = None
    departments_involved: Optional[List[str]] = None
    seating_arrangement: Optional[str] = None
    seating_other_detail: Optional[str] = None
    tables_required: Optional[str] = None
    chairs_required: Optional[str] = None
    podium_setup: bool = False
    podium_details: Optional[str] = None
    decoration: bool = False
    decoration_details: Optional[str] = None
    it_projector: bool = False
    it_audio: bool = False
    it_audio_details: Optional[str] = None
    it_wifi: bool = False
    it_laptop: bool = False
    it_laptop_details: Optional[str] = None
    it_other: Optional[str] = None
    food_items: bool = False
    food_details: Optional[str] = None
    beverage_items: bool = False
    beverage_details: Optional[str] = None
    pax_count: Optional[int] = None
    food_service_time: Optional[str] = None
    transport: bool = False
    transport_details: Optional[str] = None
    security: bool = False
    security_details: Optional[str] = None
    printing: bool = False
    printing_details: Optional[str] = None
    volunteers: bool = False
    volunteers_details: Optional[str] = None
    other_requirements: Optional[str] = None
    budget: Optional[Decimal] = None
    budget_breakdown: Optional[List[BudgetItem]] = None
    comments: Optional[str] = None
    # R&D fields
    is_rnd_event: bool = False
    rnd_activity_theme: Optional[str] = None
    rnd_prescribed_activity: Optional[str] = None
    rnd_semester_quarter: Optional[str] = None
    rnd_tentative_date: Optional[date] = None
    # Outside campus registration
    outside_campus_registration: bool = False
    registration_accepted: bool = False


class EventUpdate(BaseModel):
    title: Optional[str] = None
    event_type: Optional[str] = None
    school_department: Optional[str] = None
    event_incharge_name: Optional[str] = None
    event_incharge_contact: Optional[str] = None
    target_audience: Optional[str] = None
    is_collaborative: Optional[bool] = None
    collaborating_club_ids: Optional[List[int]] = None
    is_sponsored: bool = False
    sponsor_name: Optional[str] = None
    objectives: Optional[List[str]] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    registration_start_datetime: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    venue_id: Optional[int] = None
    venue_ids: Optional[List[int]] = None
    venue_custom: Optional[str] = None
    venue_type: Optional[str] = None
    departments_involved: Optional[List[str]] = None
    seating_arrangement: Optional[str] = None
    seating_other_detail: Optional[str] = None
    tables_required: Optional[str] = None
    chairs_required: Optional[str] = None
    podium_setup: Optional[bool] = None
    podium_details: Optional[str] = None
    decoration: Optional[bool] = None
    decoration_details: Optional[str] = None
    it_projector: Optional[bool] = None
    it_audio: Optional[bool] = None
    it_audio_details: Optional[str] = None
    it_wifi: Optional[bool] = None
    it_laptop: Optional[bool] = None
    it_laptop_details: Optional[str] = None
    it_other: Optional[str] = None
    food_items: Optional[bool] = None
    food_details: Optional[str] = None
    beverage_items: Optional[bool] = None
    beverage_details: Optional[str] = None
    pax_count: Optional[int] = None
    food_service_time: Optional[str] = None
    transport: Optional[bool] = None
    transport_details: Optional[str] = None
    security: Optional[bool] = None
    security_details: Optional[str] = None
    printing: Optional[bool] = None
    printing_details: Optional[str] = None
    volunteers: Optional[bool] = None
    volunteers_details: Optional[str] = None
    other_requirements: Optional[str] = None
    budget: Optional[Decimal] = None
    budget_breakdown: Optional[List[BudgetItem]] = None
    comments: Optional[str] = None
    # R&D fields
    is_rnd_event: Optional[bool] = None
    rnd_activity_theme: Optional[str] = None
    rnd_prescribed_activity: Optional[str] = None
    rnd_semester_quarter: Optional[str] = None
    rnd_tentative_date: Optional[date] = None
    # Outside campus registration
    outside_campus_registration: Optional[bool] = None
    registration_accepted: Optional[bool] = None
    # Post-start editable fields only
    registration_link: Optional[str] = None
    payment_link: Optional[str] = None
    oc_form_link: Optional[str] = None


class EventLinkCreate(BaseModel):
    link_type: str  # registration|payment|oc_form|gallery|other
    url: str
    label: Optional[str] = None


class EventLinkUpdate(BaseModel):
    url: Optional[str] = None
    label: Optional[str] = None


class EventLinkOut(BaseModel):
    id: int
    link_type: str
    url: str
    label: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class EventDocumentOut(BaseModel):
    id: int
    title: str
    file_path: Optional[str]
    url: Optional[str]
    uploaded_at: datetime

    class Config:
        from_attributes = True


class EventOtherDocOut(BaseModel):
    id: int
    title: Optional[str]
    file_path: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class EventCoordinatorOut(BaseModel):
    id: int
    user_id: int
    added_at: datetime

    class Config:
        from_attributes = True


class SponsorOut(BaseModel):
    id: int
    name: str
    logo_path: Optional[str]

    class Config:
        from_attributes = True


class EventOut(BaseModel):
    id: int
    title: str
    event_type: str
    school_department: str
    event_incharge_name: str
    event_incharge_contact: str
    target_audience: str
    is_club_event: bool
    club_id: Optional[int]
    is_collaborative: bool
    is_sponsored: bool
    objectives: Optional[List[str]] = []
    start_datetime: datetime
    end_datetime: datetime
    registration_start_datetime: Optional[datetime]
    registration_deadline: Optional[datetime]
    venue_id: Optional[int]
    venue_ids: Optional[List[int]] = []
    venue_custom: Optional[str]
    venue_type: Optional[str]
    departments_involved: Optional[List[str]] = []
    seating_arrangement: Optional[str]
    budget: Decimal
    budget_breakdown: Optional[List[BudgetItem]] = None
    comments: Optional[str]
    poster_path: Optional[str]
    participant_doc_path: Optional[str]
    status: str
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]
    # R&D fields
    is_rnd_event: bool = False
    rnd_activity_theme: Optional[str] = None
    rnd_prescribed_activity: Optional[str] = None
    rnd_semester_quarter: Optional[str] = None
    rnd_tentative_date: Optional[date] = None
    # Outside campus registration
    outside_campus_registration: bool = False
    registration_accepted: bool = False

    class Config:
        from_attributes = True


class CancelEventRequest(BaseModel):
    reason: str


class AddCoordinatorRequest(BaseModel):
    user_id: int


class VisitorRegistrationCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    qualification: str
    school_college: str


class EventDocumentCreate(BaseModel):
    title: str
    url: Optional[str] = None
