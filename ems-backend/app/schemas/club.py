from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class ClubCreate(BaseModel):
    name: str
    description: Optional[str] = None
    department_id: Optional[int] = None
    coordinator_id: Optional[int] = None
    coordinator_ids: Optional[list[int]] = []
    level: Optional[str] = "department"

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Club name cannot be empty")
        return v.strip()


class ClubUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    department_id: Optional[int] = None
    coordinator_id: Optional[int] = None
    coordinator_ids: Optional[list[int]] = None
    is_active: Optional[bool] = None
    level: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v or not v.strip()):
            raise ValueError("Club name cannot be empty")
        return v.strip() if v is not None else None


class ClubCoordinatorOut(BaseModel):
    id: int
    name: Optional[str]
    email: str

    class Config:
        from_attributes = True

class ClubOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    department_id: Optional[int] = None
    coordinator_id: Optional[int]
    coordinators: Optional[list[ClubCoordinatorOut]] = []
    level: str = "department"
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
