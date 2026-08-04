from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from jose import JWTError

from app.database import get_db
from app.auth.jwt_handler import decode_access_token
from app.models.user import User
from app.models.system_config import SystemSettings

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validates Bearer JWT and returns the current User object."""
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("user_id")
    result = await db.execute(
        select(User)
        .options(selectinload(User.department))
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user or user.status == "inactive":
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return user


bearer_scheme_optional = HTTPBearer(auto_error=False)

async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme_optional),
    db: AsyncSession = Depends(get_db),
):
    if not credentials:
        payload = {}
    else:
        try:
            payload = decode_access_token(credentials.credentials)
        except JWTError:
            payload = {}

    user_id = payload.get("user_id") if payload else None

    # Lazy-load system config only when needed (anonymous or invalid user)
    async def _check_force_login():
        config_result = await db.execute(select(SystemSettings).limit(1))
        config = config_result.scalar_one_or_none()
        if config and config.force_login:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="System administrator has enforced global login. Please log in.",
            )

    if not user_id:
        await _check_force_login()
        return None

    result = await db.execute(
        select(User)
        .options(selectinload(User.department))
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user or user.status == "inactive":
        await _check_force_login()
        return None
    return user


def require_roles(*roles: str):
    """
    Role guard factory.
    Usage: Depends(require_roles("super_admin", "director"))
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_first_login or not current_user.name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must change your password and complete your profile before accessing this resource."
            )
            
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {list(roles)}",
            )
        return current_user

    return role_checker


def require_permission(perm: str):
    """
    Permission guard for 'additional' role users.
    Also allows super_admin and any fixed role that is explicitly listed via require_roles.
    Usage: Depends(require_permission("view_reports"))
    """
    from app.utils.additional_perms import has_perm

    async def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_first_login or not current_user.name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Complete your profile before accessing this resource.",
            )
        if not has_perm(current_user, perm):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing permission: {perm}",
            )
        return current_user

    return checker

