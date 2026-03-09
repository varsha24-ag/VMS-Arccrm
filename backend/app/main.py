from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.visitors import router as visitors_router
from app.core.config import settings
from app.core.init_db import bootstrap_database

app = FastAPI(title="VMS ARC CRM Auth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(visitors_router)


@app.on_event("startup")
def initialize_database() -> None:
    if settings.INIT_DB_ON_STARTUP:
        bootstrap_database()


@app.get("/health")
def health_check():
    return {"status": "ok"}
