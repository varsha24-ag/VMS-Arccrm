from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.api.auth import router as auth_router
from app.api.admin import router as admin_router
from app.api.employees import router as employees_router
from app.api.visitor_approval import router as visitor_approval_router
from app.api.visitors import router as visitors_router
from app.core.config import settings
from app.core.init_db import bootstrap_database

app = FastAPI(title="VMS ARC CRM Auth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(employees_router)
app.include_router(visitor_approval_router)
app.include_router(visitors_router)

uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
visitors_dir = uploads_dir / "visitors"
visitors_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


@app.on_event("startup")
def initialize_database() -> None:
    if settings.INIT_DB_ON_STARTUP:
        bootstrap_database()


@app.get("/health")
def health_check():
    return {"status": "ok"}
