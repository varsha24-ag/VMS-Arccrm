## FastAPI backend bootstrap

### 1. Create virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
```

Update `.env` values for your ARC CRM PostgreSQL database and JWT secret.

### 4. Run API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8005
```

or

```bash
python run.py
```

### 4.1 Initialize tables + seed data

On first run, keep `INIT_DB_ON_STARTUP=true` in `.env`. This creates tables and seeds default users.

You can also run it manually:

```bash
python -m app.core.init_db
```

### 5. Test login endpoint

`POST /auth/login`

```json
{
  "identifier": "name@company.com",
  "password": "your_password"
}
```

### Notes

- Creates/uses `employees` table (`id`, `name`, `email`, `phone`, `password_hash`, `role`, `department`).
- Creates `visitors` table (`id`, `full_name`, `email`, `phone`, `host_employee_id`, `status`, `check_in_at`, `check_out_at`).
- Token validity is 24 hours by default.
- Protected endpoints require `Authorization: Bearer <token>`.
- Seed login users:
  - `reception@arccrm.local` / `Reception@123` (role: receptionist)
  - `employee@arccrm.local` / `Employee@123` (role: employee)
