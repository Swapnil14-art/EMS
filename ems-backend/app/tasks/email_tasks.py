"""
Email dispatching and audit logging tasks.
Runs asynchronously in thread pool without Celery/Redis dependencies.
"""
import asyncio
import functools
import logging
import smtplib
import ssl
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

from app.config import settings

logger = logging.getLogger(__name__)


def _run_in_background(target, *args, **kwargs):
    """Execute callable in asyncio thread pool or daemon thread if no loop running."""
    call = functools.partial(target, *args, **kwargs)
    try:
        loop = asyncio.get_running_loop()
        loop.run_in_executor(None, call)
    except RuntimeError:
        threading.Thread(target=call, daemon=True).start()


def send_email(
    recipient: str,
    subject: str,
    body_html: str,
    event_id: Optional[int] = None,
    email_type: str = "general",
    max_retries: int = 3,
):
    """Send a single email. Retries internally up to 3 times on transient failure."""
    attempt = 0
    while attempt < max_retries:
        attempt += 1
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
            return

        except Exception as exc:
            err_msg = str(exc)
            if settings.SMTP_PASSWORD and settings.SMTP_PASSWORD in err_msg:
                err_msg = err_msg.replace(settings.SMTP_PASSWORD, "******")
            _safe_log_email(recipient, subject, email_type, event_id, "failed", err_msg)

            if isinstance(exc, smtplib.SMTPAuthenticationError):
                logger.error("Email delivery authentication failed for type=%s recipient=%s", email_type, recipient)
                return

            if attempt >= max_retries:
                logger.warning("Max email retries reached for %s: %s", recipient, err_msg)
                return


def send_bulk_email(
    recipients: List[str],
    subject: str,
    body_html: str,
    event_id: Optional[int] = None,
    email_type: str = "bulk",
):
    """Dispatch individual emails for each recipient in background."""
    for recipient in recipients:
        send_email(recipient, subject, body_html, event_id, email_type)


# Backward compatible .delay() dispatchers matching Celery task signatures
send_email.delay = lambda *args, **kwargs: _run_in_background(send_email, *args, **kwargs)
send_bulk_email.delay = lambda *args, **kwargs: _run_in_background(send_bulk_email, *args, **kwargs)


def _log_email(
    recipient: str,
    subject: str,
    email_type: str,
    event_id: Optional[int],
    status: str,
    error: str = None,
):
    """Log email to DB using sync session."""
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
    """Never fail email sending solely because audit logging failed."""
    try:
        _log_email(*args, **kwargs)
    except Exception:
        logger.exception("Unable to persist email audit record")
