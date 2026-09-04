from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.models.user import User, PreApprovedUser, PendingSignup
from app.models.system_config import SystemSettings
from app.auth.jwt_handler import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from app.auth.schemas import (
    TokenResponse, UserInfo, RefreshRequest, 
    SignupRequest, LoginRequest, ChangePasswordRequest, 
    ResetPasswordRequest, ProfileCompletionRequest
)
from app.utils.security import verify_password, get_password_hash, generate_temporary_password
from app.services.email_service import notify_temporary_password
from app.dependencies import get_current_user
from app.rate_limit import limiter
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
PENDING_SIGNUP_MAX_SENDS = 4
PENDING_SIGNUP_TTL = timedelta(hours=24)

@router.post("/signup", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/hour")
async def signup(request: Request, body: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Check if user signup is disabled
    config_result = await db.execute(select(SystemSettings).limit(1))
    config = config_result.scalar_one_or_none()
    if config and config.disable_role_signup:
        logger.warning(f"Signup blocked for email {body.email} because disable_role_signup is ENABLED.")
        raise HTTPException(
            status_code=403,
            detail="User registration is currently disabled by administrator",
        )

    email = body.email.lower()
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    now = datetime.now(timezone.utc)
    temp_password = generate_temporary_password()
    hashed_password = get_password_hash(temp_password)
    pending_result = await db.execute(select(PendingSignup).where(PendingSignup.email == email))
    pending = pending_result.scalar_one_or_none()
    if pending and pending.expires_at > now and pending.sent_count >= PENDING_SIGNUP_MAX_SENDS:
        raise HTTPException(status_code=429, detail="Temporary password request limit reached. Please try again after 24 hours.")

    if pending:
        pending.hashed_password = hashed_password
        pending.sent_count = 1 if pending.expires_at <= now else pending.sent_count + 1
        pending.expires_at = now + PENDING_SIGNUP_TTL
        pending.last_sent_at = now
    else:
        pending = PendingSignup(email=email, hashed_password=hashed_password, sent_count=1, expires_at=now + PENDING_SIGNUP_TTL, last_sent_at=now)
        db.add(pending)
    await db.commit()

    notify_temporary_password(email, temp_password, is_reset=False)
    return {"message": "Temporary password sent. Use it to log in and activate your account."}

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()
    if not user:
        pending_result = await db.execute(select(PendingSignup).where(PendingSignup.email == body.email.lower()))
        pending = pending_result.scalar_one_or_none()
        if pending and pending.expires_at <= datetime.now(timezone.utc):
            await db.delete(pending)
            await db.commit()
            pending = None
        if pending and verify_password(body.password, pending.hashed_password):
            user = User(email=pending.email, hashed_password=pending.hashed_password, is_first_login=True, role="student", status="active")
            db.add(user)
            await db.flush()
            await db.delete(pending)

    if not user or not user.hashed_password or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    if user.status == "inactive":
        raise HTTPException(status_code=403, detail="Account is deactivated. Contact Super Admin.")
        
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()
    
    token_data = {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "department_id": user.department_id,
        "club_id": user.club_id,
        "is_first_login": user.is_first_login,
        "is_profile_complete": bool(user.name) if user.role in ["student", "club_coordinator"] else True,
        "extra_permissions": user.extra_permissions or [],
        "coordinator_type": user.coordinator_type,
    }
    
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(user.id),
        require_password_change=user.is_first_login,
        require_profile_completion=not bool(user.name) if user.role in ["student", "club_coordinator"] else False
    )

@router.post("/change-password")
async def change_password(body: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid current password.")
        
    if verify_password(body.new_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="New password must be different from the old password.")
        
    current_user.hashed_password = get_password_hash(body.new_password)
    current_user.is_first_login = False
    await db.commit()
    
    return {"message": "Password changed successfully."}

@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()
    
    if user:
        temp_password = generate_temporary_password()
        user.hashed_password = get_password_hash(temp_password)
        user.is_first_login = True
        await db.commit()
        
        notify_temporary_password(user.email, temp_password, is_reset=True)
        
    return {"message": "If the email is registered, a password reset link has been sent."}

@router.post("/complete-profile")
async def complete_profile(body: ProfileCompletionRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.is_first_login:
        raise HTTPException(status_code=403, detail="Change your temporary password before completing your profile.")
        
    current_user.name = body.name
    current_user.department_id = body.department_id
    current_user.branch = body.branch
    current_user.year_of_study = body.year_of_study
    current_user.course = body.course
    current_user.sap_id = body.sap_id
    current_user.phone_number = body.phone_number
    
    if body.is_club_coordinator_requested:
        # Check if role-based signup is disabled
        config_result = await db.execute(select(SystemSettings).limit(1))
        config = config_result.scalar_one_or_none()
        if config and config.disable_role_signup:
            logger.warning(f"Profile completion role request blocked for {current_user.email} because disable_role_signup is ENABLED.")
            raise HTTPException(
                status_code=403,
                detail="User registration is currently disabled by administrator",
            )

        pre_result = await db.execute(
            select(PreApprovedUser).where(
                PreApprovedUser.email == current_user.email,
                PreApprovedUser.consumed == False
            )
        )
        pre_approved = pre_result.scalar_one_or_none()
        
        if pre_approved:
            current_user.role = pre_approved.role
            if pre_approved.club_id:
                current_user.club_id = pre_approved.club_id
            if pre_approved.department_id:
                current_user.department_id = pre_approved.department_id
            pre_approved.consumed = True
        else:
            current_user.club_coordinator_request = True
            
    await db.commit()
    return {"message": "Profile completed successfully. Please login again to refresh access tokens."}

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_refresh_token(body.refresh_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user_id = payload.get("user_id")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or user.status == "inactive":
        raise HTTPException(status_code=401, detail="User not found or inactive")

    token_data = {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "department_id": user.department_id,
        "club_id": user.club_id,
        "is_first_login": user.is_first_login,
        "is_profile_complete": bool(user.name) if user.role in ["student", "club_coordinator"] else True,
        "extra_permissions": user.extra_permissions or [],
        "coordinator_type": user.coordinator_type,
    }
    
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(user.id),
        require_password_change=user.is_first_login,
        require_profile_completion=not bool(user.name) if user.role in ["student", "club_coordinator"] else False
    )

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserInfo)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
