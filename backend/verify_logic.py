import sys
import os
from datetime import datetime, timezone, timedelta

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.db import SessionLocal
from app.models.access_pass import VisitorAccessPass
from app.models.visit import Visit
from app.models.visitor import Visitor
from app.services.visit_service import checkout_visit, get_employee_access_passes
from app.schemas.visit import VisitCheckout

def verify():
    db = SessionLocal()
    try:
        # 1. Create a dummy access pass that IS older than 'now' but has visits remaining
        past_time = datetime.now(timezone.utc) - timedelta(days=1)
        qr_code = "TEST-EXPIRY-LOGIC"
        
        # Cleanup existing
        db.query(VisitorAccessPass).filter(VisitorAccessPass.qr_code == qr_code).delete()
        db.query(Visit).filter(Visit.qr_code == qr_code).delete()
        db.query(Visitor).filter(Visitor.name == "LOGIC-TEST-VISITOR").delete()
        db.commit()

        visitor = Visitor(
            name="LOGIC-TEST-VISITOR",
            phone="0000000000",
            email="logic-test@test.com",
            visitor_type="recurring"
        )
        db.add(visitor)
        db.commit()
        db.refresh(visitor)

        access_pass = VisitorAccessPass(
            visitor_id=visitor.id,
            host_employee_id=1, # Assume employee 1 exists
            purpose="Testing",
            valid_from=past_time - timedelta(hours=1),
            valid_to=past_time,
            max_visits=10,
            remaining_visits=10,
            qr_code=qr_code
        )
        db.add(access_pass)
        db.commit()
        db.refresh(access_pass)

        print(f"Pass created: qr_code={qr_code}, valid_to={access_pass.valid_to}, remaining={access_pass.remaining_visits}")

        # Check status from get_employee_access_passes
        passes = get_employee_access_passes(db, 1)
        test_pass = next((p for p in passes if p.qr_code == qr_code), None)
        if test_pass:
            print(f"Pass status (should be active): {test_pass.status}")
            if test_pass.status != "active":
                print("FAILURE: Pass should be active despite being past valid_to")
        else:
            print("FAILURE: Pass not found in history")

        # 2. Simulate a visit and checkout
        visit = Visit(
            visitor_id=visitor.id,
            host_employee_id=1,
            purpose="Recurring visitor access",
            checkin_time=datetime.now(timezone.utc),
            status="checked_in",
            qr_code=qr_code,
            source="access_pass"
        )
        db.add(visit)
        db.commit()
        db.refresh(visit)

        print(f"Visit created: id={visit.id}, status={visit.status}")

        # Checkout
        checkout_visit(db, VisitCheckout(visitor_id=visitor.id))
        
        # Verify pass is now expired
        db.refresh(access_pass)
        print(f"Pass after checkout: remaining={access_pass.remaining_visits}")
        
        passes_after = get_employee_access_passes(db, 1)
        test_pass_after = next((p for p in passes_after if p.qr_code == qr_code), None)
        if test_pass_after:
            print(f"Pass status after checkout (should be expired): {test_pass_after.status}")
            if test_pass_after.status != "expired":
                print("FAILURE: Pass should be expired after checkout")
        
        # Cleanup
        db.delete(visit)
        db.delete(access_pass)
        db.commit()
        print("Verification complete and cleaned up.")

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    verify()
