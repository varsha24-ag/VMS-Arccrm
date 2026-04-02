from apscheduler.schedulers.background import BackgroundScheduler

from app.core.db import SessionLocal
from app.services.visit_service import auto_checkout_expired_qr_invites


scheduler = BackgroundScheduler(timezone="UTC")


def run_expired_invite_auto_checkout() -> None:
    db = SessionLocal()
    try:
        auto_checkout_expired_qr_invites(db)
    finally:
        db.close()


def start_scheduler() -> None:
    if scheduler.running:
        return
    scheduler.add_job(
        run_expired_invite_auto_checkout,
        trigger="interval",
        minutes=5,
        id="auto_checkout_expired_qr_invites",
        replace_existing=True,
    )
    scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
