from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import os

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.event import Event
from app.models.event_report import EventReport
from app.schemas.report import ReportSubmit, ReportOut
from app.services.storage_service import save_file
from app.config import settings
from app.utils.additional_perms import has_perm
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class RootReportSubmit(BaseModel):
    event_id: int
    report_type: Optional[str] = "standard"


def _resolve_to_fs(path_or_url: str) -> str:
    """Convert a URL-relative path to a filesystem path."""
    if not path_or_url:
        return path_or_url
    p = path_or_url.lstrip("/")
    if p.startswith("uploads/"):
        p = p[len("uploads/"):]
    if p.startswith("storage/"):
        p = p[len("storage/"):]
    return os.path.join(settings.STORAGE_ROOT, p)

REPORT_WRITE_ROLES = {"club_coordinator"}
REPORT_READ_ROLES  = {"club_coordinator", "super_admin", "associate_dean", "director"}


def _check_report_write(user: User):
    if user.role in REPORT_WRITE_ROLES:
        return
    if user.role == "additional" and has_perm(user, "submit_reports"):
        return
    raise HTTPException(status_code=403, detail="Missing permission: submit_reports")


def _check_report_read(user: User):
    if user.role in REPORT_READ_ROLES:
        return
    if user.role == "additional" and has_perm(user, "view_reports"):
        return
    raise HTTPException(status_code=403, detail="Missing permission: view_reports")


