from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.event import Event
from app.models.event_registration import EventRegistration
from app.models.club import Club
from app.models.venue import Venue

router = APIRouter()


@router.get("/coordinator")
async def coordinator_dashboard(
    current_user: User = Depends(require_roles("club_coordinator", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    """6-stat coordinator dashboard."""
    base_filter = Event.created_by == current_user.id

    # Total events created
    total_result = await db.execute(
        select(func.count(Event.id)).where(base_filter)
    )
    total_events = total_result.scalar()

    # Events by status
    status_result = await db.execute(
        select(Event.status, func.count(Event.id))
        .where(base_filter)
        .group_by(Event.status)
    )
    events_by_status = {row[0]: row[1] for row in status_result.all()}

    # Total participants across all events
    participant_result = await db.execute(
        select(func.count(EventRegistration.id))
        .join(Event, Event.id == EventRegistration.event_id)
        .where(base_filter, EventRegistration.status == "registered")
    )
    total_participants = participant_result.scalar() or 0

    # Events by type
    type_result = await db.execute(
        select(Event.event_type, func.count(Event.id))
        .where(base_filter)
        .group_by(Event.event_type)
    )
    events_by_type = {row[0]: row[1] for row in type_result.all()}

    # Events by month (last 12 months)
    month_result = await db.execute(
        select(
            func.to_char(Event.start_datetime, "YYYY-MM").label("month"),
            func.count(Event.id).label("count"),
        )
        .where(base_filter)
        .group_by("month")
        .order_by("month")
        .limit(12)
    )
    events_by_month = [
        {"month": row[0], "count": row[1]} for row in month_result.all()
    ]

    # Top clubs by event count (department-level)
    if current_user.department_id:
        dept_clubs = select(Club.id).where(Club.department_id == current_user.department_id)
        club_result = await db.execute(
            select(Club.name, func.count(Event.id).label("count"))
            .join(Event, Event.club_id == Club.id)
            .where(Club.id.in_(dept_clubs))
            .group_by(Club.name)
            .order_by(func.count(Event.id).desc())
            .limit(5)
        )
        top_clubs = [
            {"club_name": row[0], "count": row[1]} for row in club_result.all()
        ]
    else:
        top_clubs = []

    return {
        "total_events_created": total_events,
        "total_participants": total_participants,
        "events_by_status": events_by_status,
        "events_by_type": events_by_type,
        "events_by_month": events_by_month,
        "top_clubs_by_event_count": top_clubs,
    }


@router.get("/admin")
async def admin_dashboard(
    current_user: User = Depends(require_roles("super_admin", "director")),
    db: AsyncSession = Depends(get_db),
):
    """System-wide stats for super_admin / director."""
    # Total events
    total_result = await db.execute(select(func.count(Event.id)))
    total_events = total_result.scalar()

    # Events by status
    status_result = await db.execute(
        select(Event.status, func.count(Event.id)).group_by(Event.status)
    )
    events_by_status = {row[0]: row[1] for row in status_result.all()}

    # Events by type
    type_result = await db.execute(
        select(Event.event_type, func.count(Event.id)).group_by(Event.event_type)
    )
    events_by_type = {row[0]: row[1] for row in type_result.all()}

    # Total users by role
    user_role_result = await db.execute(
        select(User.role, func.count(User.id)).group_by(User.role)
    )
    users_by_role = {row[0]: row[1] for row in user_role_result.all()}

    # Total registrations
    reg_result = await db.execute(
        select(func.count(EventRegistration.id))
        .where(EventRegistration.status == "registered")
    )
    total_registrations = reg_result.scalar() or 0

    # Events by month
    month_result = await db.execute(
        select(
            func.to_char(Event.start_datetime, "YYYY-MM").label("month"),
            func.count(Event.id).label("count"),
        )
        .group_by("month")
        .order_by("month")
        .limit(12)
    )
    events_by_month = [
        {"month": row[0], "count": row[1]} for row in month_result.all()
    ]

    # Top 10 clubs by event count
    club_result = await db.execute(
        select(Club.name, func.count(Event.id).label("count"))
        .join(Event, Event.club_id == Club.id)
        .group_by(Club.name)
        .order_by(func.count(Event.id).desc())
        .limit(10)
    )
    top_clubs = [{"club_name": row[0], "count": row[1]} for row in club_result.all()]

    # Total clubs active
    club_count_result = await db.execute(select(func.count(Club.id)).where(Club.is_active == True))
    total_clubs = club_count_result.scalar() or 0

    # Total venues active
    venue_count_result = await db.execute(select(func.count(Venue.id)).where(Venue.is_active == True))
    total_venues = venue_count_result.scalar() or 0

    return {
        "total_events": total_events,
        "total_registrations": total_registrations,
        "events_by_status": events_by_status,
        "events_by_type": events_by_type,
        "users_by_role": users_by_role,
        "events_by_month": events_by_month,
        "top_clubs_by_event_count": top_clubs,
        "total_clubs": total_clubs,
        "total_venues": total_venues,
    }


@router.get("/associate_dean")
async def associate_dean_dashboard(
    current_user: User = Depends(require_roles("associate_dean", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Department-wide stats for associate dean."""
    base_filter = True
    if current_user.department_id:
        dept_clubs = select(Club.id).where(Club.department_id == current_user.department_id)
        base_filter = Event.club_id.in_(dept_clubs.scalar_subquery())
    else:
        base_filter = Event.id > 0 # dummy filter if no dep

    # Events by status
    status_result = await db.execute(
        select(Event.status, func.count(Event.id))
        .where(base_filter)
        .group_by(Event.status)
    )
    events_by_status = {row[0]: row[1] for row in status_result.all()}

    # Total department events
    total_result = await db.execute(select(func.count(Event.id)).where(base_filter))
    total_events = total_result.scalar() or 0

    return {
        "events_by_status": events_by_status,
        "total_events": total_events,
    }
