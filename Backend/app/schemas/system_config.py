from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SystemSettingsUpdate(BaseModel):
    disable_student_registration: Optional[bool] = None
    disable_role_signup: Optional[bool] = None
    force_login: Optional[bool] = None

class SystemSettingsOut(BaseModel):
    disable_student_registration: bool
    disable_role_signup: bool
    force_login: bool
    updated_at: datetime

    class Config:
        from_attributes = True
