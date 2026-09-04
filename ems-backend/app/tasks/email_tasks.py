from celery import shared_task
from typing import List, Optional
import smtplib
import ssl
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings


logger = logging.getLogger(__name__)


@shared_task(name="app.tasks.email_tasks.send_email", bind=True, max_retries=3)
def send_email(
    self,
    recipient: str,
    subject: str,
    body_html: str,
    event_id: Optional[int] = None,
    email_type: str = "general",
):
    """Send a single email. Retries up to 3 times on failure."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        if settings.SMTP_FROM_NAME:
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM}>"
        else:
            msg["From"] = settings.SMTP_FROM
        msg["To"] = recipient
        msg.attach(MIMEText(body_html, "html"))

        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=settings.SMTP_TIMEOUT_SECONDS,
        ) as server:
            server.ehlo()
            if settings.SMTP_TLS:
                server.starttls(context=ssl.create_default_context())
                server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, recipient, msg.as_string())

        _safe_log_email(recipient, subject, email_type, event_id, "sent")

    except Exception as exc:
        err_msg = str(exc)
        if settings.SMTP_PASSWORD and settings.SMTP_PASSWORD in err_msg:
            err_msg = err_msg.replace(settings.SMTP_PASSWORD, "******")
        _safe_log_email(recipient, subject, email_type, event_id, "failed", err_msg)
        # Authentication failures are permanent until SMTP configuration
        # changes. Retrying them only creates duplicate log rows.
        if isinstance(exc, smtplib.SMTPAuthenticationError):
            logger.error("Email delivery authentication failed for type=%s recipient=%s", email_type, recipient)
            raise
        raise self.retry(exc=exc, countdown=60)


@shared_task(name="app.tasks.email_tasks.send_bulk_email")
def send_bulk_email(
    recipients: List[str],
    subject: str,
    body_html: str,
    event_id: Optional[int] = None,
    email_type: str = "bulk",
):
    """Dispatch individual send_email tasks for each recipient."""
    for recipient in recipients:
        send_email.delay(recipient, subject, body_html, event_id, email_type)


def _log_email(
    recipient: str,
    subject: str,
    email_type: str,
    event_id: Optional[int],
    status: str,
    error: str = None,
):
    """Log email to DB. Uses sync session."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.models.email_notification import EmailNotification

    sync_engine = create_engine(settings.DATABASE_URL_SYNC)
    SyncSession = sessionmaker(bind=sync_engine)

    with SyncSession() as db:
        log = EmailNotification(
            recipient=recipient,
            subject=subject,
            type=email_type,
            event_id=event_id,
            status=status,
            error_message=error,
        )
        db.add(log)
        db.commit()


def _safe_log_email(*args, **kwargs):
    """Never retry a successfully delivered email solely because audit logging failed."""
    try:
        _log_email(*args, **kwargs)
    except Exception:
        logger.exception("Unable to persist email audit record")
