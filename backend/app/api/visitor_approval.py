from datetime import datetime
import anyio
from base64 import b64encode
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.visit import Visit
from app.models.visitor import Visitor
from app.services.notification_service import send_reception_notification
from app.core.config import settings
from app.core.realtime import publish_event

router = APIRouter(tags=["visits-public"])


def build_approval_page(
    status: str,
    visitor_name: str,
    phone: Optional[str],
    company: Optional[str],
    purpose: Optional[str],
    photo_url: Optional[str],
    approve_link: str,
    reject_link: str,
    action_taken: bool,
) -> str:
    base_url = settings.APP_BASE_URL or "http://localhost:8000"
    photo_link = photo_url
    if photo_url and not photo_url.startswith("http"):
        photo_link = f"{base_url}{photo_url}"
    uploads_dir = Path(__file__).resolve().parents[2] / "uploads" / "visitors"
    data_uri = None
    if photo_url and photo_url.startswith("/uploads/visitors/"):
        local_path = uploads_dir / Path(photo_url).name
        if local_path.exists():
            suffix = local_path.suffix.lower()
            mime = "image/jpeg"
            if suffix == ".png":
                mime = "image/png"
            elif suffix == ".webp":
                mime = "image/webp"
            encoded = b64encode(local_path.read_bytes()).decode("ascii")
            data_uri = f"data:{mime};base64,{encoded}"
    default_avatar = (
        "data:image/svg+xml;utf8,"
        "<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'>"
        "<rect width='96' height='96' rx='48' fill='%231e3a5f'/>"
        "<circle cx='48' cy='38' r='18' fill='%2394a3b8'/>"
        "<path d='M20 82c6-16 22-24 28-24s22 8 28 24' fill='%2394a3b8'/>"
        "</svg>"
    )
    photo_src = data_uri or photo_link or default_avatar
    status_label = "Approved" if status == "approved" else "Rejected" if status == "rejected" else "Pending"
    status_color = "#22c55e" if status == "approved" else "#ef4444" if status == "rejected" else "#f59e0b"
    disabled_style = "opacity:0.6;pointer-events:none;" if action_taken else ""

    return f"""
    <html>
      <body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
        <div style="max-width:620px;margin:24px auto;background:#0b2239;border-radius:18px;padding:24px;color:#e2e8f0;">
          <h2 style="margin:0 0 18px 0;color:#ffffff;font-size:20px;">Visitor approval</h2>
          <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;background:#102a43;border-radius:14px;padding:18px;">
            <img src="{photo_src}" alt="Visitor photo" width="80" height="80" style="border-radius:40px;border:1px solid #1e3a5f;object-fit:cover;background:#1e293b;" />
            <div style="flex:1 1 260px;">
              <p style="margin:0 0 6px 0;color:#ffffff;font-size:18px;font-weight:700;">{visitor_name}</p>
              <p style="margin:0 0 6px 0;color:#cbd5f5;font-size:14px;">📞 {phone or "N/A"}</p>
              <p style="margin:0 0 6px 0;color:#cbd5f5;font-size:14px;">🏢 {company or "N/A"}</p>
              <p style="margin:0;color:#cbd5f5;font-size:14px;">📝 {purpose or "N/A"}</p>
            </div>
            <span style="background:{status_color};color:#0b1220;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;">
              {status_label}
            </span>
          </div>
          <div style="margin-top:18px;display:flex;gap:12px;flex-wrap:wrap;">
            <a href="{approve_link}" style="background:#22c55e;color:#0b1220;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;{disabled_style}">Accept</a>
            <a href="{reject_link}" style="background:#ef4444;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;{disabled_style}">Reject</a>
          </div>
          <p style="margin-top:14px;color:#94a3b8;font-size:12px;">
            { "Action recorded. This link works only once." if action_taken else "Click Accept or Reject to respond." }
          </p>
        </div>
      </body>
    </html>
    """


