import sys
import os

# Add the current directory to the path so we can import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.core.db import SessionLocal
from app.services.employee_sync import sync_employees

def main():
    print("Starting manual employee sync...")
    db = SessionLocal()
    try:
        sync_employees(db)
        print("Employee sync completed successfully.")
    except Exception as e:
        print(f"Error during employee sync: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
