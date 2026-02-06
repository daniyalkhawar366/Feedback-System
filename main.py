from db.db import SessionDep,engine,create_db_and_tables
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os
from routes.health import router as health_router
from routes.speaker import router as speaker_router
from routes.event import router as event_router
from routes.feedback import router as feedback_router
from routes.login import router as login_router
from routes.analytics import router as analytics_router
from routes.reports import router as reports_router

# Validate required environment variables
required_env_vars = ["DATABASE_URL", "SECRET_KEY"]
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    raise RuntimeError(
        f"Missing required environment variables: {', '.join(missing_vars)}\n"
        f"Please check your .env file."
    )

app = FastAPI(title="Intelligent Feedback System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    # Ensure uploads directory exists
    Path("uploads/audio").mkdir(parents=True, exist_ok=True)

app.include_router(health_router)
app.include_router(speaker_router)
app.include_router(event_router)
app.include_router(login_router)
app.include_router(feedback_router)
app.include_router(analytics_router)
app.include_router(reports_router)

# Mount static files for audio uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")