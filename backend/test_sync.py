import logging
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

from app.core.scheduler import run_employee_sync

if __name__ == "__main__":
    print("--- Starting manual synchronization demonstration ---")
    run_employee_sync()
    print("--- Employee synchronization completed ---")
