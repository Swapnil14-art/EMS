from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import logging
import traceback

import io
import openpyxl
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.event_registration import EventRegistration
from app.models.event import (
    Event, EventCollaboratingClub, EventSponsor,
    EventLink, EventDocument, EventOtherDoc,
    EventCoordinator, EventEditHistory, EventVenue,
)
from app.schemas.event import (
    EventCreate, EventUpdate, EventOut,
    EventLinkCreate, EventLinkUpdate, EventLinkOut,
    EventDocumentOut, EventOtherDocOut,
    EventCoordinatorOut, CancelEventRequest,
    AddCoordinatorRequest, EventDocumentCreate,
)
from app.services.storage_service import save_file, delete_file
from app.services.venue_clash_service import check_venue_clash
from app.services.email_service import notify_event_cancelled, notify_event_details_updated
from app.utils.permissions import can_edit_event, can_cancel_event, can_view_internal_docs
from app.utils.diff import take_event_snapshot, compute_diff

router = APIRouter()


# ─── Helpers ────────────────────────────────────────────────────────────────




def _apply_student_filter(query, user: User):
    """Apply student-specific visibility rules."""
    from app.models.event import Event
    visible_statuses = ["approved", "ongoing", "completed", "archived"]
    query = query.where(Event.status.in_(visible_statuses))
    
    dept_code = user.department.code.strip().lower() if user.department and user.department.code else ""
    dept_name = user.department.name.strip().lower() if user.department and user.department.name else ""
    logger.info(f"Student event filter — dept_code='{dept_code}', dept_name='{dept_name}' (User ID: {user.id})")
    
    # Always-visible conditions: college-wide / all / empty target
    conditions = [
        Event.target_audience.ilike("college%"),
        Event.target_audience.ilike("all%"),
        Event.target_audience == "",
        Event.target_audience.is_(None),
        Event.school_department.ilike("college%"),
        Event.school_department.ilike("all%"),
    ]
    
    # Department-specific conditions — check BOTH code and name against BOTH fields
    if dept_code:
        conditions.append(Event.target_audience.ilike(f"%{dept_code}%"))
        conditions.append(Event.school_department.ilike(f"%{dept_code}%"))
    if dept_name:
        conditions.append(Event.target_audience.ilike(f"%{dept_name}%"))
        conditions.append(Event.school_department.ilike(f"%{dept_name}%"))
        
    query = query.where(or_(*conditions))
    return query


# ─── List / Detail ──────────────────────────────────────────────────────────

from app.dependencies import get_current_user, get_optional_user, require_roles

@router.get("/")
async def list_events(
    status: Optional[str] = Query(None),
    club_id: Optional[int] = Query(None),
    department_id: Optional[int] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    search: Optional[str] = Query(None),
    my_events: bool = Query(False),
    manage_only: bool = Query(False),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=2000),
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Event)

    if not current_user:
        # Public users can only see approved events
        query = query.where(Event.status == "approved")
    elif current_user.role == "student":
        # Role-based base filter
        query = _apply_student_filter(query, current_user)
    elif current_user.role == "club_coordinator":
        # Base: events they created, coordinate, or their club is involved in (any status)
        coord_events = select(EventCoordinator.event_id).where(
            EventCoordinator.user_id == current_user.id
        ).scalar_subquery()
        
        # Include events where their club is the primary club or a collaborator
        collab_events = select(EventCollaboratingClub.event_id).where(
            EventCollaboratingClub.club_id == current_user.club_id
        ).scalar_subquery() if current_user.club_id else select(EventCollaboratingClub.event_id).where(False).scalar_subquery()
        
        conditions = [
            Event.created_by == current_user.id,
            Event.id.in_(coord_events)
        ]
        
        if current_user.club_id:
            conditions.append(Event.club_id == current_user.club_id)
            conditions.append(Event.id.in_(collab_events))
            
        if not manage_only:
            conditions.append(Event.status.in_(["approved", "ongoing", "completed", "archived"])) # Browse public
            
        query = query.where(or_(*conditions))

    elif current_user.role == "associate_dean":
        conditions = [
            Event.status.in_(["approved", "ongoing", "completed", "archived"]) # Browse public
        ]
        if current_user.department_id:
            # Also see all events in their department (any status)
            from app.models.club import Club
            dept_clubs = select(Club.id).where(Club.department_id == current_user.department_id)
            dept_code = current_user.department.code.strip().lower() if current_user.department and current_user.department.code else ""
            dept_name = current_user.department.name.strip().lower() if current_user.department and current_user.department.name else ""
            
            # Include events where dept clubs are primary OR collaborating
            collab_match = select(EventCollaboratingClub.event_id).where(
                EventCollaboratingClub.club_id.in_(dept_clubs.scalar_subquery())
            )
            
            dept_matchers = [
                Event.club_id.in_(dept_clubs.scalar_subquery()),
                Event.id.in_(collab_match.scalar_subquery()),
            ]
            if dept_code:
                dept_matchers.append(Event.school_department.ilike(f"%{dept_code}%"))
            if dept_name:
                dept_matchers.append(Event.school_department.ilike(f"%{dept_name}%"))
                
            conditions.append(or_(*dept_matchers))
            
        if manage_only and current_user.department_id:
            # Department strict
            query = query.where(or_(*dept_matchers))
        else:
            query = query.where(or_(*conditions))
    # director / super_admin see all — no additional filter

    # Optional filters
    now = datetime.now(timezone.utc)
    if status:
        # Datetime-based dynamic status classification
        if status == "upcoming":
            query = query.where(
                Event.status.in_(["approved"]),
                Event.start_datetime > now,
            )
        elif status == "ongoing":
            query = query.where(
                Event.status.in_(["approved", "ongoing"]),
                Event.start_datetime <= now,
                Event.end_datetime >= now,
            )
        elif status in ("past", "archived"):
            query = query.where(
                Event.status.in_(["approved", "ongoing", "completed", "archived"]),
                Event.end_datetime < now,
            )
        else:
            if "," in status:
                status_list = [s.strip() for s in status.split(",") if s.strip()]
                query = query.where(Event.status.in_(status_list))
            else:
                # Direct DB status filter for all other statuses (draft, pending_*, etc.)
                query = query.where(Event.status == status)
    if club_id:
        query = query.where(Event.club_id == club_id)
    if department_id:
        from app.models.club import Club
        dept_clubs = select(Club.id).where(Club.department_id == department_id)
        query = query.where(Event.club_id.in_(dept_clubs.scalar_subquery()))
    if from_date:
        query = query.where(Event.start_datetime >= from_date)
    if to_date:
        query = query.where(Event.end_datetime <= to_date)
    if search:
        query = query.where(Event.title.ilike(f"%{search}%"))
    if my_events and current_user:
        if current_user.role == "club_coordinator" and current_user.club_id:
            coord_events = select(EventCoordinator.event_id).where(
                EventCoordinator.user_id == current_user.id
            ).scalar_subquery()
            
            # Collaborative clubs from this user's club
            collab_events = select(EventCollaboratingClub.event_id).where(
                EventCollaboratingClub.club_id == current_user.club_id
            ).scalar_subquery()
            
            query = query.where(or_(
                Event.created_by == current_user.id,
                Event.club_id == current_user.club_id,
                Event.id.in_(coord_events),
                Event.id.in_(collab_events),
            ))
        else:
            query = query.where(Event.created_by == current_user.id)
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Event.created_at.desc()).offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    events = result.scalars().all()
    
    logger.info(f"Events API returned {len(events)} events (total: {total}, User Role: {current_user.role if current_user else 'Public'})")
    return {"data": events, "total": total}


