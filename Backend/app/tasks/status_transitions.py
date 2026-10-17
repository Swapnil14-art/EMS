"""
Event status transitions:
- approved  → ongoing   : when now >= start_datetime
- ongoing   → completed : when now >= end_datetime

Provides both async execution for APScheduler and backwards-compatible sync wrapper.
"""
from datetime import datetime, timezone
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings

logger = logging.getLogger(__name__)


async def check_and_transition_events_async(db: AsyncSession) -> dict:
    """
    Executes every 120 seconds via in-process APScheduler inside FastAPI.
    Uses async SQLAlchemy 2.0 syntax.
    """
    from app.models.event import Event  # Avoid circular imports

    now = datetime.now(timezone.utc)

    # 1. approved → ongoing
    res_start = await db.execute(
        select(Event).where(
            Event.status == "approved",
            Event.start_datetime <= now,
        )
    )
    events_to_start = res_start.scalars().all()
    for event in events_to_start:
        event.status = "ongoing"

    # 2. ongoing → completed
    res_complete = await db.execute(
        select(Event).where(
            Event.status == "ongoing",
            Event.end_datetime <= now,
        )
    )
    events_to_complete = res_complete.scalars().all()
    for event in events_to_complete:
        event.status = "completed"

    if events_to_start or events_to_complete:
        await db.commit()

    return {
        "started": len(events_to_start),
        "completed": len(events_to_complete),
        "checked_at": now.isoformat(),
    }


def check_and_transition_events() -> dict:
    """
    Synchronous fallback wrapper for tests or legacy callers.
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.models.event import Event

    now = datetime.now(timezone.utc)
    sync_engine = create_engine(settings.DATABASE_URL_SYNC)
    SyncSession = sessionmaker(bind=sync_engine)

    with SyncSession() as db:
        events_to_start = db.execute(
            select(Event).where(
                Event.status == "approved",
                Event.start_datetime <= now,
            )
        ).scalars().all()
        for event in events_to_start:
            event.status = "ongoing"

        events_to_complete = db.execute(
            select(Event).where(
                Event.status == "ongoing",
                Event.end_datetime <= now,
            )
        ).scalars().all()
        for event in events_to_complete:
            event.status = "completed"

        db.commit()

    return {
        "started": len(events_to_start),
        "completed": len(events_to_complete),
        "checked_at": now.isoformat(),
    }
