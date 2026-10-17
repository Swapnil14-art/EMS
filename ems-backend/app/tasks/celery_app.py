"""
Celery legacy configuration (mocked/optional when running with native APScheduler).
"""
import logging
from app.config import settings

logger = logging.getLogger(__name__)

try:
    from celery import Celery
    celery_app = Celery(
        "ems",
        broker=settings.CELERY_BROKER_URL,
        backend=settings.CELERY_RESULT_BACKEND,
        include=[
            "app.tasks.status_transitions",
            "app.tasks.email_tasks",
            "app.tasks.report_tasks",
        ],
    )
    celery_app.conf.update(
        task_serializer="json",
        result_serializer="json",
        accept_content=["json"],
        timezone="Asia/Kolkata",
        enable_utc=True,
    )
    celery_app.conf.beat_schedule = {
        "check-status-transitions": {
            "task": "app.tasks.status_transitions.check_and_transition_events",
            "schedule": 120.0,
        },
    }
except ImportError:
    class DummyCelery:
        conf = {}
    celery_app = DummyCelery()
