from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from typing import Optional, List

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User, PreApprovedUser
from app.schemas.user import UserOut, PreApproveRequest, BulkDeactivateRequest, UserProfileUpdate, BulkActionRequest, UserAdminUpdate, UserAdminCreate
from app.config import settings
from app.utils.security import get_password_hash
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=dict)
async def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=1000),
    role: Optional[str] = None,
    status: Optional[str] = None,
    department_id: Optional[int] = None,
    year: Optional[str] = None,
    branch: Optional[str] = None,
    course: Optional[str] = None,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    """List all users with optional filters (super_admin only)."""
    query = select(User).options(joinedload(User.department), joinedload(User.club))
    if role:
        query = query.where(User.role == role)
    if status:
        query = query.where(User.status == status)
    if department_id:
        query = query.where(User.department_id == department_id)
    if year and year.lower() != "all":
        query = query.where(User.year_of_study == year)
    if branch and branch.lower() != "all":
        query = query.where(User.branch == branch)
    if course and course.lower() != "all":
        query = query.where(User.course == course)
        
    count_query = select(func.count()).select_from(query.subquery())
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(User.id.desc()).offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    
    # Construct a dict compatible with UserOut model — mode='json' serializes datetimes
    # .unique() is required when using joinedload with async sessions to deduplicate rows
    users_list = [UserOut.model_validate(u).model_dump(mode='json') for u in result.unique().scalars().all()]
    
    logger.info(f"Users API returning {len(users_list)} users out of {total} total matches.")
    
    return {"data": users_list, "total": total}


@router.get("/search", response_model=List[UserOut])
async def search_users(
    email: str = Query(..., min_length=3),
    current_user: User = Depends(require_roles(
        "super_admin", "director", "associate_dean", "club_coordinator"
    )),
    db: AsyncSession = Depends(get_db),
):
    """Search users by email (for adding event coordinators)."""
    result = await db.execute(
        select(User)
        .options(joinedload(User.department), joinedload(User.club))
        .where(User.email.ilike(f"%{email}%"))
        .limit(10)
    )
    return result.unique().scalars().all()


@router.get("/me", response_model=UserOut)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's full profile including department and club names."""
    query = (
        select(User)
        .options(joinedload(User.department), joinedload(User.club))
        .where(User.id == current_user.id)
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/me", response_model=UserOut)
async def update_my_profile(
    body: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile information."""
    query = (
        select(User)
        .options(joinedload(User.department), joinedload(User.club))
        .where(User.id == current_user.id)
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.name is not None:
        user.name = body.name
    if body.department_id is not None:
        user.department_id = body.department_id
    if body.year_of_study is not None:
        user.year_of_study = body.year_of_study
    if body.branch is not None:
        user.branch = body.branch
    if body.course is not None:
        user.course = body.course
    if body.sap_id is not None:
        user.sap_id = body.sap_id
    if body.phone_number is not None:
        user.phone_number = body.phone_number

    # If user provides a name on a blank profile, they completed their profile
    if user.name and user.is_first_login:
        user.is_first_login = False

    await db.commit()
    await db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: int,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/pre-approve", response_model=dict)
async def pre_approve_user(
    body: PreApproveRequest,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Add a user to the pre-approved list so they get the correct role on first SSO login."""
    body.email = body.email.lower()
    
    # Validate email domain
    domain = body.email.split("@")[-1]
    if domain not in settings.allowed_domain_list:
        raise HTTPException(status_code=400, detail=f"Domain '{domain}' not allowed.")

    # Check if already exists
    existing = await db.execute(
        select(PreApprovedUser).where(PreApprovedUser.email == body.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already pre-approved.")

    pre = PreApprovedUser(
        email=body.email,
        role=body.role,
        department_id=body.department_id,
        club_id=body.club_id,
        created_by=current_user.id,
    )
    db.add(pre)
    await db.commit()
    return {"message": "User pre-approved successfully", "email": body.email}


@router.post("/", response_model=UserOut)
async def create_user_direct(
    body: UserAdminCreate,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    body.email = body.email.lower()
    
    # Check if already exists
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="User with this email already exists.")
        
    hashed_password = get_password_hash(body.password)
    
    user = User(
        email=body.email,
        hashed_password=hashed_password,
        name=body.name,
        role=body.role,
        department_id=body.department_id,
        club_id=body.club_id,
        is_first_login=False, # We assume admins setting password sets it for immediate usage
        status="active"
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Needs to be re-fetched with joins if we want full UserOut, but we can just return it 
    # Or fetch it back with joins for the response
    query = (
        select(User)
        .options(joinedload(User.department), joinedload(User.club))
        .where(User.id == user.id)
    )
    result = await db.execute(query)
    fetched_user = result.scalar_one_or_none()
    return fetched_user


@router.patch("/{user_id}", response_model=UserOut)
async def update_user_admin(
    user_id: int,
    body: UserAdminUpdate,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(User)
        .options(joinedload(User.department), joinedload(User.club))
        .where(User.id == user_id)
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.name is not None:
        user.name = body.name
    if body.email is not None:
        user.email = body.email.lower()
    if body.role is not None:
        user.role = body.role
    if body.department_id is not None:
        user.department_id = body.department_id
    if body.club_id is not None:
        user.club_id = body.club_id
    if body.year_of_study is not None:
        user.year_of_study = body.year_of_study
    if body.branch is not None:
        user.branch = body.branch
    if body.course is not None:
        user.course = body.course
    if body.sap_id is not None:
        user.sap_id = body.sap_id
    if body.phone_number is not None:
        user.phone_number = body.phone_number
    if body.status is not None:
        user.status = body.status
    if body.new_password:
        user.hashed_password = get_password_hash(body.new_password)
        # Optional: could force them to change it again, but usually manual resets mean it's set.
        # user.is_first_login = True 

    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/{user_id}/activate")
async def activate_user(
    user_id: int,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "active"
    await db.commit()
    return {"message": f"User {user.email} activated"}


@router.patch("/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user.status = "inactive"
    await db.commit()
    return {"message": f"User {user.email} deactivated"}


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    await db.delete(user)
    await db.commit()
    return {"message": f"User {user.email} deleted"}


@router.post("/bulk-action")
async def bulk_action(
    body: BulkActionRequest,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    if not body.user_ids:
        raise HTTPException(status_code=400, detail="Provide user_ids")

    query = select(User).where(User.id.in_(body.user_ids))
    result = await db.execute(query)
    users = result.scalars().all()
    count = 0
    
    if body.action == "deactivate":
        for u in users:
            if u.id != current_user.id:
                u.status = "inactive"
                count += 1
        await db.commit()
        return {"message": f"Deactivated {count} user(s)"}
    
    elif body.action == "delete":
        for u in users:
            if u.id != current_user.id:
                await db.delete(u)
                count += 1
        await db.commit()
        return {"message": f"Deleted {count} user(s)"}
    
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

