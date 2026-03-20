import logging
import smtplib
from io import BytesIO
from pathlib import Path
from email.utils import make_msgid
from email.message import EmailMessage
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def build_qr_png(payload: str) -> tuple[Optional[bytes], Optional[str]]:
    try:
        import qrcode
    except ModuleNotFoundError:
        logger.warning("qrcode package not installed. QR image will not be attached.")
        return None, None

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(payload)
    qr.make(fit=True)
    image = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue(), "image/png"


def get_frontend_qr_checkin_url(qr_code: str) -> str:
    frontend_base_url = settings.FRONTEND_BASE_URL or "http://localhost:3000"
    return f"{frontend_base_url}/qr-checkin?code={qr_code}"


def send_host_notification(
    host_email: str,
    host_name: str,
    visitor_name: str,
    purpose: Optional[str],
    phone: Optional[str],
    company: Optional[str],
    photo_url: Optional[str],
    approval_token: Optional[str],
    visit_id: int,
) -> bool:
    if not settings.SMTP_HOST or not settings.SMTP_FROM:
        logger.warning("SMTP not configured. Email not sent.")
        return False

    base_url = settings.APP_BASE_URL or "http://localhost:8000"
    approve_link = f"{base_url}/visits/{visit_id}/approve?token={approval_token}"
    reject_link = f"{base_url}/visits/{visit_id}/reject?token={approval_token}"

    subject = f"Visitor arrival: {visitor_name}"
    photo_link = photo_url
    if photo_url and not photo_url.startswith("http"):
        photo_link = f"{base_url}{photo_url}"
    default_avatar = (
        "data:image/svg+xml;utf8,"
        "<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'>"
        "<rect width='96' height='96' rx='48' fill='%231e3a5f'/>"
        "<circle cx='48' cy='38' r='18' fill='%2394a3b8'/>"
        "<path d='M20 82c6-16 22-24 28-24s22 8 28 24' fill='%2394a3b8'/>"
        "</svg>"
    )
    uploads_dir = Path(__file__).resolve().parents[2] / "uploads" / "visitors"
    photo_bytes: Optional[bytes] = None
    photo_mime = "image/jpeg"
    if photo_url and photo_url.startswith("/uploads/visitors/"):
        local_path = uploads_dir / Path(photo_url).name
        if local_path.exists():
            photo_bytes = local_path.read_bytes()
            suffix = local_path.suffix.lower()
            if suffix == ".png":
                photo_mime = "image/png"
            elif suffix == ".webp":
                photo_mime = "image/webp"
            else:
                photo_mime = "image/jpeg"

    image_cid = make_msgid(domain="vms.local")[1:-1] if photo_bytes else None
    photo_src = f"cid:{image_cid}" if image_cid else (photo_link or default_avatar)

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

    html_body = f"""
    <html>
      <body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
        <div style="max-width:620px;margin:24px auto;background:#0b2239;border-radius:18px;padding:24px;color:#e2e8f0;">
          <h2 style="margin:0 0 18px 0;color:#ffffff;font-size:20px;">Visitor approval required</h2>
          <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;background:#102a43;border-radius:14px;padding:18px;">
            <img src="{photo_src}" alt="Visitor photo" width="80" height="80" style="border-radius:40px;border:1px solid #1e3a5f;object-fit:cover;background:#1e293b;" />
            <div style="flex:1 1 260px;">
              <p style="margin:0 0 6px 0;color:#ffffff;font-size:18px;font-weight:700;">{visitor_name}</p>
              <p style="margin:0 0 6px 0;color:#cbd5f5;font-size:14px;">📞 {phone or "N/A"}</p>
              <p style="margin:0 0 6px 0;color:#cbd5f5;font-size:14px;">🏢 {company or "N/A"}</p>
              <p style="margin:0;color:#cbd5f5;font-size:14px;">📝 {purpose or "N/A"}</p>
            </div>
          </div>
          <div style="margin-top:18px;display:flex;gap:16px;flex-wrap:wrap;">
            <a href="{approve_link}" style="background:#22c55e;color:#0b1220;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">Accept</a>
            <a href="{reject_link}" style="background:#ef4444;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">Reject</a>
          </div>
          <p style="margin-top:14px;color:#94a3b8;font-size:12px;">This link works only once. After you respond, the other option will be disabled.</p>
        </div>
      </body>
    </html>
    """

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM
    message["To"] = host_email
    message.set_content(body)
    message.add_alternative(html_body, subtype="html")
    if photo_bytes and image_cid:
        html_part = message.get_payload()[-1]
        maintype, subtype = photo_mime.split("/", 1)
        html_part.add_related(photo_bytes, maintype=maintype, subtype=subtype, cid=image_cid)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
        logger.info("Host notification sent to %s", host_email)
        return True
    except Exception:
        logger.exception("Failed to send host notification to %s", host_email)
        return False


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


def send_visitor_access_pass(
    visitor_email: str,
    visitor_name: str,
    host_name: str,
    qr_code: str,
    valid_to: str,
    max_visits: int,
) -> bool:
    if not settings.SMTP_HOST or not settings.SMTP_FROM:
        logger.warning("SMTP not configured. Access pass email not sent.")
        return False

    qr_checkin_url = get_frontend_qr_checkin_url(qr_code)
    qr_png, qr_mime = build_qr_png(qr_checkin_url)
    qr_cid = make_msgid(domain="vms.local")[1:-1] if qr_png else None
    subject = f"Visitor access pass for {visitor_name}"
    body = (
        f"Hello {visitor_name},\n\n"
        f"Your visitor access pass has been created by {host_name}.\n"
        f"QR Code: {qr_code}\n"
        f"Valid until: {valid_to}\n"
        f"Max visits: {max_visits}\n\n"
        "Please present this code at reception.\n"
    )

    html_body = f"""
    <html>
      <body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
        <div style="max-width:620px;margin:24px auto;background:#0b2239;border-radius:18px;padding:24px;color:#e2e8f0;">
          <h2 style="margin:0 0 18px 0;color:#ffffff;font-size:20px;">Visitor access pass</h2>
          <p style="margin:0 0 8px 0;color:#cbd5f5;">Hello {visitor_name},</p>
          <p style="margin:0 0 16px 0;color:#cbd5f5;">{host_name} has created your visitor access pass.</p>
          <div style="background:#102a43;border-radius:14px;padding:18px;">
            <p style="margin:0 0 8px 0;color:#ffffff;font-size:16px;font-weight:700;">QR Code</p>
            <p style="margin:0 0 14px 0;color:#f8fafc;font-family:monospace;font-size:18px;">{qr_code}</p>
            {f'<img src="cid:{qr_cid}" alt="Access pass QR" width="180" height="180" style="display:block;margin:0 0 14px 0;border-radius:12px;background:#ffffff;padding:10px;" />' if qr_cid else ''}
            <p style="margin:0 0 8px 0;color:#cbd5f5;">Valid until: {valid_to}</p>
            <p style="margin:0;color:#cbd5f5;">Max visits: {max_visits}</p>
          </div>
        </div>
      </body>
    </html>
    """

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM
    message["To"] = visitor_email
    message.set_content(body)
    message.add_alternative(html_body, subtype="html")
    if qr_png and qr_cid and qr_mime:
        html_part = message.get_payload()[-1]
        maintype, subtype = qr_mime.split("/", 1)
        html_part.add_related(qr_png, maintype=maintype, subtype=subtype, cid=qr_cid)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
        logger.info("Access pass sent to %s", visitor_email)
        return True
    except Exception:
        logger.exception("Failed to send access pass to %s", visitor_email)
        return False