@router.get("/")
async def list_reports_root(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List event reports. Requires staff/coordinator read permission via JWT."""
    _check_report_read(current_user)
    result = await db.execute(select(EventReport).order_by(EventReport.id.desc()))
    return [ReportOut.model_validate(r) for r in result.scalars().all()]


@router.post("/")
async def submit_report_root(
    body: RootReportSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a report via root route. Requires write permission via JWT."""
    _check_report_write(current_user)
    event = await db.get(Event, body.event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != "completed":
        raise HTTPException(status_code=400, detail="Event must be completed to submit a report")
    return {"message": "Report submitted"}



@router.post("/{event_id}/submit", response_model=ReportOut, status_code=201)
async def submit_report(
    event_id: int,
    body: ReportSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a post-event report. Transitions event: completed → archived."""
    _check_report_write(current_user)
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.is_rnd_event:
        raise HTTPException(
            status_code=400,
            detail="This is an R&D event. Please submit the report using the R&D Report section.",
        )

    if event.status not in ("completed", "archived"):
        raise HTTPException(
            status_code=400,
            detail=f"Report can only be submitted for completed or archived events (current: {event.status})",
        )

    # Check photos exist (at least 1)
    photo_dir = os.path.join(settings.STORAGE_ROOT, "events", str(event_id), "report", "photos")
    photos = []
    if os.path.exists(photo_dir):
        photos = [
            f for f in os.listdir(photo_dir)
            if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
        ]
    if not photos:
        raise HTTPException(
            status_code=400,
            detail="At least 1 event photo is required before submitting the report",
        )

    existing = await db.execute(
        select(EventReport).where(EventReport.event_id == event_id)
    )
    existing_report = existing.scalar_one_or_none()

    if existing_report and existing_report.event_summary:
        raise HTTPException(status_code=409, detail="Report already submitted for this event")

    fields = dict(
        submitted_by=current_user.id,
        event_summary=body.event_summary,
        actual_budget=body.actual_budget,
        outcomes=body.outcomes,
        issues=body.issues,
        feedback=body.feedback,
        student_count=body.student_count,
        faculty_count=body.faculty_count,
        external_count=body.external_count,
        program_type=body.program_type,
        mode_of_delivery=body.mode_of_delivery,
        objective=body.objective,
        learning_benefit=body.learning_benefit,
        guest_speakers=[s.model_dump() for s in body.guest_speakers] if body.guest_speakers else None,
        faculty_coordinators=body.faculty_coordinators,
        student_coordinators=body.student_coordinators,
        social_pamphlet=body.social_pamphlet.model_dump() if body.social_pamphlet else None,
        social_video=body.social_video.model_dump() if body.social_video else None,
        speaker_background=body.speaker_background,
        session_report=body.session_report,
        key_outcomes=body.key_outcomes,
        conclusion=body.conclusion,
    )

    if existing_report:
        for k, v in fields.items():
            setattr(existing_report, k, v)
        report = existing_report
    else:
        report = EventReport(event_id=event_id, **fields)
        db.add(report)

    await db.flush()

    from app.services.report_service import generate_event_report
    path = generate_event_report(event, report)
    report.generated_report_path = path

    event.status = "archived"
    await db.commit()
    await db.refresh(report)

    return report


@router.post("/{event_id}/upload-photos")
async def upload_report_photos(
    event_id: int,
    files: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload event photos for the post-event report (4–8 required)."""
    _check_report_write(current_user)
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    uploaded = []
    for file in files:
        path = await save_file(file, event_id, "report/photos", file_type="photo")
        uploaded.append(path)

    return {"message": f"Uploaded {len(uploaded)} photo(s)", "paths": uploaded}


@router.post("/{event_id}/upload-flier")
async def upload_flier(
    event_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload the event flier (1 compulsory)."""
    _check_report_write(current_user)
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    path = await save_file(file, event_id, "report/flier", file_type="photo")

    result = await db.execute(select(EventReport).where(EventReport.event_id == event_id))
    report = result.scalar_one_or_none()
    if report:
        report.flier_path = path
    else:
        report = EventReport(
            event_id=event_id,
            submitted_by=current_user.id,
            event_summary="",
            actual_budget=0,
            outcomes="",
            flier_path=path,
        )
        db.add(report)

    await db.commit()
    return {"message": "Flier uploaded", "path": path}


@router.post("/{event_id}/upload-attendance")
async def upload_attendance(
    event_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload the attendance sheet for an event."""
    _check_report_write(current_user)
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    path = await save_file(file, event_id, "report", file_type="document")

    result = await db.execute(select(EventReport).where(EventReport.event_id == event_id))
    report = result.scalar_one_or_none()
    if report:
        report.attendance_doc_path = path
    else:
        report = EventReport(
            event_id=event_id,
            submitted_by=current_user.id,
            event_summary="",
            actual_budget=0,
            outcomes="",
            attendance_doc_path=path,
        )
        db.add(report)

    await db.commit()
    return {"message": "Attendance document uploaded", "path": path}


@router.get("/{event_id}/generate")
async def download_report(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Download the generated .docx report."""
    _check_report_read(current_user)
    result = await db.execute(select(EventReport).where(EventReport.event_id == event_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="No report found for this event")

    fs_path = _resolve_to_fs(report.generated_report_path) if report.generated_report_path else None
    if not fs_path or not os.path.exists(fs_path):
        event = await db.get(
            Event, event_id,
            options=[
                selectinload(Event.club),
                selectinload(Event.venue),
                selectinload(Event.sponsors),
            ],
        )
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        from app.services.report_service import generate_event_report
        path = generate_event_report(event, report)
        report.generated_report_path = path
        await db.commit()
        fs_path = _resolve_to_fs(path)

    return FileResponse(
        path=fs_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=f"event_{event_id}_report.docx",
    )


@router.get("/{event_id}", response_model=ReportOut)
async def get_report(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_report_read(current_user)
    result = await db.execute(select(EventReport).where(EventReport.event_id == event_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post("/{event_id}/upload-doc")
async def upload_premade_report(
    event_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Alternative: upload a pre-made .docx report directly."""
    _check_report_write(current_user)
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.is_rnd_event:
        raise HTTPException(
            status_code=400,
            detail="This is an R&D event. Please submit the report using the R&D Report section.",
        )

    if event.status not in ("completed", "archived"):
        raise HTTPException(
            status_code=400,
            detail="Event must be in 'completed' or 'archived' status to upload a report",
        )

    path = await save_file(file, event_id, "report", file_type="document")

    result = await db.execute(select(EventReport).where(EventReport.event_id == event_id))
    report = result.scalar_one_or_none()

    if report:
        report.generated_report_path = path
    else:
        report = EventReport(
            event_id=event_id,
            submitted_by=current_user.id,
            event_summary="Pre-made report uploaded",
            actual_budget=0,
            outcomes="See uploaded document",
            generated_report_path=path,
        )
        db.add(report)

    event.status = "archived"
    await db.commit()
    return {"message": "Report document uploaded", "path": path}
