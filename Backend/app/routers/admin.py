import os
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, get_optional_user, require_roles
from typing import Optional
from app.models.user import User
from app.utils.permissions import can_view_internal_docs
from app.config import settings

router = APIRouter()


@router.get("/users")
async def admin_list_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=1000),
    role: Optional[str] = None,
    status: Optional[str] = None,
    department_id: Optional[int] = None,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only user listing endpoint secured with JWT super_admin role."""
    from app.routers.users import list_users
    res = await list_users(
        page=page,
        size=size,
        role=role,
        status=status,
        department_id=department_id,
        current_user=current_user,
        db=db,
    )
    return res["data"] if isinstance(res, dict) and "data" in res else res


@router.get("/settings")
async def admin_get_settings(
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only system settings endpoint secured with JWT super_admin role."""
    from app.routers.system import get_system_settings
    return await get_system_settings(current_user=current_user, db=db)


@router.get("/email-log")
async def admin_get_email_log(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only notification audit log endpoint secured with JWT super_admin role."""
    from app.routers.notifications import get_email_log
    return await get_email_log(page=page, size=size, current_user=current_user, db=db)



MIME_MAP = {
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc": "application/msword",
    ".pdf": "application/pdf",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls": "application/vnd.ms-excel",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".ppt": "application/vnd.ms-powerpoint",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
}


@router.get("/files/{file_path:path}")
async def serve_file(
    file_path: str,
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Serve uploaded files with role-based access control.
    Prevents directory traversal attacks.
    """
    # Normalize path: remove leading slashes and strip '/uploads/' or 'uploads/' prefix
    # because save_file returns '/uploads/...' but files are stored in STORAGE_ROOT.
    file_path = file_path.lstrip("/")
    if file_path.startswith("uploads/"):
        file_path = file_path[len("uploads/"):]
    # Also handle legacy paths that start with 'storage/' (filesystem paths stored in DB)
    if file_path.startswith("storage/"):
        file_path = file_path[len("storage/"):]

    # Security: prevent path traversal and empty path
    if not file_path or ".." in file_path:
        raise HTTPException(status_code=400, detail="Invalid file path")

    full_path = os.path.join(settings.STORAGE_ROOT, file_path)
    full_path = os.path.realpath(full_path)
    storage_root_real = os.path.realpath(settings.STORAGE_ROOT)

    # Ensure file is within storage root and is not the storage root directory itself
    if not full_path.startswith(storage_root_real) or full_path == storage_root_real:
        raise HTTPException(status_code=403, detail="Access denied")

    if not os.path.exists(full_path) or not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="File not found")

    # Role-based access
    path_lower = file_path.lower()

    # Internal docs and other_docs — staff only (blocked for student role)
    if "/documents/" in path_lower or "/other_docs/" in path_lower:
        if current_user and not can_view_internal_docs(current_user):
            raise HTTPException(status_code=403, detail="Access denied")

    # Report docs — staff only (blocked for student role)
    if ("/report/" in path_lower or "/rnd_report/" in path_lower) and path_lower.endswith(".docx"):
        if current_user and not can_view_internal_docs(current_user):
            raise HTTPException(status_code=403, detail="Access denied")

    filename = os.path.basename(full_path)
    ext = os.path.splitext(full_path)[1].lower()
    media_type = MIME_MAP.get(ext) or "application/octet-stream"

    return FileResponse(
        path=full_path,
        media_type=media_type,
        filename=filename,
    )
