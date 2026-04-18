from celery import Celery
from app.config import settings

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

# Celery Beat Schedule — runs every 2 minutes
celery_app.conf.beat_schedule = {
    "check-status-transitions": {
        "task": "app.tasks.status_transitions.check_and_transition_events",
        "schedule": 120.0,
    },
}
