"""
Background RnD report generation task.
"""
import asyncio
import functools
import logging
import threading
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

logger = logging.getLogger(__name__)


def _run_in_background(target, *args, **kwargs):
    call = functools.partial(target, *args, **kwargs)
    try:
        loop = asyncio.get_running_loop()
        loop.run_in_executor(None, call)
    except RuntimeError:
        threading.Thread(target=call, daemon=True).start()


def generate_rnd_report_task(event_id: int, report_id: int):
    """
    Triggers RnD report generation in background.
    """
    from app.models.event import Event
    from app.models.event_rnd_report import EventRndReport
    from app.services.rnd_report_service import generate_rnd_report

    sync_engine = create_engine(settings.DATABASE_URL_SYNC)
    SyncSession = sessionmaker(bind=sync_engine)

    try:
        with SyncSession() as db:
            event = db.get(Event, event_id)
            report = db.get(EventRndReport, report_id)
            if event and report:
                path = generate_rnd_report(event, report)
                report.generated_report_path = path
                db.commit()
                return {"status": "success", "path": path}
        return {"status": "failed", "reason": "event or rnd report not found"}
    except Exception as e:
        logger.exception("Error generating RnD report: %s", e)
        return {"status": "failed", "reason": str(e)}


generate_rnd_report_task.delay = lambda *args, **kwargs: _run_in_background(generate_rnd_report_task, *args, **kwargs)
