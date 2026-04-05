from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class VenueCreate(BaseModel):
    name: str
    location: Optional[str] = None
    max_capacity: int = 1
    aliases: Optional[str] = None
    department_id: Optional[int] = None


class VenueUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    max_capacity: Optional[int] = None
    aliases: Optional[str] = None
    department_id: Optional[int] = None
    is_active: Optional[bool] = None


class VenueOut(BaseModel):
    id: int
    name: str
    location: Optional[str]
    max_capacity: int
    aliases: Optional[str]
    department_id: Optional[int]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
