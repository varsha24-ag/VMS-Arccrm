from app.core.config import Settings
try:
    s = Settings()
    print("Settings initialized successfully")
    print(f"EMPLOYEE_API_URL: {s.EMPLOYEE_API_URL}")
    print(f"EMPLOYEE_APP_ID: {s.EMPLOYEE_APP_ID}")
except Exception as e:
    print(f"Failed to initialize settings: {e}")
