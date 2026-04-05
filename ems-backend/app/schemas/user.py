from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class SimpleDepartment(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class SimpleClub(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: str
    department_id: Optional[int] = None
    club_id: Optional[int] = None
    year_of_study: Optional[str] = None


class UserOut(UserBase):
    id: int
    status: str
    branch: Optional[str] = None
    course: Optional[str] = None
    sap_id: Optional[str] = None
    phone_number: Optional[str] = None
    created_at: datetime
    last_login_at: Optional[datetime] = None

    department: Optional[SimpleDepartment] = None
    club: Optional[SimpleClub] = None

    class Config:
        from_attributes = True


class PreApproveRequest(BaseModel):
    email: EmailStr
    role: str
    department_id: Optional[int] = None
    club_id: Optional[int] = None


class BulkDeactivateRequest(BaseModel):
    user_ids: Optional[list[int]] = None
    year_of_study: Optional[str] = None


class BulkActionRequest(BaseModel):
    user_ids: list[int]
    action: str  # "deactivate" | "delete"


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    department_id: Optional[int] = None
    club_id: Optional[int] = None
    year_of_study: Optional[str] = None


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    department_id: Optional[int] = None
    year_of_study: Optional[str] = None
    branch: Optional[str] = None
    course: Optional[str] = None
    sap_id: Optional[str] = None
    phone_number: Optional[str] = None
