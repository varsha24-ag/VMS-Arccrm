import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import zoneinfo

from app.core.db import SessionLocal
from app.services.visit_service import auto_checkout_expired_qr_invites, log_pending_visits_attendance
from app.services.employee_sync import sync_employees

# Set up logging for this module
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone="UTC")

def run_expired_invite_auto_checkout() -> None:
    logger.info("Scheduler TASK: Starting auto-checkout for expired QR invites.")
    db = SessionLocal()
    try:
        auto_checkout_expired_qr_invites(db)
        logger.info("Scheduler TASK: Auto-checkout completed successfully.")
    except Exception as e:
        logger.error(f"Scheduler TASK ERROR: Auto-checkout failed: {e}")
    finally:
        db.close()

def run_pending_visits_attendance_log() -> None:
    logger.info("Scheduler TASK: Starting daily attendance log update (6:00 PM).")
    db = SessionLocal()
    try:
        log_pending_visits_attendance(db)
        logger.info("Scheduler TASK: Attendance log update completed successfully.")
    except Exception as e:
        logger.error(f"Scheduler TASK ERROR: Attendance log update failed: {e}")
    finally:
        db.close()

def run_employee_sync() -> None:
    logger.info("Scheduler TASK: Starting daily employee sync (10:30 AM).")
    db = SessionLocal()
    try:
        sync_employees(db)
        logger.info("Scheduler TASK: Employee sync completed successfully.")
    except Exception as e:
        logger.error(f"Scheduler TASK ERROR: Employee sync failed: {e}")
    finally:
        db.close()

def start_scheduler() -> None:
    if scheduler.running:
        logger.warning("Scheduler: Attempted to start scheduler, but it is already running.")
        return
    
    logger.info("Scheduler: Initializing background jobs...")
    
    # 1. Interval job every 5 minutes
    scheduler.add_job(
        run_expired_invite_auto_checkout,
        trigger="interval",
        minutes=5,
        id="auto_checkout_expired_qr_invites",
        replace_existing=True,
    )
    
    tz = zoneinfo.ZoneInfo("Asia/Kolkata")
    
    # 2. Daily Employee Sync at 10:30 AM IST
    scheduler.add_job(
        run_employee_sync,
        trigger=CronTrigger(hour=10, minute=30, timezone=tz),
        id="sync_employees_daily",
        replace_existing=True,
    )

    # 3. Daily Attendance Log at 6:00 PM IST
    scheduler.add_job(
        run_pending_visits_attendance_log,
        trigger=CronTrigger(hour=18, minute=0, timezone=tz),
        id="log_pending_attendance_daily",
        replace_existing=True,
    )
    
    scheduler.start()
    logger.info("Scheduler: Successfully started background scheduler.")

def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler: Background scheduler has been shut down.")
