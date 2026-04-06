import os
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse

from app.dependencies import get_current_user, get_optional_user
from typing import Optional
from app.models.user import User
from app.utils.permissions import can_view_internal_docs
from app.config import settings

router = APIRouter()


@router.get("/files/{file_path:path}")
async def serve_file(
    file_path: str,
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Serve uploaded files with role-based access control.
    Prevents directory traversal attacks.
    """
    # Security: prevent path traversal
    if ".." in file_path or file_path.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid file path")

    full_path = os.path.join(settings.STORAGE_ROOT, file_path)
    full_path = os.path.realpath(full_path)
    storage_root_real = os.path.realpath(settings.STORAGE_ROOT)

    # Ensure file is within storage root
    if not full_path.startswith(storage_root_real):
        raise HTTPException(status_code=403, detail="Access denied")

    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found")

    # Role-based access
    path_lower = file_path.lower()

    # Internal docs and other_docs — staff only
    if "/documents/" in path_lower or "/other_docs/" in path_lower:
        if not current_user or not can_view_internal_docs(current_user):
            raise HTTPException(status_code=403, detail="Access denied")

    # Report docs — staff only
    if "/report/" in path_lower and path_lower.endswith(".docx"):
        if not current_user or not can_view_internal_docs(current_user):
            raise HTTPException(status_code=403, detail="Access denied")

    return FileResponse(full_path)
