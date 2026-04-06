from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from typing import List
from datetime import datetime, timezone

import logging

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.event import Event
from app.models.event_registration import EventRegistration
from app.models.system_config import SystemSettings
from app.services.email_service import notify_registration_confirmation

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/{event_id}/register")
async def register_for_event(
    event_id: int,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    """Register the current student for an event."""
    # ── System control: block registration if disabled ──
    config_result = await db.execute(select(SystemSettings).limit(1))
    config = config_result.scalar_one_or_none()
    if config and config.disable_student_registration:
        logger.warning(f"Registration blocked for {current_user.email} (Event {event_id}) because disable_student_registration is ENABLED.")
        raise HTTPException(
            status_code=403,
            detail="Event registration is currently disabled",
        )

    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Status check
    if event.status not in ["approved", "ongoing"]:
        raise HTTPException(
            status_code=400,
            detail="Registration is only open for approved or ongoing events",
        )

    # Registration deadline check
    now = datetime.now(timezone.utc)
    if event.registration_deadline and now > event.registration_deadline:
        raise HTTPException(status_code=400, detail="Registration deadline has passed")

    # Audience check — case-insensitive, match both dept code and name
    ta = (event.target_audience or "").strip().lower()
    sd = (event.school_department or "").strip().lower()
    if ta not in ("college_wide", "college", "all", ""):
        dept_code = current_user.department.code.strip().lower() if current_user.department and current_user.department.code else ""
        dept_name = current_user.department.name.strip().lower() if current_user.department and current_user.department.name else ""
        match = False
        if dept_code and (dept_code in ta or dept_code in sd):
            match = True
        if dept_name and (dept_name in ta or dept_name in sd):
            match = True
        if not match:
            raise HTTPException(
                status_code=403,
                detail="This event is not open to your department",
            )

    # Create registration (DB UNIQUE constraint handles duplicates)
    registration = EventRegistration(
        event_id=event_id,
        student_id=current_user.id,
        status="registered",
    )
    db.add(registration)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="You are already registered for this event")

    # Send confirmation email
    send_registration_email = False
    if send_registration_email:
        notify_registration_confirmation(event, current_user)

    return {"message": "Successfully registered for the event", "event_id": event_id}


@router.delete("/{event_id}/cancel")
async def cancel_registration(
    event_id: int,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    """Cancel the current student's registration."""
    result = await db.execute(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.student_id == current_user.id,
            EventRegistration.status == "registered",
        )
    )
    reg = result.scalar_one_or_none()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    reg.status = "cancelled"
    await db.commit()
    return {"message": "Registration cancelled"}


@router.get("/{event_id}/list")
async def list_registrations(
    event_id: int,
    current_user: User = Depends(require_roles(
        "club_coordinator", "associate_dean", "director", "super_admin"
    )),
    db: AsyncSession = Depends(get_db),
):
    """List all registered students for an event (staff only)."""
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    result = await db.execute(
        select(User, EventRegistration)
        .join(EventRegistration, EventRegistration.student_id == User.id)
        .where(
            EventRegistration.event_id == event_id,
            EventRegistration.status == "registered",
        )
        .order_by(User.name)
    )
    rows = result.all()
    return [
        {
            "registration_id": reg.id,
            "student_id": user.id,
            "name": user.name,
            "email": user.email,
            "year_of_study": user.year_of_study,
            "registered_at": reg.registered_at,
        }
        for user, reg in rows
    ]


@router.get("/my")
async def my_registrations(
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    """Return all events the current student is registered for."""
    result = await db.execute(
        select(Event, EventRegistration)
        .join(EventRegistration, EventRegistration.event_id == Event.id)
        .where(
            EventRegistration.student_id == current_user.id,
            EventRegistration.status == "registered",
        )
        .order_by(Event.start_datetime.desc())
    )
    rows = result.all()
    return [
        {
            "id": event.id,
            "registration_id": reg.id,
            "event_id": event.id,
            "title": event.title,
            "event_type": event.event_type,
            "start_datetime": event.start_datetime,
            "end_datetime": event.end_datetime,
            "status": event.status,
            "poster_path": event.poster_path,
            "venue_id": event.venue_id,
            "venue_custom": event.venue_custom,
            "club_id": event.club_id,
            "school_department": event.school_department,
            "registered_at": reg.registered_at,
        }
        for event, reg in rows
    ]


@router.post("/{event_id}/send-update")
async def send_bulk_update(
    event_id: int,
    subject: str = Query(...),
    message: str = Query(...),
    current_user: User = Depends(require_roles(
        "club_coordinator", "super_admin", "associate_dean", "director"
    )),
    db: AsyncSession = Depends(get_db),
):
    """Send a bulk email update to all registered students."""
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    result = await db.execute(
        select(User)
        .join(EventRegistration, EventRegistration.student_id == User.id)
        .where(
            EventRegistration.event_id == event_id,
            EventRegistration.status == "registered",
        )
    )
    students = result.scalars().all()
    if not students:
        return {"message": "No registered students to notify"}

    from app.tasks.email_tasks import send_bulk_email
    emails = [s.email for s in students]
    body_html = f"<h2>{subject}</h2><p>{message}</p><p><i>Regarding: {event.title}</i></p>"
    send_bulk_email.delay(emails, subject, body_html, event_id, "manual_update")

    return {"message": f"Update email queued for {len(emails)} students"}
