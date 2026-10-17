from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


class SignupRequest(BaseModel):
    email: EmailStr
    terms_accepted: bool
    privacy_acknowledged: bool

    @field_validator("email")
    def validate_nmims_domain(cls, v: str):
        domain = v.split("@")[-1].lower()
        if domain not in ["nmims.in", "nmims.edu"]:
            raise ValueError("Email must contain @nmims.in or @nmims.edu.")
        return v.lower()

    @field_validator("terms_accepted")
    def validate_terms_accepted(cls, v: bool):
        if not v:
            raise ValueError("You must affirmatively agree to the Terms & Conditions before creating an account.")
        return v

    @field_validator("privacy_acknowledged")
    def validate_privacy_acknowledged(cls, v: bool):
        if not v:
            raise ValueError("You must affirmatively acknowledge the Privacy Policy before creating an account.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    def validate_strength(cls, v: str):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v


class ResetPasswordRequest(BaseModel):
    email: EmailStr


class ProfileCompletionRequest(BaseModel):
    name: str
    department_id: Optional[int] = None
    branch: Optional[str] = None
    year_of_study: Optional[str] = None
    course: Optional[str] = None
    sap_id: Optional[str] = None
    phone_number: Optional[str] = None
    
    is_club_coordinator_requested: bool = False
    club_name: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    require_password_change: bool = False
    require_profile_completion: bool = False
    require_legal_acceptance: bool = False


class UserInfo(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    role: str
    department_id: Optional[int] = None
    club_id: Optional[int] = None
    status: str
    is_active: bool = True
    is_first_login: bool
    sap_id: Optional[str] = None
    extra_permissions: Optional[list[str]] = []
    coordinator_type: Optional[str] = None

    class Config:
        from_attributes = True


class RefreshRequest(BaseModel):
    refresh_token: str