@router.get("/calendar")
async def get_calendar_events(
    start_date: datetime,
    end_date: datetime,
    department: Optional[str] = Query(None),
    club_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Event).options(selectinload(Event.venue))

    # Base date range overlap logic
    query = query.where(
        and_(
            Event.start_datetime < end_date,
            Event.end_datetime > start_date
        )
    )

    # Status filter logic
    allowed_statuses = ["approved", "ongoing", "completed"]
    if current_user and current_user.role != "student":
        # Let staff users see pending/archived if they want, but still exclude draft/rejected/cancelled unless explicitly matched (optional)
        # But instructions say: "Include ONLY: approved, ongoing, completed. EXCLUDE: draft, rejected, cancelled."
        query = query.where(Event.status.in_(allowed_statuses))
    else:
        query = query.where(Event.status.in_(allowed_statuses))
        
    if status and status in allowed_statuses:
        query = query.where(Event.status == status)

    if club_id:
        query = query.where(Event.club_id == club_id)
        
    if department:
        query = query.where(Event.school_department.ilike(f"%{department}%"))

    # Role Visibility
    if current_user:
        if current_user.role == "student":
            query = _apply_student_filter(query, current_user)
        elif current_user.role == "club_coordinator":
            calendar_conditions = [
                Event.created_by == current_user.id,
                Event.id.in_(
                    select(EventCoordinator.event_id).where(
                        EventCoordinator.user_id == current_user.id
                    ).scalar_subquery()
                ),
                Event.status == "approved"
            ]
            if current_user.club_id:
                calendar_conditions.append(Event.club_id == current_user.club_id)
            query = query.where(or_(*calendar_conditions))

    result = await db.execute(query)
    events = result.scalars().all()

    def get_event_color(st: str) -> str:
        if st == 'upcoming' or st == 'approved': return '#10b981'
        if st == 'ongoing': return '#3b82f6'
        if st == 'completed': return '#6b7280'
        return '#3b82f6'

    calendar_data = []
    now = datetime.now(timezone.utc)
    for e in events:
        evt_status = e.status
        if evt_status == 'approved':
            # Dynamic status
            st_dt = e.start_datetime if e.start_datetime.tzinfo else e.start_datetime.replace(tzinfo=timezone.utc)
            en_dt = e.end_datetime if e.end_datetime.tzinfo else e.end_datetime.replace(tzinfo=timezone.utc)
            if now < st_dt: evt_status = 'upcoming'
            elif st_dt <= now <= en_dt: evt_status = 'ongoing'
            elif now > en_dt: evt_status = 'past'
            
        venue_name = e.venue.name if e.venue else (e.venue_custom or "TBA")
            
        calendar_data.append({
            "id": e.id,
            "title": e.title,
            "start": e.start_datetime.isoformat() if e.start_datetime else None,
            "end": e.end_datetime.isoformat() if e.end_datetime else None,
            "allDay": False,
            "status": e.status,
            "department": e.school_department,
            "color": get_event_color(evt_status),
            "venue": venue_name
        })

    return calendar_data


