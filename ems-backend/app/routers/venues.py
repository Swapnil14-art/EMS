from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime, date

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.venue import Venue
from app.models.event import Event
from app.schemas.venue import VenueCreate, VenueUpdate, VenueOut
from app.services.venue_clash_service import check_venue_clash

router = APIRouter()


@router.get("/", response_model=List[VenueOut])
async def list_venues(
    active_only: bool = Query(True),
    department_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Venue)
    if active_only:
        query = query.where(Venue.is_active == True)  # noqa: E712
    if department_id is not None:
        query = query.where(Venue.department_id == department_id)
    query = query.order_by(Venue.name)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/calendar")
async def venue_calendar(
    date_str: str = Query(..., alias="date", description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Day-view calendar — returns all events at each venue on a given date."""
    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    day_start = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0)
    day_end = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59)

    from app.services.venue_clash_service import CLASH_CHECK_STATUSES
    result = await db.execute(
        select(Event).where(
            Event.status.in_(CLASH_CHECK_STATUSES),
            Event.start_datetime <= day_end,
            Event.end_datetime >= day_start,
            Event.venue_id.isnot(None),
        )
    )
    events = result.scalars().all()

    calendar: dict = {}
    for event in events:
        vid = str(event.venue_id)
        if vid not in calendar:
            calendar[vid] = []
        calendar[vid].append({
            "id": event.id,
            "title": event.title,
            "start_datetime": event.start_datetime.isoformat(),
            "end_datetime": event.end_datetime.isoformat(),
            "status": event.status,
        })
    return {"date": date_str, "venues": calendar}


@router.get("/clash-check")
async def clash_check(
    venue_id: Optional[int] = Query(None),
    venue_custom: Optional[str] = Query(None),
    start_datetime: datetime = Query(...),
    end_datetime: datetime = Query(...),
    exclude_event_id: Optional[int] = Query(None),
    current_user: User = Depends(require_roles(
        "super_admin", "director", "associate_dean", "club_coordinator"
    )),
    db: AsyncSession = Depends(get_db),
):
    """Check for venue clashes before submitting an event."""
    clashing = await check_venue_clash(
        db, venue_id, venue_custom, start_datetime, end_datetime, exclude_event_id
    )
    return {
        "has_clash": len(clashing) > 0,
        "clashing_events": [
            {
                "id": e.id,
                "title": e.title,
                "start_datetime": e.start_datetime.isoformat(),
                "end_datetime": e.end_datetime.isoformat(),
                "status": e.status,
            }
            for e in clashing
        ],
    }


@router.get("/{venue_id}", response_model=VenueOut)
async def get_venue(
    venue_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    venue = await db.get(Venue, venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return venue


@router.post("/", response_model=VenueOut, status_code=201)
async def create_venue(
    body: VenueCreate,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    venue = Venue(**body.model_dump())
    db.add(venue)
    await db.commit()
    await db.refresh(venue)
    return venue


@router.patch("/{venue_id}", response_model=VenueOut)
async def update_venue(
    venue_id: int,
    body: VenueUpdate,
    current_user: User = Depends(require_roles("super_admin", "associate_dean")),
    db: AsyncSession = Depends(get_db),
):
    venue = await db.get(Venue, venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(venue, field, value)
    await db.commit()
    await db.refresh(venue)
    return venue
