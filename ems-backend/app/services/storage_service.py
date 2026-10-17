"""
Handles all file storage operations.
Dynamic storage engine supporting local disk with Pillow WebP optimization
and optional S3 / Cloudflare R2 / OCI object storage toggle.

Local storage structure: /storage/events/{event_id}/{category}/{filename}
URL format: /uploads/events/{event_id}/{category}/{filename}
"""
import logging
import os
import shutil
import tempfile
import uuid
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile
from PIL import Image, ImageOps

from app.config import settings

logger = logging.getLogger(__name__)

# Allowed MIME types
IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
}

DOCUMENT_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    *IMAGE_MIME_TYPES,
}

IMAGE_CATEGORIES = {
    "poster",
    "sponsor_logos",
    "report/photos",
    "report/flier",
    "rnd_report/photos",
    "rnd_report/flier",
}


def _is_image_category(category: str, file_type: str, content_type: Optional[str]) -> bool:
    """Determine whether the upload is expected to be processed as an image."""
    if file_type in ("poster", "photo"):
        return True
    if any(img_cat in category.lower() for img_cat in ("poster", "photos", "flier", "sponsor_logos")):
        return True
    if content_type and content_type.lower() in IMAGE_MIME_TYPES:
        return True
    return False


async def _stream_upload_to_temp(file: UploadFile, max_bytes: int) -> str:
    """Stream file in 64KB chunks to a temporary file, verifying size limit without RAM spikes."""
    temp_file = tempfile.NamedTemporaryFile(delete=False)
    temp_path = temp_file.name
    total_bytes = 0
    chunk_size = 65536  # 64 KB

    try:
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > max_bytes:
                temp_file.close()
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                max_mb = max_bytes // (1024 * 1024)
                raise HTTPException(
                    status_code=413,
                    detail=f"File exceeds maximum allowed size of {max_mb} MB.",
                )
            temp_file.write(chunk)
        temp_file.flush()
        temp_file.close()
        return temp_path
    except HTTPException:
        raise
    except Exception as e:
        temp_file.close()
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Failed to process file stream: {str(e)}")


def _optimize_and_save_image(temp_path: str, dir_path: str, unique_id: str) -> str:
    """
    Compress image to display WebP (max 1280px, quality 80) and
    companion thumbnail WebP (max 350px, quality 75).
    """
    with Image.open(temp_path) as img:
        # Auto-rotate based on EXIF metadata (mobile photos)
        img = ImageOps.exif_transpose(img)

        # Handle color mode and transparency
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            img = img.convert("RGBA")
        else:
            img = img.convert("RGB")

        # 1. Primary optimized image (max 1280px)
        primary = img.copy()
        primary.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
        primary_filename = f"{unique_id}.webp"
        primary_full_path = os.path.join(dir_path, primary_filename)
        primary.save(primary_full_path, "WEBP", quality=80, optimize=True)

        # 2. Companion thumbnail (max 350px)
        thumb = img.copy()
        thumb.thumbnail((350, 350), Image.Resampling.LANCZOS)
        thumb_filename = f"{unique_id}_thumb.webp"
        thumb_full_path = os.path.join(dir_path, thumb_filename)
        thumb.save(thumb_full_path, "WEBP", quality=75, optimize=True)

    return primary_filename


def _upload_to_s3(local_path: str, s3_key: str, content_type: str) -> bool:
    """Safely upload a file to S3 compatible object storage if configured."""
    if not (settings.S3_BUCKET_NAME and settings.S3_ACCESS_KEY and settings.S3_SECRET_KEY):
        return False

    try:
        import boto3
        s3_client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION or "auto",
        )
        s3_client.upload_file(
            local_path,
            settings.S3_BUCKET_NAME,
            s3_key,
            ExtraArgs={"ContentType": content_type},
        )
        return True
    except Exception as e:
        logger.warning(f"S3 upload failed for key {s3_key}: {e}. Retaining local copy.")
        return False