@router.get("/visits/{visit_id}/approve", response_class=HTMLResponse)
def approve_visit(
    visit_id: int,
    token: str,
    db: Session = Depends(get_db),
):
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Invalid or expired approval link.")
    if visit.approval_token != token:
        raise HTTPException(status_code=404, detail="Invalid or expired approval link.")
    if visit.status in {"approved", "rejected"}:
        visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
        base_url = settings.APP_BASE_URL or "http://localhost:8000"
        approve_link = f"{base_url}/visits/{visit_id}/approve?token={token}"
        reject_link = f"{base_url}/visits/{visit_id}/reject?token={token}"
        return HTMLResponse(
            build_approval_page(
                visit.status,
                visitor.name if visitor else "Visitor",
                visitor.phone if visitor else None,
                visitor.company if visitor else None,
                visit.purpose,
                visitor.photo_url if visitor else None,
                approve_link,
                reject_link,
                True,
            )
        )

    visit.status = "approved"
    visit.approved_at = datetime.utcnow()
    db.commit()

    visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
    if visitor:
        visitor.status = "approved"
        db.commit()
        if settings.RECEPTION_EMAIL:
            send_reception_notification(settings.RECEPTION_EMAIL, visitor.name, "approved")
    anyio.from_thread.run(
        publish_event,
        {"type": "visit_status", "visit_id": visit.id, "status": "approved", "visitor_id": visit.visitor_id},
    )

    base_url = settings.APP_BASE_URL or "http://localhost:8000"
    approve_link = f"{base_url}/visits/{visit_id}/approve?token={token}"
    reject_link = f"{base_url}/visits/{visit_id}/reject?token={token}"
    return HTMLResponse(
        build_approval_page(
            "approved",
            visitor.name if visitor else "Visitor",
            visitor.phone if visitor else None,
            visitor.company if visitor else None,
            visit.purpose,
            visitor.photo_url if visitor else None,
            approve_link,
            reject_link,
            True,
        )
    )


@router.get("/visits/{visit_id}/reject", response_class=HTMLResponse)
def reject_visit(
    visit_id: int,
    token: str,
    db: Session = Depends(get_db),
):
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Invalid or expired approval link.")
    if visit.approval_token != token:
        raise HTTPException(status_code=404, detail="Invalid or expired approval link.")
    if visit.status in {"approved", "rejected"}:
        visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
        base_url = settings.APP_BASE_URL or "http://localhost:8000"
        approve_link = f"{base_url}/visits/{visit_id}/approve?token={token}"
        reject_link = f"{base_url}/visits/{visit_id}/reject?token={token}"
        return HTMLResponse(
            build_approval_page(
                visit.status,
                visitor.name if visitor else "Visitor",
                visitor.phone if visitor else None,
                visitor.company if visitor else None,
                visit.purpose,
                visitor.photo_url if visitor else None,
                approve_link,
                reject_link,
                True,
            )
        )

    visit.status = "rejected"
    visit.rejected_at = datetime.utcnow()
    db.commit()

    visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
    if visitor:
        visitor.status = "rejected"
        db.commit()
        if settings.RECEPTION_EMAIL:
            send_reception_notification(settings.RECEPTION_EMAIL, visitor.name, "rejected")
    anyio.from_thread.run(
        publish_event,
        {"type": "visit_status", "visit_id": visit.id, "status": "rejected", "visitor_id": visit.visitor_id},
    )

    base_url = settings.APP_BASE_URL or "http://localhost:8000"
    approve_link = f"{base_url}/visits/{visit_id}/approve?token={token}"
    reject_link = f"{base_url}/visits/{visit_id}/reject?token={token}"
    return HTMLResponse(
        build_approval_page(
            "rejected",
            visitor.name if visitor else "Visitor",
            visitor.phone if visitor else None,
            visitor.company if visitor else None,
            visit.purpose,
            visitor.photo_url if visitor else None,
            approve_link,
            reject_link,
            True,
        )
    )
