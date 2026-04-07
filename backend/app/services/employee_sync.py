import logging
import os
from pathlib import Path
import requests
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.employee import Employee
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Make sure we don't add multiple handlers on re-imports
if not logger.handlers:
    # Setup log directory to /backend/logs/
    log_dir = Path(os.path.dirname(os.path.abspath(__file__))).parent.parent / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    
    file_handler = logging.FileHandler(log_dir / "employee_sync.log")
    file_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(file_formatter)
    
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(file_formatter)
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

def sync_employees(db: Session) -> None:
    if not settings.THIRD_PARTY_API_DOMAIN:
        logger.error("THIRD_PARTY_API_DOMAIN is not set. Cannot sync employees.")
        return

    api_url = f"{settings.THIRD_PARTY_API_DOMAIN.rstrip('/')}/api/v1/Common/Common/EmployeeInformation"
    payload = {
        "ResourceID": 0,
        "EmpUniqueID": "",
        "IsCurrentEmployee": 1
    }
    
    try:
        response = requests.post(api_url, json=payload, timeout=30)
        response.raise_for_status()
        api_data = response.json()
    except Exception as e:
        logger.error(f"Failed to fetch employees from API: {e}")
        return

    logger.info(f"Total employees fetched from API: {len(api_data)}")

    # Fetch existing from DB
    existing_employees = db.query(Employee).all()
    
    db_employees_by_email = {emp.email: emp for emp in existing_employees if emp.email}
    api_emails = set()
    new_inserts = 0
    default_password_hash = get_password_hash("Employee@123")
    
    for api_emp in api_data:
        email = api_emp.get("Email")
        if not email:
            continue
            
        api_emails.add(email)
        
        if email not in db_employees_by_email:
            phone_raw = api_emp.get("Phone_M")
            phone = None
            if phone_raw:
                digits = "".join(filter(str.isdigit, str(phone_raw)))
                if 10 <= len(digits) <= 15:
                    phone = str(phone_raw)
            
            new_emp = Employee(
                name=api_emp.get("EmployeeName", "Unknown"),
                email=email,
                phone=phone,
                password_hash=default_password_hash,
                role="employee",
                department=api_emp.get("DepartmentName", "General"),
                resource_id=api_emp.get("ResourceID"),
                employee_code=api_emp.get("EmployeeCode"),
                is_current_employee=str(api_emp.get("IsCurrentEmployee")) if api_emp.get("IsCurrentEmployee") is not None else None,
                father_name=api_emp.get("FatherName"),
                mother_name=api_emp.get("MotherName"),
                dob=api_emp.get("DOB"),
                graduation=api_emp.get("Graduation"),
                doj=api_emp.get("DOJ"),
                expected_joining_date=api_emp.get("ExpectedJoiningDate"),
                designation=api_emp.get("Designation"),
                project=api_emp.get("Project"),
                project_lead=api_emp.get("ProjectLead"),
                shift=api_emp.get("Shift")
            )
            db.add(new_emp)
            db_employees_by_email[email] = new_emp
            new_inserts += 1

    removed_count = 0
    protected_ids = {1, 2, 3, 4, 5}
    
    for emp in existing_employees:
        if emp.id in protected_ids:
            continue
        if emp.email and emp.email not in api_emails:
            db.delete(emp)
            removed_count += 1
            
    try:
        db.commit()
        logger.info(f"Number of new employees inserted: {new_inserts}")
        logger.info(f"Number of employees removed: {removed_count}")
    except Exception as e:
        db.rollback()
        logger.error(f"Error while saving synchronized employees: {e}")
