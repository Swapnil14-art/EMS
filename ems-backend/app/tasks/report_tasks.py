from celery import shared_task
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings


@shared_task(name="app.tasks.generate_report_task")
def generate_report_task(event_id: int, report_id: int):
    """
    Celery task that triggers report generation.
    Called after report is saved to DB.
    """
    from app.models.event import Event
    from app.models.event_report import EventReport
    from app.services.report_service import generate_event_report

    sync_engine = create_engine(settings.DATABASE_URL_SYNC)
    SyncSession = sessionmaker(bind=sync_engine)

    with SyncSession() as db:
        event = db.get(Event, event_id)
        report = db.get(EventReport, report_id)
        if event and report:
            path = generate_event_report(event, report)
            report.generated_report_path = path
            db.commit()
            return {"status": "success", "path": path}
    return {"status": "failed", "reason": "event or report not found"}
