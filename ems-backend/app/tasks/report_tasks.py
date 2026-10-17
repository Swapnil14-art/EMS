"""
Background document generation task.
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


def generate_report_task(event_id: int, report_id: int):
    """
    Triggers DOCX event report generation in background.
    """
    from app.models.event import Event
    from app.models.event_report import EventReport
    from app.services.report_service import generate_event_report

    sync_engine = create_engine(settings.DATABASE_URL_SYNC)
    SyncSession = sessionmaker(bind=sync_engine)

    try:
        with SyncSession() as db:
            event = db.get(Event, event_id)
            report = db.get(EventReport, report_id)
            if event and report:
                path = generate_event_report(event, report)
                report.generated_report_path = path
                db.commit()
                return {"status": "success", "path": path}
        return {"status": "failed", "reason": "event or report not found"}
    except Exception as e:
        logger.exception("Error generating event report: %s", e)
        return {"status": "failed", "reason": str(e)}


generate_report_task.delay = lambda *args, **kwargs: _run_in_background(generate_report_task, *args, **kwargs)