async def save_file(
    file: UploadFile,
    event_id: int,
    category: str,
    file_type: str = "document",
) -> str:
    """
    Saves uploaded file to structured storage using 64KB streaming.
    Local mode: auto-converts images to optimized WebP + thumbnail companion.
    S3 mode: mirrors / stores in cloud object storage with local fallback.
    Returns the standard relative URL path: /uploads/events/{event_id}/{category}/{filename}
    """
    raw_content_type = (file.content_type or "").lower()
    is_image = _is_image_category(category, file_type, raw_content_type)

    # 1. Validate MIME Type and determine size limit
    if is_image:
        max_bytes = settings.MAX_IMAGE_UPLOAD_BYTES
        if raw_content_type and raw_content_type not in IMAGE_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image format '{raw_content_type}'. Allowed: JPEG, PNG, WebP.",
            )
    else:
        max_bytes = settings.MAX_DOCUMENT_UPLOAD_BYTES
        if raw_content_type and raw_content_type not in DOCUMENT_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid document format '{raw_content_type}'. Allowed: PDF, Word (DOC/DOCX), Images.",
            )

    # 2. Stream to temporary file in 64KB chunks to avoid RAM spikes
    temp_path = await _stream_upload_to_temp(file, max_bytes)

    try:
        unique_id = uuid.uuid4().hex
        dir_path = os.path.join(settings.STORAGE_ROOT, "events", str(event_id), category)
        os.makedirs(dir_path, exist_ok=True)

        if is_image:
            try:
                final_filename = _optimize_and_save_image(temp_path, dir_path, unique_id)
            except Exception as img_err:
                # If Pillow fails to decode as image, fallback to raw save
                logger.warning(f"Image optimization failed: {img_err}, storing raw file.")
                ext = Path(file.filename or "file").suffix.lower() or ".jpg"
                final_filename = f"{unique_id}{ext}"
                target_full = os.path.join(dir_path, final_filename)
                shutil.move(temp_path, target_full)
                temp_path = None
        else:
            ext = Path(file.filename or "doc").suffix.lower()
            if not ext:
                ext = ".pdf" if "pdf" in raw_content_type else ".docx"
            final_filename = f"{unique_id}{ext}"
            target_full = os.path.join(dir_path, final_filename)
            shutil.move(temp_path, target_full)
            temp_path = None

        # 3. Optional S3 Cloud upload
        if settings.STORAGE_DRIVER == "s3":
            content_type = "image/webp" if final_filename.endswith(".webp") else (raw_content_type or "application/octet-stream")
            local_full_path = os.path.join(dir_path, final_filename)
            s3_key = f"uploads/events/{event_id}/{category}/{final_filename}"
            _upload_to_s3(local_full_path, s3_key, content_type)

            # Also upload companion thumbnail if present
            thumb_filename = f"{unique_id}_thumb.webp"
            thumb_full_path = os.path.join(dir_path, thumb_filename)
            if os.path.exists(thumb_full_path):
                _upload_to_s3(thumb_full_path, f"uploads/events/{event_id}/{category}/{thumb_filename}", "image/webp")

        return f"/uploads/events/{event_id}/{category}/{final_filename}"

    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass


def delete_file(relative_path: str):
    """
    Delete a file and its companion thumbnail from storage.
    Handles local disk and S3 if configured.
    """
    if not relative_path:
        return

    cleaned_path = relative_path
    if cleaned_path.startswith("/uploads/"):
        cleaned_path = cleaned_path[len("/uploads/"):]
    elif cleaned_path.startswith("uploads/"):
        cleaned_path = cleaned_path[len("uploads/"):]

    cleaned_path = os.path.normpath(cleaned_path.lstrip("/\\"))
    full_path = os.path.join(settings.STORAGE_ROOT, cleaned_path)

    # 1. Delete primary file on local disk
    if os.path.exists(full_path):
        try:
            os.remove(full_path)
        except OSError as e:
            logger.error(f"Error deleting file {full_path}: {e}")

    # 2. Check and delete companion thumbnail on local disk
    if full_path.endswith(".webp") and not full_path.endswith("_thumb.webp"):
        thumb_path = f"{full_path[:-5]}_thumb.webp"
        if os.path.exists(thumb_path):
            try:
                os.remove(thumb_path)
            except OSError as e:
                logger.error(f"Error deleting thumbnail {thumb_path}: {e}")

    # 3. If S3 driver is active, delete from S3
    if settings.STORAGE_DRIVER == "s3" and settings.S3_BUCKET_NAME and settings.S3_ACCESS_KEY and settings.S3_SECRET_KEY:
        try:
            import boto3
            s3_client = boto3.client(
                "s3",
                endpoint_url=settings.S3_ENDPOINT_URL,
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
                region_name=settings.S3_REGION or "auto",
            )
            s3_key = f"uploads/{cleaned_path.replace(os.sep, '/')}"
            s3_client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=s3_key)
            if cleaned_path.endswith(".webp") and not cleaned_path.endswith("_thumb.webp"):
                thumb_key = f"uploads/{cleaned_path[:-5]}_thumb.webp".replace(os.sep, "/")
                s3_client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=thumb_key)
        except Exception as e:
            logger.warning(f"Error deleting S3 object for {relative_path}: {e}")
