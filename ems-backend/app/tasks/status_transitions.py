from celery import shared_task
from datetime import datetime, timezone
from sqlalchemy import select, create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

sync_engine = create_engine(settings.DATABASE_URL_SYNC)
SyncSession = sessionmaker(bind=sync_engine)


@shared_task(name="app.tasks.status_transitions.check_and_transition_events")
def check_and_transition_events():
    """
    Runs every 2 minutes via Celery Beat.

    Transitions:
    - approved  → ongoing   : when now >= start_datetime
    - ongoing   → completed : when now >= end_datetime

    NOTE: completed → archived is triggered by report submission, NOT here.
    """
    from app.models.event import Event  # avoid circular imports

    now = datetime.now(timezone.utc)

    with SyncSession() as db:
        # approved → ongoing
        events_to_start = db.execute(
            select(Event).where(
                Event.status == "approved",
                Event.start_datetime <= now,
            )
        ).scalars().all()

        for event in events_to_start:
            event.status = "ongoing"

        # ongoing → completed
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
