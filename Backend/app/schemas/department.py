from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DepartmentCreate(BaseModel):
    name: str
    code: str


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None


class DepartmentOut(BaseModel):
    id: int
    name: str
    code: str
    created_at: datetime

    class Config:
        from_attributes = True
