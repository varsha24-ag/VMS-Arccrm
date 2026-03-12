import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_host_notification(
    host_email: str,
    host_name: str,
    visitor_name: str,
    purpose: str | None,
    phone: str | None,
    company: str | None,
    photo_url: str | None,
    approval_token: str | None,
    visit_id: int,
) -> None:
    if not settings.SMTP_HOST or not settings.SMTP_FROM:
        logger.warning("SMTP not configured. Email not sent.")
        return

    base_url = settings.APP_BASE_URL or "http://localhost:8000"
    approve_link = f"{base_url}/visits/{visit_id}/approve?token={approval_token}"
    reject_link = f"{base_url}/visits/{visit_id}/reject?token={approval_token}"

    subject = f"Visitor arrival: {visitor_name}"
    photo_link = photo_url
    if photo_url and not photo_url.startswith("http"):
        photo_link = f"{base_url}{photo_url}"

    body = (
        f"Hello {host_name},\n\n"
        f"A visitor has been registered.\n"
        f"Visitor: {visitor_name}\n"
        f"Phone: {phone or 'N/A'}\n"
        f"Company: {company or 'N/A'}\n"
        f"Purpose: {purpose or 'N/A'}\n\n"
        f"Photo: {photo_link or 'N/A'}\n\n"
        f"Approve: {approve_link}\n"
        f"Reject: {reject_link}\n\n"
        "Please be available to receive the visitor.\n"
    )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM
    message["To"] = host_email
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
        logger.info("Host notification sent to %s", host_email)
    except Exception:
        logger.exception("Failed to send host notification to %s", host_email)


def send_reception_notification(reception_email: str, visitor_name: str, status: str) -> None:
    if not settings.SMTP_HOST or not settings.SMTP_FROM:
        logger.warning("SMTP not configured. Reception email not sent.")
        return

    subject = f"Visitor {status}: {visitor_name}"
    body = (
        "Reception update:\n\n"
        f"Visitor: {visitor_name}\n"
        f"Host response: {status}\n\n"
        "You can proceed with check-in if approved."
    )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM
    message["To"] = reception_email
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
        logger.info("Reception notification sent to %s", reception_email)
    except Exception:
        logger.exception("Failed to send reception notification to %s", reception_email)
