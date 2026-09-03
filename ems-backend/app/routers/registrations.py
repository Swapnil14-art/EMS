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
from app.routers.events import is_student_eligible_for_event
from app.schemas.event import VisitorRegistrationCreate

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

    # Registration accepted check
    if not event.registration_accepted or not event.student_registration_enabled:
        raise HTTPException(
            status_code=403,
            detail="Student registration is not accepted for this event",
        )

    # Registration start time & deadline checks
    now = datetime.now(timezone.utc)
    if event.registration_start_datetime:
        reg_start = event.registration_start_datetime if event.registration_start_datetime.tzinfo else event.registration_start_datetime.replace(tzinfo=timezone.utc)
        if now < reg_start:
            formatted_date = reg_start.strftime("%d %b %Y, %I:%M %p")
            raise HTTPException(
                status_code=400,
                detail=f"Registration opens on {formatted_date}",
            )

    if event.registration_deadline:
        reg_deadline = event.registration_deadline if event.registration_deadline.tzinfo else event.registration_deadline.replace(tzinfo=timezone.utc)
        if now > reg_deadline:
            raise HTTPException(status_code=400, detail="Registration deadline has passed")

    # Audience check — check college-wide, school/department, and departments_involved
    if not is_student_eligible_for_event(current_user, event):
        raise HTTPException(
            status_code=403,
            detail="This event is not open to your department",
        )

    # Check for existing registration record (handles re-registration after unregistering)
    existing_result = await db.execute(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.student_id == current_user.id,
        )
    )
    existing_reg = existing_result.scalar_one_or_none()

    if existing_reg:
        if existing_reg.status == "registered":
            raise HTTPException(status_code=409, detail="You are already registered for this event")
        else:
            existing_reg.status = "registered"
            existing_reg.registered_at = now
            await db.commit()
            return {"message": "Successfully registered for the event", "event_id": event_id}

    # Create new registration if none existed
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


@router.post("/{event_id}/register-visitor")
async def register_visitor(
    event_id: int,
    body: VisitorRegistrationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a non-campus visitor for an event. No authentication required."""
    # System control: block registration if disabled
    config_result = await db.execute(select(SystemSettings).limit(1))
    config = config_result.scalar_one_or_none()
    if config and config.disable_student_registration:
        raise HTTPException(
            status_code=403,
            detail="Event registration is currently disabled",
        )

    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Must have outside campus registration enabled
    if not event.registration_accepted or not event.outside_campus_registration:
        raise HTTPException(
            status_code=403,
            detail="This event does not accept outside campus registrations",
        )

    # Must have reached Director-level approval (status approved or ongoing)
    if event.status not in ["approved", "ongoing"]:
        raise HTTPException(
            status_code=400,
            detail="Registration is only open for approved or ongoing events",
        )

    # Registration start time & deadline checks
    now = datetime.now(timezone.utc)
    if event.registration_start_datetime:
        reg_start = event.registration_start_datetime if event.registration_start_datetime.tzinfo else event.registration_start_datetime.replace(tzinfo=timezone.utc)
        if now < reg_start:
            formatted_date = reg_start.strftime("%d %b %Y, %I:%M %p")
            raise HTTPException(
                status_code=400,
                detail=f"Registration opens on {formatted_date}",
            )

    if event.registration_deadline:
        reg_deadline = event.registration_deadline if event.registration_deadline.tzinfo else event.registration_deadline.replace(tzinfo=timezone.utc)
        if now > reg_deadline:
            raise HTTPException(status_code=400, detail="Registration deadline has passed")

    # Check for duplicate visitor email
    existing_result = await db.execute(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.visitor_email == body.email,
            EventRegistration.participation_type == "visitor",
        )
    )
    existing_reg = existing_result.scalar_one_or_none()

    if existing_reg:
        if existing_reg.status == "registered":
            raise HTTPException(
                status_code=409,
                detail="This email is already registered for this event",
            )
        else:
            # Re-register a previously cancelled visitor
            existing_reg.status = "registered"
            existing_reg.registered_at = now
            existing_reg.visitor_name = body.full_name
            existing_reg.visitor_phone = body.phone
            existing_reg.visitor_qualification = body.qualification
            existing_reg.visitor_school_college = body.school_college
            await db.commit()
            return {"message": "Successfully registered for the event", "event_id": event_id}

    registration = EventRegistration(
        event_id=event_id,
        student_id=None,
        participation_type="visitor",
        status="registered",
        visitor_name=body.full_name,
        visitor_email=body.email,
        visitor_phone=body.phone,
        visitor_qualification=body.qualification,
        visitor_school_college=body.school_college,
    )
    db.add(registration)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This email is already registered for this event",
        )

    return {"message": "Successfully registered for the event", "event_id": event_id}