@router.get("/{event_id}")
async def get_event(
    event_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.club import Club
    event = await db.get(
        Event, event_id,
        options=[
            selectinload(Event.club).selectinload(Club.coordinators),
            selectinload(Event.venue),
            selectinload(Event.venues),
            selectinload(Event.links),
            selectinload(Event.sponsors),
            selectinload(Event.collaborating_clubs).selectinload(EventCollaboratingClub.club).selectinload(Club.coordinators),
            selectinload(Event.coordinators),
            selectinload(Event.documents),
            selectinload(Event.other_docs),
            selectinload(Event.report),
        ],
    )
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    visible_statuses = ["approved", "ongoing", "completed", "archived"]

    if not current_user:
        if event.status not in visible_statuses:
            raise HTTPException(status_code=404, detail="Event not found")

    # Student visibility check
    elif current_user.role == "student":
        if event.status not in visible_statuses:
            raise HTTPException(status_code=404, detail="Event not found")
        
        ta = (event.target_audience or "").strip().lower()
        sd = (event.school_department or "").strip().lower()
        
        # Always allow college-wide / all / empty
        if ta not in ("college_wide", "college", "all", ""):
            dept_code = current_user.department.code.strip().lower() if current_user.department and current_user.department.code else ""
            dept_name = current_user.department.name.strip().lower() if current_user.department and current_user.department.name else ""
            
            match = False
            if dept_code and (dept_code in ta or dept_code in sd):
                match = True
            if dept_name and (dept_name in ta or dept_name in sd):
                match = True
            
            if not match:
                raise HTTPException(status_code=403, detail="Access denied")

    # ── Registration info ──
    reg_count_result = await db.execute(
        select(func.count(EventRegistration.id)).where(
            EventRegistration.event_id == event.id,
            EventRegistration.status == "registered",
        )
    )
    registration_count = reg_count_result.scalar() or 0

    is_registered = False
    if current_user and current_user.role == "student":
        reg_check = await db.execute(
            select(EventRegistration.id).where(
                EventRegistration.event_id == event.id,
                EventRegistration.student_id == current_user.id,
                EventRegistration.status == "registered",
            )
        )
        is_registered = reg_check.scalar() is not None

    # Build response dict (strip internal docs for students)
    data = {
        "id": event.id,
        "title": event.title,
        "event_type": event.event_type,
        "school_department": event.school_department,
        "event_incharge_name": event.event_incharge_name,
        "event_incharge_contact": event.event_incharge_contact,
        "target_audience": event.target_audience,
        "is_club_event": event.is_club_event,
        "club_id": event.club_id,
        "club": {
            "id": event.club.id,
            "name": event.club.name,
            "coordinators": [{"id": u.id, "name": u.name, "email": u.email} for u in getattr(event.club, "coordinators", [])]
        } if event.club else None,
        "is_collaborative": event.is_collaborative,
        "is_sponsored": event.is_sponsored,
        "start_datetime": event.start_datetime,
        "end_datetime": event.end_datetime,
        "registration_deadline": event.registration_deadline,
        "venue_id": event.venue_id,
        "venue_ids": [v.id for v in event.venues] if hasattr(event, "venues") else [],
        "venue_custom": event.venue_custom,
        "venue_type": event.venue_type,
        "departments_involved": event.departments_involved or [],
        "seating_arrangement": event.seating_arrangement,
        "budget": event.budget,
        "comments": event.comments,
        "poster_path": event.poster_path,
        "status": event.status,
        "created_by": event.created_by,
        "created_at": event.created_at,
        "updated_at": event.updated_at,
        "registration_count": registration_count,
        "is_registered": is_registered,
        "links": [{"id": l.id, "link_type": l.link_type, "url": l.url, "label": l.label}
                  for l in event.links],
        "sponsors": [{"id": s.id, "name": s.name, "logo_path": s.logo_path}
                     for s in event.sponsors],
        "collaborating_clubs": [{"id": c.id, "club_id": c.club_id, "name": c.club.name if c.club else f"Club {c.club_id}", "coordinators": [{"id": u.id, "email": u.email} for u in getattr(c.club, "coordinators", [])] if c.club else []}
                                 for c in event.collaborating_clubs],
    }

    if event.report:
        data["attendance_doc_path"] = event.report.attendance_doc_path
        data["report_path"] = event.report.generated_report_path

    # participant_doc only after Director approval
    if event.status in ["approved", "ongoing", "completed", "archived"]:
        data["participant_doc_path"] = event.participant_doc_path

    # Internal docs NOT visible to students
    if current_user and can_view_internal_docs(current_user):
        data["documents"] = [
            {"id": d.id, "title": d.title, "file_path": d.file_path, "url": d.url}
            for d in event.documents
        ]
        data["other_docs"] = [
            {"id": d.id, "title": d.title, "file_path": d.file_path}
            for d in event.other_docs
        ]
        data["coordinators"] = [
            {"id": c.id, "user_id": c.user_id}
            for c in event.coordinators
        ]
        # Attach internal setup details for non-students
        internal_fields = [
            "tables_required", "chairs_required", "podium_setup", "podium_details",
            "decoration", "decoration_details", "it_projector", "it_wifi",
            "it_audio", "it_audio_details", "it_laptop", "it_laptop_details",
            "it_other", "pax_count", "food_service_time", "food_items",
            "food_details", "beverage_items", "beverage_details",
            "transport", "transport_details", "security", "security_details",
            "printing", "printing_details", "volunteers", "volunteers_details",
            "other_requirements"
        ]
        for field in internal_fields:
            if hasattr(event, field):
                data[field] = getattr(event, field)

    return data


# ─── Create ─────────────────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def create_event(
    body: EventCreate,
    current_user: User = Depends(require_roles("club_coordinator", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    try:
        start_dt = body.start_datetime
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=timezone.utc)
            
        end_dt = body.end_datetime
        if end_dt.tzinfo is None:
            end_dt = end_dt.replace(tzinfo=timezone.utc)

        if start_dt <= datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="start_datetime must be in the future")
        if end_dt <= start_dt:
            raise HTTPException(status_code=400, detail="End date & time must be after start date & time")

        # Defensive Boolean details handling
        if not body.podium_setup: body.podium_details = None
        if not body.decoration: body.decoration_details = None
        if not body.it_audio: body.it_audio_details = None
        if not body.it_laptop: body.it_laptop_details = None
        if not body.food_items: body.food_details = None
        if not body.beverage_items: body.beverage_details = None
        if not body.transport: body.transport_details = None
        if not body.security: body.security_details = None
        if not body.printing: body.printing_details = None
        if not body.volunteers: body.volunteers_details = None

        # IMMEDIATELY prevent overlap
        clashing = await check_venue_clash(
            db, body.venue_ids, body.venue_custom,
            start_dt, end_dt
        )
        if clashing:
            clash_details = []
            for e in clashing:
                st = e.start_datetime.strftime("%b %d, %I:%M %p")
                en = e.end_datetime.strftime("%I:%M %p")
                v_names = [v.name for v in getattr(e, 'venues', [])] if getattr(e, 'venues', None) else ([e.venue.name] if getattr(e, 'venue', None) else [e.venue_custom or "Venue"])
                clash_details.append(f"'{e.title}' at {', '.join(v_names)} ({st} - {en})")
            
            detail_str = " | ".join(clash_details)
            err_msg = f"Venue clash detected! The venue is already booked for: {detail_str}. Please choose a different venue or time slot."
            raise HTTPException(status_code=409, detail=err_msg)

        # Default registration deadline = start - 1 day
        reg_deadline = body.registration_deadline or (start_dt - timedelta(days=1))
        if reg_deadline.tzinfo is None:
            reg_deadline = reg_deadline.replace(tzinfo=timezone.utc)

        import os
        import random
        random_poster_path = None
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        default_posters_dir = os.path.join(base_dir, "static", "default_posters")
        if os.path.exists(default_posters_dir):
            posters = [f for f in os.listdir(default_posters_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
            if posters:
                chosen = random.choice(posters)
                random_poster_path = f"/api/static/default_posters/{chosen}"

        event = Event(
            title=body.title,
            event_type=body.event_type,
            school_department=body.school_department,
            event_incharge_name=body.event_incharge_name,
            event_incharge_contact=body.event_incharge_contact,
            target_audience=body.target_audience,
            is_club_event=body.is_club_event,
            club_id=body.club_id,
            is_collaborative=body.is_collaborative,
            is_sponsored=body.is_sponsored,
            start_datetime=start_dt,
            end_datetime=end_dt,
            registration_deadline=reg_deadline,
            venue_id=body.venue_id,
            venue_custom=body.venue_custom,
            venue_type=body.venue_type,
            departments_involved=body.departments_involved,
            seating_arrangement=body.seating_arrangement,
            seating_other_detail=body.seating_other_detail,
            tables_required=body.tables_required,
            chairs_required=body.chairs_required,
            podium_setup=body.podium_setup,
            podium_details=body.podium_details,
            decoration=body.decoration,
            decoration_details=body.decoration_details,
            it_projector=body.it_projector,
            it_audio=body.it_audio,
            it_audio_details=body.it_audio_details,
            it_wifi=body.it_wifi,
            it_laptop=body.it_laptop,
            it_laptop_details=body.it_laptop_details,
            it_other=body.it_other,
            food_items=body.food_items,
            food_details=body.food_details,
            beverage_items=body.beverage_items,
            beverage_details=body.beverage_details,
            pax_count=body.pax_count,
            food_service_time=body.food_service_time,
            transport=body.transport,
            transport_details=body.transport_details,
            security=body.security,
            security_details=body.security_details,
            printing=body.printing,
            printing_details=body.printing_details,
            volunteers=body.volunteers,
            volunteers_details=body.volunteers_details,
            other_requirements=body.other_requirements,
            budget=body.budget,
            comments=body.comments,
            poster_path=random_poster_path,
            created_by=current_user.id,
            status="draft",
        )
        db.add(event)
        await db.flush()

        # Add collaborating clubs
        if body.is_collaborative and body.collaborating_club_ids:
            for cid in body.collaborating_club_ids:
                collab = EventCollaboratingClub(event_id=event.id, club_id=cid)
                db.add(collab)

        # Add sponsor if provided
        if body.is_sponsored and body.sponsor_name:
            sponsor = EventSponsor(event_id=event.id, name=body.sponsor_name)
            db.add(sponsor)

        # Add multiple venues
        if body.venue_ids:
            for vid in body.venue_ids:
                db.add(EventVenue(event_id=event.id, venue_id=vid))

        await db.commit()
        await db.refresh(event)
        return {"id": event.id, "status": event.status, "message": "Event created as draft"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating event. Payload: {body.model_dump()}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(e))


# ─── Update ─────────────────────────────────────────────────────────────────

@router.patch("/{event_id}")
async def update_event(
    event_id: int,
    body: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        event = await db.get(Event, event_id, options=[
            selectinload(Event.collaborating_clubs),
        ])
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        collab_club_ids = [c.club_id for c in (event.collaborating_clubs or [])]
        if not can_edit_event(current_user, event, collab_club_ids):
            raise HTTPException(status_code=403, detail="You cannot edit this event")

        now = datetime.now(timezone.utc)
        event_start = event.start_datetime
        if event_start.tzinfo is None:
            event_start = event_start.replace(tzinfo=timezone.utc)
        after_start = now >= event_start

        # Snapshot for diff if post-Director edit
        post_director = event.status in ["approved", "ongoing"]
        if post_director and not after_start:
            old_snap = take_event_snapshot(event)

        if after_start:
            # Only links editable after event starts — handled via /links endpoints
            raise HTTPException(
                status_code=400,
                detail="After event start, only links can be edited via /links endpoints",
            )

        # Apply updates
        update_data = body.model_dump(exclude_unset=True)
        
        # Defensive Boolean details handling inside dict
        if 'podium_setup' in update_data and not update_data['podium_setup']: update_data['podium_details'] = None
        if 'decoration' in update_data and not update_data['decoration']: update_data['decoration_details'] = None
        if 'it_audio' in update_data and not update_data['it_audio']: update_data['it_audio_details'] = None
        if 'it_laptop' in update_data and not update_data['it_laptop']: update_data['it_laptop_details'] = None
        if 'food_items' in update_data and not update_data['food_items']: update_data['food_details'] = None
        if 'beverage_items' in update_data and not update_data['beverage_items']: update_data['beverage_details'] = None
        if 'transport' in update_data and not update_data['transport']: update_data['transport_details'] = None
        if 'security' in update_data and not update_data['security']: update_data['security_details'] = None
        if 'printing' in update_data and not update_data['printing']: update_data['printing_details'] = None
        if 'volunteers' in update_data and not update_data['volunteers']: update_data['volunteers_details'] = None
        
        for field, value in update_data.items():
            if hasattr(event, field):
                setattr(event, field, value)

        # Recompute datetimes if provided
        if body.start_datetime:
            start_dt = body.start_datetime
            if start_dt.tzinfo is None:
                start_dt = start_dt.replace(tzinfo=timezone.utc)
            event.start_datetime = start_dt
            
        if body.end_datetime:
            end_dt = body.end_datetime
            if end_dt.tzinfo is None:
                end_dt = end_dt.replace(tzinfo=timezone.utc)
            event.end_datetime = end_dt
            
        if body.registration_deadline:
            reg_dt = body.registration_deadline
            if reg_dt.tzinfo is None:
                reg_dt = reg_dt.replace(tzinfo=timezone.utc)
            event.registration_deadline = reg_dt
            
        evt_st_compare = event.start_datetime if event.start_datetime.tzinfo else event.start_datetime.replace(tzinfo=timezone.utc)
        evt_end_compare = event.end_datetime if event.end_datetime.tzinfo else event.end_datetime.replace(tzinfo=timezone.utc)
        
        if evt_end_compare <= evt_st_compare:
            raise HTTPException(status_code=400, detail="End date & time must be after start date & time")

        # Check clash if venue or dates changed
        v_ids = body.venue_ids if body.venue_ids is not None else [event.venue_id] if event.venue_id else []
        v_custom = body.venue_custom if body.venue_custom is not None else event.venue_custom
        clashing = await check_venue_clash(
            db, v_ids, v_custom, evt_st_compare, evt_end_compare, exclude_event_id=event.id
        )
        if clashing:
            clash_details = []
            for e in clashing:
                st = e.start_datetime.strftime("%b %d, %I:%M %p")
                en = e.end_datetime.strftime("%I:%M %p")
                v_names = [v.name for v in getattr(e, 'venues', [])] if getattr(e, 'venues', None) else ([e.venue.name] if getattr(e, 'venue', None) else [e.venue_custom or "Venue"])
                clash_details.append(f"'{e.title}' at {', '.join(v_names)} ({st} - {en})")
            
            detail_str = " | ".join(clash_details)
            err_msg = f"Venue clash detected! The venue is already booked for: {detail_str}. Please choose a different venue or time slot."
            raise HTTPException(status_code=409, detail=err_msg)

        if body.venue_ids is not None:
            from sqlalchemy import delete
            await db.execute(delete(EventVenue).where(EventVenue.event_id == event.id))
            for vid in body.venue_ids:
                db.add(EventVenue(event_id=event.id, venue_id=vid))

        # Status reset logic
        is_collab = event.is_collaborative and event.collaborating_clubs
        if event.status == "draft":
            pass  # stays draft
        elif event.status in [
            "pending_associate_dean", "pending_coordinator_parallel",
            "pending_director", "suggested_changes",
        ]:
            # For collaborative events, restart from coordinator parallel approval
            if is_collab:
                from app.services.approval_service import clear_approval_records
                await clear_approval_records(db, event.id)
                event.status = "pending_coordinator_parallel"
                # Re-notify all collaborative coordinators
                from app.services.approval_service import _get_all_collab_coordinators
                from app.services.email_service import notify_collab_chain_restarted
                all_coords = await _get_all_collab_coordinators(db, event)
                if all_coords:
                    editor_name = current_user.name or current_user.email
                    notify_collab_chain_restarted(event, all_coords, editor_name)
            else:
                event.status = "pending_associate_dean"
        elif post_director and not after_start:
            # Save snapshot for diff
            new_snap = take_event_snapshot(event)
            history = EventEditHistory(
                event_id=event.id,
                edited_by=current_user.id,
                old_snapshot=old_snap,
                new_snapshot=new_snap,
            )
            db.add(history)
            event.edit_count = (event.edit_count or 0) + 1

            # For collaborative events, restart from coordinator parallel approval
            if is_collab:
                from app.services.approval_service import clear_approval_records
                await clear_approval_records(db, event.id)
                event.status = "pending_coordinator_parallel"
                from app.services.approval_service import _get_all_collab_coordinators
                from app.services.email_service import notify_collab_chain_restarted
                all_coords = await _get_all_collab_coordinators(db, event)
                if all_coords:
                    editor_name = current_user.name or current_user.email
                    notify_collab_chain_restarted(event, all_coords, editor_name)
            else:
                event.status = "pending_associate_dean"

            # Notify registered students
            from app.models.event_registration import EventRegistration
            from app.models.user import User as UserModel
            reg_result = await db.execute(
                select(UserModel).join(
                    EventRegistration, EventRegistration.student_id == UserModel.id
                ).where(
                    EventRegistration.event_id == event.id,
                    EventRegistration.status == "registered",
                )
            )
            students = reg_result.scalars().all()
            if students:
                notify_event_details_updated(event, students)

        event.last_edited_by = current_user.id
        event.last_edited_at = now
        await db.commit()
        return {"message": "Event updated", "status": event.status}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating event. Payload: {body.model_dump()}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(e))


# ─── Submit ─────────────────────────────────────────────────────────────────

@router.post("/{event_id}/submit")
async def submit_event(
    event_id: int,
    current_user: User = Depends(require_roles("club_coordinator", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    try:
        event = await db.get(
            Event, 
            event_id, 
            options=[
                selectinload(Event.collaborating_clubs),
                selectinload(Event.club),
                selectinload(Event.venues),
                selectinload(Event.venue)
            ]
        )
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # For collaborative events, any collaborating coordinator can submit (co-creators)
        if event.is_collaborative:
            collab_club_ids = [c.club_id for c in (event.collaborating_clubs or [])]
            is_involved = (
                event.created_by == current_user.id
                or event.club_id == current_user.club_id
                or current_user.club_id in collab_club_ids
                or current_user.role == "super_admin"
            )
            if not is_involved:
                raise HTTPException(status_code=403, detail="Only involved coordinators can submit a collaborative event")
        else:
            if event.created_by != current_user.id and current_user.role != "super_admin":
                raise HTTPException(status_code=403, detail="Only the event creator can submit")

        allowed_statuses = ["draft", "suggested_changes"]
        if event.status not in allowed_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot submit event with status '{event.status}'",
            )

        if not event.poster_path:
            raise HTTPException(status_code=400, detail="Poster upload is required before submission")

        event_start = event.start_datetime
        if event_start.tzinfo is None:
            event_start = event_start.replace(tzinfo=timezone.utc)
            
        if event_start <= datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="start_datetime must be in the future")

        event_end = event.end_datetime
        if event_end.tzinfo is None:
            event_end = event_end.replace(tzinfo=timezone.utc)

        # Venue clash check
        # Get event.venues
        v_ids = [v.id for v in getattr(event, 'venues', [])] if getattr(event, 'venues', None) else ([event.venue_id] if event.venue_id else [])
        clashing = await check_venue_clash(
            db, v_ids, event.venue_custom,
            event_start, event_end, exclude_event_id=event.id,
        )
        if clashing:
            clash_details = []
            for e in clashing:
                st = e.start_datetime.strftime("%b %d, %I:%M %p")
                en = e.end_datetime.strftime("%I:%M %p")
                v_names = [v.name for v in getattr(e, 'venues', [])] if getattr(e, 'venues', None) else ([e.venue.name] if getattr(e, 'venue', None) else [e.venue_custom or "Venue"])
                clash_details.append(f"'{e.title}' at {', '.join(v_names)} ({st} - {en})")
            
            detail_str = " | ".join(clash_details)
            raise HTTPException(
                status_code=409,
                detail=f"Venue clash detected! The venue is already booked for: {detail_str}. An approver must override to proceed."
            )

        # Determine target status
        if event.is_collaborative and event.collaborating_clubs:
            event.status = "pending_coordinator_parallel"
            # Notify coordinators of all collaborating clubs
            from app.models.club import Club
            for collab in event.collaborating_clubs:
                collab_club = await db.get(Club, collab.club_id)
                if collab_club and collab_club.coordinator_id:
                    coordinator = await db.get(User, collab_club.coordinator_id)
                    if coordinator:
                        from app.services.email_service import notify_collab_approval_needed
                        notify_collab_approval_needed(event, coordinator)
        else:
            event.status = "pending_associate_dean"
            # Notify associate_dean
            if event.club:
                from app.models.club import Club
                club = await db.get(Club, event.club_id)
                if club and club.department_id:
                    dean_result = await db.execute(
                        select(User).where(
                            User.role == "associate_dean",
                            User.department_id == club.department_id,
                            User.status == "active",
                        )
                    )
                    deans = dean_result.scalars().all()
                    from app.services.email_service import notify_event_submitted
                    for dean in deans:
                        notify_event_submitted(event, dean)

        await db.commit()
        return {"message": "Event submitted", "status": event.status}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting event ID {event_id}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(e))


# ─── Admin Approve (super_admin only) ───────────────────────────────────────

@router.post("/{event_id}/admin-approve")
async def admin_approve_event(
    event_id: int,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Directly approve an event — super_admin only, bypasses approval chain."""
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.status = "approved"
    await db.commit()
    return {"message": "Event approved by admin", "status": "approved"}


# ─── Cancel ─────────────────────────────────────────────────────────────────


@router.post("/{event_id}/cancel")
async def cancel_event(
    event_id: int,
    body: CancelEventRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await db.get(Event, event_id, options=[
        selectinload(Event.collaborating_clubs),
    ])
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    collab_club_ids = [c.club_id for c in (event.collaborating_clubs or [])]
    if not can_cancel_event(current_user, event, collab_club_ids):
        raise HTTPException(status_code=403, detail="You cannot cancel this event")

    if not body.reason or not body.reason.strip():
        raise HTTPException(status_code=400, detail="Cancellation reason is mandatory")

    event.status = "cancelled"
    event.cancellation_reason = body.reason.strip()
    event.cancelled_by = current_user.id

    # Notify registered students
    from app.models.event_registration import EventRegistration
    reg_result = await db.execute(
        select(User).join(
            EventRegistration, EventRegistration.student_id == User.id
        ).where(
            EventRegistration.event_id == event.id,
            EventRegistration.status == "registered",
        )
    )
    students = reg_result.scalars().all()
    if students:
        notify_event_cancelled(event, students, body.reason)

    await db.commit()
    return {"message": "Event cancelled", "status": "cancelled"}


# ─── Delete ─────────────────────────────────────────────────────────────────

@router.delete("/{event_id}")
async def delete_event(
    event_id: int,
    current_user: User = Depends(require_roles("super_admin", "club_coordinator")),
    db: AsyncSession = Depends(get_db),
):
    try:
        # Load event with all relationships that might have files or need cascading
        event = await db.get(Event, event_id, options=[
            selectinload(Event.sponsors),
            selectinload(Event.documents),
            selectinload(Event.other_docs),
            selectinload(Event.report),
            selectinload(Event.collaborating_clubs),
            selectinload(Event.venues_assoc),
            selectinload(Event.approvals),
            selectinload(Event.links),
            selectinload(Event.registrations),
            selectinload(Event.coordinators),
            selectinload(Event.edit_history),
        ])
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
            
        if current_user.role != "super_admin":
            if event.status != "draft" or event.created_by != current_user.id:
                raise HTTPException(status_code=403, detail="You can only delete your own draft events")

        # Cleanup physical files
        if event.poster_path:
            delete_file(event.poster_path)
        if event.participant_doc_path:
            delete_file(event.participant_doc_path)
            
        for sponsor in (event.sponsors or []):
            if sponsor.logo_path:
                delete_file(sponsor.logo_path)
                
        for doc in (event.documents or []):
            if doc.file_path:
                delete_file(doc.file_path)
                
        for other in (event.other_docs or []):
            if other.file_path:
                delete_file(other.file_path)
                
        if event.report:
            if event.report.attendance_doc_path:
                delete_file(event.report.attendance_doc_path)
            if event.report.generated_report_path:
                delete_file(event.report.generated_report_path)

        # Remove email notifications associated with this event first to prevent FK violation
        from sqlalchemy import delete
        from app.models.email_notification import EmailNotification
        await db.execute(delete(EmailNotification).where(EmailNotification.event_id == event.id))

        # Deleting event will trigger cascades in the DB/ORM
        await db.delete(event)
        await db.commit()
        return {"message": "Event deleted successfully along with all associated data"}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


# ─── Poster Upload ──────────────────────────────────────────────────────────

@router.post("/{event_id}/upload-poster")
async def upload_poster(
    event_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles("club_coordinator", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    event = await db.get(Event, event_id, options=[
        selectinload(Event.collaborating_clubs),
    ])
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Allow creator, super_admin, or any collaborating coordinator
    collab_club_ids = [c.club_id for c in (event.collaborating_clubs or [])]
    if (
        event.created_by != current_user.id
        and current_user.role != "super_admin"
        and current_user.club_id not in collab_club_ids
        and current_user.club_id != event.club_id
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    path = await save_file(file, event_id, "poster", file_type="poster")
    if event.poster_path:
        delete_file(event.poster_path)
    event.poster_path = path
    await db.commit()
    return {"message": "Poster uploaded", "path": path}


# ─── Participant Doc Upload ──────────────────────────────────────────────────

@router.post("/{event_id}/upload-participant-doc")
async def upload_participant_doc(
    event_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles("club_coordinator", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    path = await save_file(file, event_id, "participant_doc", file_type="document")
    event.participant_doc_path = path
    await db.commit()
    return {"message": "Participant doc uploaded", "path": path}


# ─── Sponsor Upload ──────────────────────────────────────────────────────────

@router.post("/{event_id}/upload-sponsor")
async def upload_sponsor_doc(
    event_id: int,
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    current_user: User = Depends(require_roles("club_coordinator", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    event = await db.get(Event, event_id, options=[
        selectinload(Event.sponsors),
        selectinload(Event.collaborating_clubs),
    ])
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Allow creator, super_admin, or any collaborating coordinator
    collab_club_ids = [c.club_id for c in (event.collaborating_clubs or [])]
    if (
        event.created_by != current_user.id
        and current_user.role != "super_admin"
        and current_user.club_id not in collab_club_ids
        and current_user.club_id != event.club_id
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    path = await save_file(file, event_id, "sponsor", file_type="document")
    
    if event.sponsors:
        # If there's an existing sponsor entry without a logo_path, update it.
        # Otherwise, add a new one.
        for sponsor in event.sponsors:
            if sponsor.logo_path is None:
                sponsor.logo_path = path
                if name:
                    sponsor.name = name
                await db.commit()
                return {"message": "Sponsor doc uploaded", "path": path}
                
    # Create new if none found to update
    sponsor_name = name or f"Sponsor {len(event.sponsors) + 1}"
    new_sponsor = EventSponsor(event_id=event.id, name=sponsor_name, logo_path=path)
    db.add(new_sponsor)
    
    # Ensure event is marked as sponsored
    if not event.is_sponsored:
        event.is_sponsored = True

    await db.commit()
    return {"message": "Sponsor doc uploaded", "path": path}


# ─── Other Docs ──────────────────────────────────────────────────────────────

@router.post("/{event_id}/other-docs")
async def upload_other_doc(
    event_id: int,
    title: str = Query(default=""),
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles("club_coordinator", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    event = await db.get(Event, event_id, options=[selectinload(Event.other_docs)])
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if len(event.other_docs) >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 supporting documents allowed")

    path = await save_file(file, event_id, "other_docs", file_type="document")
    doc = EventOtherDoc(
        event_id=event_id,
        title=title or file.filename,
        file_path=path,
        uploaded_by=current_user.id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return {"id": doc.id, "path": path}


@router.delete("/{event_id}/other-docs/{doc_id}")
async def delete_other_doc(
    event_id: int,
    doc_id: int,
    current_user: User = Depends(require_roles("club_coordinator", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EventOtherDoc).where(
            EventOtherDoc.id == doc_id, EventOtherDoc.event_id == event_id
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    delete_file(doc.file_path)
    await db.delete(doc)
    await db.commit()
    return {"message": "Document deleted"}


# ─── Internal Documents ──────────────────────────────────────────────────────

@router.post("/{event_id}/documents")
async def add_internal_document(
    event_id: int,
    body: EventDocumentCreate,
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_roles(
        "club_coordinator", "super_admin", "associate_dean", "director"
    )),
    db: AsyncSession = Depends(get_db),
):
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    file_path = None
    if file:
        file_path = await save_file(file, event_id, "documents", file_type="document")

    doc = EventDocument(
        event_id=event_id,
        title=body.title,
        file_path=file_path,
        url=body.url,
        uploaded_by=current_user.id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return {"id": doc.id, "message": "Document added"}


@router.delete("/{event_id}/documents/{doc_id}")
async def delete_internal_document(
    event_id: int,
    doc_id: int,
    current_user: User = Depends(require_roles("club_coordinator", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EventDocument).where(
            EventDocument.id == doc_id, EventDocument.event_id == event_id
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.file_path:
        delete_file(doc.file_path)
    await db.delete(doc)
    await db.commit()
    return {"message": "Document deleted"}


# ─── Links ───────────────────────────────────────────────────────────────────

@router.post("/{event_id}/links", response_model=EventLinkOut)
async def add_link(
    event_id: int,
    body: EventLinkCreate,
    current_user: User = Depends(require_roles("club_coordinator", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    link = EventLink(
        event_id=event_id,
        link_type=body.link_type,
        url=body.url,
        label=body.label,
        created_by=current_user.id,
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)
    return link


@router.patch("/{event_id}/links/{link_id}", response_model=EventLinkOut)
async def update_link(
    event_id: int,
    link_id: int,
    body: EventLinkUpdate,
    current_user: User = Depends(require_roles("club_coordinator", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EventLink).where(EventLink.id == link_id, EventLink.event_id == event_id)
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(link, field, value)
    await db.commit()
    await db.refresh(link)
    return link


@router.delete("/{event_id}/links/{link_id}")
async def delete_link(
    event_id: int,
    link_id: int,
    current_user: User = Depends(require_roles("club_coordinator", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EventLink).where(EventLink.id == link_id, EventLink.event_id == event_id)
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    await db.delete(link)
    await db.commit()
    return {"message": "Link deleted"}


# ─── Event Coordinators ──────────────────────────────────────────────────────

@router.post("/{event_id}/coordinators")
async def add_coordinator(
    event_id: int,
    body: AddCoordinatorRequest,
    current_user: User = Depends(require_roles("club_coordinator", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Must be approved/ongoing to add coordinators
    if event.status not in ["approved", "ongoing"]:
        raise HTTPException(
            status_code=400,
            detail="Coordinators can only be added after Director approval",
        )

    # Validate user exists and is in same department
    user = await db.get(User, body.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    coord = EventCoordinator(
        event_id=event_id,
        user_id=body.user_id,
        added_by=current_user.id,
    )
    db.add(coord)
    await db.commit()
    await db.refresh(coord)
    return {"id": coord.id, "message": "Coordinator added"}


@router.delete("/{event_id}/coordinators/{coord_id}")
async def remove_coordinator(
    event_id: int,
    coord_id: int,
    current_user: User = Depends(require_roles("club_coordinator", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EventCoordinator).where(
            EventCoordinator.id == coord_id, EventCoordinator.event_id == event_id
        )
    )
    coord = result.scalar_one_or_none()
    if not coord:
        raise HTTPException(status_code=404, detail="Coordinator not found")
    await db.delete(coord)
    await db.commit()
    return {"message": "Coordinator removed"}


# ─── Edit Diff ───────────────────────────────────────────────────────────────

@router.get("/{event_id}/diff")
async def get_event_diff(
    event_id: int,
    current_user: User = Depends(require_roles(
        "super_admin", "director", "associate_dean"
    )),
    db: AsyncSession = Depends(get_db),
):
    """Return the latest edit diff for approvers to see what changed."""
    result = await db.execute(
        select(EventEditHistory)
        .where(EventEditHistory.event_id == event_id)
        .order_by(EventEditHistory.edited_at.desc())
        .limit(1)
    )
    history = result.scalar_one_or_none()
    if not history:
        return {"message": "No edit history found", "diff": {}}

    diff = compute_diff(history.old_snapshot, history.new_snapshot)
    return {
        "event_id": event_id,
        "edited_at": history.edited_at,
        "edited_by": history.edited_by,
        "diff": diff,
    }


# ─── Registrations (Admin View) ──────────────────────────────────────────────

@router.get("/{event_id}/registrations")
async def get_event_registrations(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all registered students for this event with detailed profiles."""
    event = await db.get(Event, event_id, options=[selectinload(Event.collaborating_clubs)])
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # Access Control: super_admin, or event creator, or collaborator club coordinator
    allowed = False
    if current_user.role == "super_admin":
        allowed = True
    elif event.created_by == current_user.id:
        allowed = True
    elif current_user.role == "club_coordinator":
        for c in event.collaborating_clubs:
            if c.club_id == current_user.club_id:
                allowed = True
                break
                
    if not allowed:
        raise HTTPException(status_code=403, detail="Access denied. Only authorized coordinators can view registrations.")

    result = await db.execute(
        select(User, EventRegistration)
        .join(EventRegistration, EventRegistration.student_id == User.id)
        .options(selectinload(User.department))
        .where(
            EventRegistration.event_id == event_id,
            EventRegistration.status == "registered",
        )
        .order_by(User.name)
    )
    rows = result.all()
    
    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "department": user.department.name if user.department else "N/A",
            "phone_number": user.phone_number or "N/A",
            "year": user.year_of_study or "N/A",
            "branch": user.branch or "N/A",
            "course": user.course or "N/A",
            "registered_at": reg.registered_at.isoformat() if reg.registered_at else None,
        }
        for user, reg in rows
    ]


@router.get("/{event_id}/registrations/export")
async def export_event_registrations(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export all registered students to an Excel file."""
    # We can reuse the same endpoint fetching logic by calling the python function directly
    registrations = await get_event_registrations(event_id, current_user, db)
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Registered Students"
    
    # Header
    headers = ["Name", "Email", "Phone Number", "Department", "Year", "Branch", "Course", "Registration Time"]
    ws.append(headers)
    
    # Rows
    for r in registrations:
        ws.append([
            r["name"],
            r["email"],
            r["phone_number"],
            r["department"],
            r["year"],
            r["branch"],
            r["course"],
            r["registered_at"]
        ])
    
    # Auto-adjust column widths
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = (max_length + 2)
        ws.column_dimensions[column].width = adjusted_width
        
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=event_{event_id}_registrations.xlsx"
        }
    )


# ─── Automated Report Generation ─────────────────────────────────────────────

@router.post("/{event_id}/generate-report")
async def generate_automated_report(
    event_id: int,
    current_user: User = Depends(require_roles("club_coordinator", "associate_dean", "director", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if event.status != "completed" and current_user.role != "super_admin":
        raise HTTPException(status_code=400, detail="Report can only be generated for completed events")

    # Gather data for the report
    report_lines = [
        f"Event Report: {event.title}",
        "=" * 40,
        f"Type: {event.event_type}",
        f"Status: {event.status.upper()}",
        f"Start: {event.start_datetime}",
        f"End: {event.end_datetime}",
        f"Incharge: {event.event_incharge_name} ({event.event_incharge_contact})",
        f"Department/School: {event.school_department}",
        f"Budget: {event.budget}",
        "",
        "Requirements & Overview:",
        "-" * 20,
        f"Food/Beverage: {'Yes' if event.food_items or event.beverage_items else 'No'}",
        f"IT Setup: {'Yes' if event.it_projector or event.it_audio or event.it_laptop else 'No'}",
        f"Transport: {'Yes' if event.transport else 'No'}",
        "",
        "Comments/Feedback:",
        event.comments or "N/A",
        "",
        f"Generated automatically on {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}"
    ]

    report_content = "\n".join(report_lines)
    
    return PlainTextResponse(
        content=report_content,
        headers={"Content-Disposition": f'attachment; filename="report_event_{event_id}.txt"'}
    )
