import os
import uuid
import logging
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.config import settings

# Only import oci if needed or check if available
try:
    import oci
except ImportError:
    oci = None

logger = logging.getLogger(__name__)

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

# OCI Client cache
_oci_client = None

def get_oci_client():
    global _oci_client
    if _oci_client is not None:
        return _oci_client
    
    if not oci:
        logger.error("OCI SDK not installed but STORAGE_BACKEND=oci")
        return None
        
    try:
        # Load from default config file (usually ~/.oci/config on the server)
        config = oci.config.from_file(profile_name=settings.OCI_CONFIG_PROFILE)
        _oci_client = oci.object_storage.ObjectStorageClient(config)
        return _oci_client
    except Exception as e:
        logger.error(f"Failed to initialize OCI client: {e}")
        return None

async def save_file(
    file: UploadFile,
    event_id: int,
    category: str,        # poster | documents | report/photos | report | sponsor_logos
    file_type: str = "document",
) -> str:
    """
    Saves uploaded file to structured storage (Local or OCI).
    Returns the URL/Path.
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
    object_name = f"events/{event_id}/{category}/{unique_name}"

    if settings.STORAGE_BACKEND == "oci":
        client = get_oci_client()
        if client:
            try:
                client.put_object(
                    settings.OCI_NAMESPACE,
                    settings.OCI_BUCKET_NAME,
                    object_name,
                    contents
                )
                # Return the OCI path (or a signed URL if needed, but here we assume a public/semi-public bucket)
                return f"/uploads/{object_name}"
            except Exception as e:
                logger.error(f"OCI Upload failed: {e}. Falling back to local.")
    
    # Local fallback
    dir_path = os.path.join(settings.STORAGE_ROOT, "events", str(event_id), category)
    os.makedirs(dir_path, exist_ok=True)
    full_path = os.path.join(dir_path, unique_name)
    
    with open(full_path, "wb") as f:
        f.write(contents)

    return f"/uploads/{object_name}"


def delete_file(relative_path: str):
    """Delete a file from storage."""
    if not relative_path:
        return
        
    if relative_path.startswith("/uploads/"):
        object_name = relative_path[len("/uploads/"):]
    elif relative_path.startswith("uploads/"):
        object_name = relative_path[len("uploads/"):]
    else:
        object_name = relative_path.lstrip("/\\")
        
    if settings.STORAGE_BACKEND == "oci":
        client = get_oci_client()
        if client:
            try:
                client.delete_object(
                    settings.OCI_NAMESPACE,
                    settings.OCI_BUCKET_NAME,
                    object_name
                )
                return
            except Exception as e:
                logger.error(f"OCI Delete failed: {e}")

    # Local fallback/cleanup
    relative_path = os.path.normpath(object_name)
    full_path = os.path.join(settings.STORAGE_ROOT, relative_path)
    if os.path.exists(full_path):
        os.remove(full_path)
