from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

logger = logging.getLogger(__name__)

from app.database import get_db
from app.dependencies import require_roles
from app.models.user import User
from app.models.system_config import SystemSettings
from app.schemas.system_config import SystemSettingsUpdate, SystemSettingsOut

router = APIRouter()


async def get_or_create_settings(db: AsyncSession) -> SystemSettings:
    result = await db.execute(select(SystemSettings).limit(1))
    settings = result.scalar_one_or_none()
    if not settings:
        settings = SystemSettings(
            disable_student_registration=False,
            disable_role_signup=False,
            force_login=False,
        )
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


@router.get("/settings/public")
async def get_public_system_settings(
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint — returns flags needed by the frontend (no auth required)."""
    settings = await get_or_create_settings(db)
    return {
        "disable_student_registration": settings.disable_student_registration,
        "disable_role_signup": settings.disable_role_signup,
        "force_login": settings.force_login,
    }


@router.get("/settings", response_model=SystemSettingsOut)
async def get_system_settings(
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve the global system settings (super_admin only)."""
    return await get_or_create_settings(db)


@router.patch("/settings", response_model=SystemSettingsOut)
async def update_system_settings(
    body: SystemSettingsUpdate,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Update global system settings (super_admin only)."""
    settings = await get_or_create_settings(db)

    logger.info(f"System Settings PATCH request received by {current_user.email}. Payload: {body.model_dump()}")

    if body.disable_student_registration is not None:
        settings.disable_student_registration = body.disable_student_registration
        logger.info(f"[Action] disable_student_registration set to {settings.disable_student_registration}")
    if body.disable_role_signup is not None:
        settings.disable_role_signup = body.disable_role_signup
        logger.info(f"[Action] disable_role_signup set to {settings.disable_role_signup}")
    if body.force_login is not None:
        settings.force_login = body.force_login
        logger.info(f"[Action] force_login set to {settings.force_login}")

    await db.commit()
    await db.refresh(settings)
    logger.info("System Settings updated successfully in database.")
    return settings
