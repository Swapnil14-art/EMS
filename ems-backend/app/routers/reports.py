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

router = APIRouter()


@router.post("/{event_id}/submit", response_model=ReportOut, status_code=201)
async def submit_report(
    event_id: int,
    body: ReportSubmit,
    current_user: User = Depends(require_roles(
        "club_coordinator", "super_admin"
    )),
    db: AsyncSession = Depends(get_db),
):
    """Submit a post-event report. Transitions event: completed → archived."""
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Report can only be submitted for completed events (current: {event.status})",
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

    # Check existing report
    existing = await db.execute(
        select(EventReport).where(EventReport.event_id == event_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Report already submitted for this event")

    report = EventReport(
        event_id=event_id,
        submitted_by=current_user.id,
        event_summary=body.event_summary,
        actual_budget=body.actual_budget,
        participant_count=body.participant_count,
        outcomes=body.outcomes,
        issues=body.issues,
        feedback=body.feedback,
    )
    db.add(report)
    await db.flush()

    # Transition event to archived
    event.status = "archived"

    await db.commit()
    await db.refresh(report)

    # Trigger async docx generation
    from app.tasks.report_tasks import generate_report_task
    generate_report_task.delay(event_id, report.id)

    return report


@router.post("/{event_id}/upload-photos")
async def upload_report_photos(
    event_id: int,
    files: list[UploadFile] = File(...),
    current_user: User = Depends(require_roles("club_coordinator", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Upload event photos for the post-event report."""
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    uploaded = []
    for file in files:
        path = await save_file(file, event_id, "report/photos", file_type="photo")
        uploaded.append(path)

    return {"message": f"Uploaded {len(uploaded)} photo(s)", "paths": uploaded}


@router.post("/{event_id}/upload-attendance")
async def upload_attendance(
    event_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles("club_coordinator", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Upload the attendance sheet for an event."""
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    path = await save_file(file, event_id, "report", file_type="document")

    # Update report if it exists
    result = await db.execute(
        select(EventReport).where(EventReport.event_id == event_id)
    )
    report = result.scalar_one_or_none()
    if report:
        report.attendance_doc_path = path
        await db.commit()

    return {"message": "Attendance document uploaded", "path": path}


@router.get("/{event_id}/generate")
async def download_report(
    event_id: int,
    current_user: User = Depends(require_roles(
        "club_coordinator", "super_admin", "associate_dean", "director"
    )),
    db: AsyncSession = Depends(get_db),
):
    """Download the generated .docx report."""
    result = await db.execute(
        select(EventReport).where(EventReport.event_id == event_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="No report found for this event")

    if not report.generated_report_path or not os.path.exists(report.generated_report_path):
        # Try to regenerate
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

    return FileResponse(
        path=report.generated_report_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=f"event_{event_id}_report.docx",
    )


@router.get("/{event_id}", response_model=ReportOut)
async def get_report(
    event_id: int,
    current_user: User = Depends(require_roles(
        "club_coordinator", "super_admin", "associate_dean", "director"
    )),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EventReport).where(EventReport.event_id == event_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post("/{event_id}/upload-doc")
async def upload_premade_report(
    event_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles("club_coordinator", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Alternative to structured report: upload a pre-made .docx report directly."""
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.status != "completed":
        raise HTTPException(
            status_code=400,
            detail="Event must be in 'completed' status to upload a report",
        )

    path = await save_file(file, event_id, "report", file_type="document")

    # Check existing report record
    result = await db.execute(
        select(EventReport).where(EventReport.event_id == event_id)
    )
    report = result.scalar_one_or_none()

    if report:
        report.generated_report_path = path
    else:
        # Create minimal report record
        report = EventReport(
            event_id=event_id,
            submitted_by=current_user.id,
            event_summary="Pre-made report uploaded",
            actual_budget=0,
            participant_count=0,
            outcomes="See uploaded document",
            generated_report_path=path,
        )
        db.add(report)
        event.status = "archived"

    await db.commit()
    return {"message": "Report document uploaded", "path": path}
