import sys
import os

# Add the parent directory to sys.path to allow importing from 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.db import SessionLocal
from app.services.employee_sync import sync_employees

def main():
    print("Starting employee synchronization...")
    db = SessionLocal()
    try:
        sync_employees(db)
        print("Synchronization completed successfully.")
    except Exception as e:
        print(f"An error occurred during synchronization: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
