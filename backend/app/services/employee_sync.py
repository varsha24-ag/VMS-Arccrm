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
    payload = {}
    
    try:
        response = requests.post(api_url, json=payload, timeout=300)
        response.raise_for_status()
        api_data = response.json()
    except Exception as e:
        logger.error(f"Failed to fetch employees from API: {e}")
        return

    logger.info(f"Total employees fetched from API: {len(api_data)}")

    # Fetch existing from DB
    existing_employees = db.query(Employee).all()
    
    db_emp_by_rid = {emp.resource_id: emp for emp in existing_employees if emp.resource_id}
    db_emp_by_email = {emp.email.lower(): emp for emp in existing_employees if emp.email}
    db_emp_by_phone = {emp.phone: emp for emp in existing_employees if emp.phone}
    
    api_rids = set()
    processed_emails = set()
    processed_phones = set()
    new_inserts = 0
    updated_count = 0
    default_password_hash = get_password_hash("Employee@123")
    
    for api_emp in api_data:
        # Filter for current employees only
        is_current = api_emp.get("IsCurrentEmployee")
        if not is_current or str(is_current).lower() not in ["true", "1", "yes"]:
            continue
            
        rid = api_emp.get("ResourceID")
        email_raw = api_emp.get("Email")
        email = email_raw.strip().lower() if email_raw and email_raw.strip() else None
        
        if not rid and not email:
            continue
            
        if rid:
            if rid in api_rids:
                continue
            api_rids.add(rid)
            
        if email:
            if email in processed_emails:
                continue
            processed_emails.add(email)
            
        phone_raw = api_emp.get("Phone_M")
        phone = None
        if phone_raw:
            digits = "".join(filter(str.isdigit, str(phone_raw)))
            if 10 <= len(digits) <= 15:
                phone = str(phone_raw)
                if phone in processed_phones:
                    phone = None # Avoid duplicate phone in the same batch
                else:
                    processed_phones.add(phone)
                
        # Determine role from Role field or PersonRole field
        api_role_val = str(api_emp.get("Role") or api_emp.get("PersonRole") or "").lower()
        if "superadmin" in api_role_val:
            target_role = "superadmin"
        else:
            target_role = "employee"
                
        # Find existing employee safely
        match = None
        if rid and rid in db_emp_by_rid:
            match = db_emp_by_rid[rid]
        elif email and email in db_emp_by_email:
            match = db_emp_by_email[email]
        elif phone and phone in db_emp_by_phone:
            match = db_emp_by_phone[phone]
            
        if match:
            # Check collisions on phone or email with ANOTHER user logic
            if phone and match.phone != phone and phone in db_emp_by_phone:
                phone = None # Avoid unique constraint collision
            if email and (match.email or "").lower() != email and email in db_emp_by_email:
                email = None
                
            match.name = api_emp.get("EmployeeName", match.name)
            if email: match.email = email
            if phone: match.phone = phone
            match.department = api_emp.get("DepartmentName", match.department)
            match.resource_id = rid or match.resource_id
            match.employee_code = api_emp.get("EmployeeCode", match.employee_code)
            match.is_current_employee = str(api_emp.get("IsCurrentEmployee")) if api_emp.get("IsCurrentEmployee") is not None else match.is_current_employee
            match.father_name = api_emp.get("FatherName", match.father_name)
            match.mother_name = api_emp.get("MotherName", match.mother_name)
            match.dob = api_emp.get("DOB", match.dob)
            match.graduation = api_emp.get("Graduation", match.graduation)
            match.doj = api_emp.get("DOJ", match.doj)
            match.expected_joining_date = api_emp.get("ExpectedJoiningDate", match.expected_joining_date)
            match.designation = api_emp.get("Designation", match.designation)
            match.project = api_emp.get("Project", match.project)
            match.project_lead = api_emp.get("ProjectLead", match.project_lead)
            match.shift = api_emp.get("Shift", match.shift)
            match.role = target_role
            
            # Re-register local maps
            if match.resource_id: db_emp_by_rid[match.resource_id] = match
            if match.email: db_emp_by_email[match.email.lower()] = match
            if match.phone: db_emp_by_phone[match.phone] = match
            
            updated_count += 1
        else:
            if phone and phone in db_emp_by_phone:
                phone = None
            if email and email in db_emp_by_email:
                continue # Edge case, totally skip
                
            new_emp = Employee(
                name=api_emp.get("EmployeeName", "Unknown"),
                email=email,
                phone=phone,
                password_hash=default_password_hash,
                role=target_role,
                department=api_emp.get("DepartmentName", "General"),
                resource_id=rid,
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
            if rid: db_emp_by_rid[rid] = new_emp
            if email: db_emp_by_email[email] = new_emp
            if phone: db_emp_by_phone[phone] = new_emp
            new_inserts += 1

    removed_count = 0
    protected_ids = {1, 2, 3, 4, 5}
    
    for emp in existing_employees:
        if emp.id in protected_ids:
            continue
        if emp.resource_id and emp.resource_id not in api_rids:
            db.delete(emp)
            removed_count += 1
            
    try:
        db.commit()
        logger.info(f"Number of updated employees: {updated_count}")
        logger.info(f"Number of new employees inserted: {new_inserts}")
        logger.info(f"Number of employees removed: {removed_count}")
    except Exception as e:
        db.rollback()
        logger.error(f"Error while saving synchronized employees: {e}")
