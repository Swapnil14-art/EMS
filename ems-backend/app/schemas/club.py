from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ClubCreate(BaseModel):
    name: str
    description: Optional[str] = None
    department_id: int
    coordinator_id: Optional[int] = None
    coordinator_ids: Optional[list[int]] = []


class ClubUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    department_id: Optional[int] = None
    coordinator_id: Optional[int] = None
    coordinator_ids: Optional[list[int]] = None
    is_active: Optional[bool] = None


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
    department_id: int
    coordinator_id: Optional[int]
    coordinators: Optional[list[ClubCoordinatorOut]] = []
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
