"""
Venue clash detection.
Clash = time overlap at same venue, against events with "active" statuses.
"""
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from app.models.event import Event, EventVenue
from app.models.venue import Venue

# Statuses that "occupy" a venue (draft, rejected, cancelled do NOT count)
CLASH_CHECK_STATUSES = [
    "pending_associate_dean",
    "pending_coordinator_parallel",
    "pending_director",
    "approved",
    "ongoing",
]


async def check_venue_clash(
    db: AsyncSession,
    venue_ids: Optional[List[int]],
    venue_custom: Optional[str],
    start_datetime: datetime,
    end_datetime: datetime,
    exclude_event_id: Optional[int] = None,
) -> List[Event]:
    """
    Returns a list of clashing events.
    Empty list = no clash.
    """
    clashing_events = []

    if venue_ids:
        for venue_id in venue_ids:
            venue = await db.get(Venue, venue_id)
            if not venue:
                continue

            query = select(Event).join(EventVenue, Event.id == EventVenue.event_id).options(
                selectinload(Event.venues),
                selectinload(Event.venue)
            ).where(
                Event.status.in_(CLASH_CHECK_STATUSES),
                EventVenue.venue_id == venue_id,
                _time_overlap(start_datetime, end_datetime),
            )
            if exclude_event_id:
                query = query.where(Event.id != exclude_event_id)

            result = await db.execute(query)
            conflicting = result.scalars().all()

            # Only clash if max_capacity events already booked
            if len(conflicting) >= venue.max_capacity:
                clashing_events.extend(conflicting)

    if venue_custom:
        all_venues_result = await db.execute(select(Venue).where(Venue.is_active == True))  # noqa: E712
        venues = all_venues_result.scalars().all()

        matched_venue_ids = []
        for v in venues:
            if _fuzzy_match(venue_custom, v.name, v.aliases or ""):
                matched_venue_ids.append(v.id)

        if matched_venue_ids:
            for vid in matched_venue_ids:
                result = await db.execute(
                    select(Event).options(
                        selectinload(Event.venues),
                        selectinload(Event.venue)
                    ).where(
                        Event.status.in_(CLASH_CHECK_STATUSES),
                        Event.venue_id == vid,
                        _time_overlap(start_datetime, end_datetime),
                    )
                )
                clashing_events.extend(result.scalars().all())

    return clashing_events


def _time_overlap(start: datetime, end: datetime):
    """SQLAlchemy condition for time overlap with 1 hour buffer rule."""
    start_minus_1h = start - timedelta(hours=1)
    end_plus_1h = end + timedelta(hours=1)

    return and_(
        Event.start_datetime < end_plus_1h,
        Event.end_datetime > start_minus_1h,
    )


def _fuzzy_match(input_name: str, venue_name: str, aliases: str) -> bool:
    """Simple fuzzy match — normalize and compare."""
    def normalize(s: str) -> str:
        return s.lower().replace(" ", "").replace("-", "").replace("_", "")

    normalized_input = normalize(input_name)
    all_names = [venue_name] + [a.strip() for a in aliases.split(",") if a.strip()]

    for name in all_names:
        if normalized_input in normalize(name) or normalize(name) in normalized_input:
            return True
    return False
