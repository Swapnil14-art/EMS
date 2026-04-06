"""
Handles all file storage operations.
File structure: /storage/events/{event_id}/{category}/filename
"""
import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.config import settings

ALLOWED_TYPES = {
    "poster": {"image/jpeg", "image/png", "image/webp"},
    "document": {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
    },
    "photo": {"image/jpeg", "image/png", "image/webp"},
    "sponsor_logo": {"image/jpeg", "image/png", "image/webp"},
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


async def save_file(
    file: UploadFile,
    event_id: int,
    category: str,        # poster | documents | report/photos | report | sponsor_logos
    file_type: str = "document",
) -> str:
    """
    Saves uploaded file to structured storage.
    Returns the relative path (from storage root).
    """
    allowed = ALLOWED_TYPES.get(file_type, ALLOWED_TYPES["document"])
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: {allowed}",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")

    ext = Path(file.filename).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dir_path = os.path.join(settings.STORAGE_ROOT, "events", str(event_id), category)
    os.makedirs(dir_path, exist_ok=True)

    full_path = os.path.join(dir_path, unique_name)
    with open(full_path, "wb") as f:
        f.write(contents)

    return f"/uploads/events/{event_id}/{category}/{unique_name}"


def delete_file(relative_path: str):
    """Delete a file from storage."""
    if not relative_path:
        return
        
    if relative_path.startswith("/uploads/"):
        relative_path = relative_path[len("/uploads/"):]
    elif relative_path.startswith("uploads/"):
        relative_path = relative_path[len("uploads/"):]
        
    relative_path = os.path.normpath(relative_path.lstrip("/\\"))
    full_path = os.path.join(settings.STORAGE_ROOT, relative_path)
    if os.path.exists(full_path):
        os.remove(full_path)
