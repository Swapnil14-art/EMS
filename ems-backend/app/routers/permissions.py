"""
Permissions router — manage extra_permissions for 'additional' role users.
Accessible by super_admin (always) or additional users with 'manage_permissions'.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List, Literal, Optional
from pydantic import BaseModel

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.utils.additional_perms import PERMISSION_CATALOG, VALID_PERMISSIONS, can_manage_permissions

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────────

class PermissionSet(BaseModel):
    permissions: List[str]
    # Kept nullable so clearing both checkboxes removes the coordinator audience.
    coordinator_type: Optional[Literal["student", "Faculty"]] = None


class PermissionAction(BaseModel):
    permissions: List[str]


# ── Dependency ────────────────────────────────────────────────────────────────

async def require_perm_manager(current_user: User = Depends(get_current_user)) -> User:
    if not can_manage_permissions(current_user):
        raise HTTPException(status_code=403, detail="Permission denied: need manage_permissions")
    return current_user


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/catalog")
async def get_catalog(current_user: User = Depends(require_perm_manager)):
    """Return the full permission catalog (code -> label)."""
    return {"catalog": PERMISSION_CATALOG}


@router.get("/users")
async def list_additional_users(
    current_user: User = Depends(require_perm_manager),
    db: AsyncSession = Depends(get_db),
):
    """List all users with role='additional', with their current permissions."""
    result = await db.execute(
        select(User)
        .options(joinedload(User.department))
        .where(User.role == "additional")
        .order_by(User.name)
    )
    users = result.unique().scalars().all()
    return {
        "data": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "status": u.status,
                "department": u.department.name if u.department else None,
                "extra_permissions": u.extra_permissions or [],
                "coordinator_type": u.coordinator_type,
            }
            for u in users
        ]
    }


@router.put("/{user_id}")
async def set_permissions(
    user_id: int,
    body: PermissionSet,
    current_user: User = Depends(require_perm_manager),
    db: AsyncSession = Depends(get_db),
):
    """Replace the full permission list for an additional user."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != "additional":
        raise HTTPException(status_code=400, detail="User is not an 'additional' role user")

    invalid = [p for p in body.permissions if p not in VALID_PERMISSIONS]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid permissions: {invalid}")

    # Non-super_admin (manage_permissions users) cannot grant manage_permissions itself
    if current_user.role != "super_admin" and "manage_permissions" in body.permissions:
        raise HTTPException(status_code=403, detail="Only super_admin can grant manage_permissions")

    user.extra_permissions = list(set(body.permissions))
    user.coordinator_type = body.coordinator_type
    await db.commit()
    return {
        "message": "Permissions updated",
        "extra_permissions": user.extra_permissions,
        "coordinator_type": user.coordinator_type,
    }


@router.post("/{user_id}/grant")
async def grant_permissions(
    user_id: int,
    body: PermissionAction,
    current_user: User = Depends(require_perm_manager),
    db: AsyncSession = Depends(get_db),
):
    """Add permissions to an additional user (additive)."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != "additional":
        raise HTTPException(status_code=400, detail="User is not an 'additional' role user")

    invalid = [p for p in body.permissions if p not in VALID_PERMISSIONS]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid permissions: {invalid}")

    if current_user.role != "super_admin" and "manage_permissions" in body.permissions:
        raise HTTPException(status_code=403, detail="Only super_admin can grant manage_permissions")

    current = set(user.extra_permissions or [])
    current.update(body.permissions)
    user.extra_permissions = list(current)
    await db.commit()
    return {"message": "Permissions granted", "extra_permissions": user.extra_permissions}


@router.delete("/{user_id}/revoke")
async def revoke_permissions(
    user_id: int,
    body: PermissionAction,
    current_user: User = Depends(require_perm_manager),
    db: AsyncSession = Depends(get_db),
):
    """Remove specific permissions from an additional user."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != "additional":
        raise HTTPException(status_code=400, detail="User is not an 'additional' role user")

    current = set(user.extra_permissions or [])
    current.difference_update(body.permissions)
    user.extra_permissions = list(current)
    await db.commit()
    return {"message": "Permissions revoked", "extra_permissions": user.extra_permissions}
