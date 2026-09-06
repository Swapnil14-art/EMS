from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from datetime import datetime


class VenueCreate(BaseModel):
    name: str
    location: Optional[str] = None
    max_capacity: Optional[int] = Field(None, gt=0)
    capacity: Optional[int] = Field(None, gt=0)
    aliases: Optional[str] = None
    department_id: Optional[int] = None
    parent_id: Optional[int] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Venue name cannot be empty")
        return v.strip()

    @model_validator(mode="after")
    def populate_max_capacity(self):
        if self.max_capacity is None:
            self.max_capacity = self.capacity if self.capacity is not None else 1
        return self


class VenueUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    max_capacity: Optional[int] = Field(None, gt=0)
    capacity: Optional[int] = Field(None, gt=0)
    aliases: Optional[str] = None
    department_id: Optional[int] = None
    parent_id: Optional[int] = None
    is_active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v or not v.strip()):
            raise ValueError("Venue name cannot be empty")
        return v.strip() if v is not None else None

    @model_validator(mode="after")
    def populate_max_capacity(self):
        if self.capacity is not None and self.max_capacity is None:
            self.max_capacity = self.capacity
        return self


class VenueOut(BaseModel):
    id: int
    name: str
    location: Optional[str]
    max_capacity: int
    aliases: Optional[str]
    department_id: Optional[int]
    parent_id: Optional[int]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
