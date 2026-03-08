from dotenv import load_dotenv
import os

# Load environment variables first
load_dotenv()

# MongoDB connection (production)
from db.mongodb import connect_to_mongo, close_mongo_connection

# SQLite imports only for development/migration (not needed in production)
if os.getenv("ENVIRONMENT") != "production" and not os.getenv("RAILWAY_ENVIRONMENT"):
    try:
        from db.db import SessionDep, engine, create_db_and_tables
    except ImportError:
        # SQLModel not installed (production environment)
        pass

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from routes.health import router as health_router
from routes.speaker import router as speaker_router
from routes.event import router as event_router
from routes.feedback import router as feedback_router
from routes.login import router as login_router
from routes.analytics import router as analytics_router
from routes.reports import router as reports_router
from routes.monitoring import router as monitoring_router

# Validate required environment variables
required_env_vars = ["MONGODB_URL", "SECRET_KEY", "OPENAI_API_KEY"]
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    raise RuntimeError(
        f"Missing required environment variables: {', '.join(missing_vars)}\n"
        f"Please check your .env file."
    )

app = FastAPI(title="Intelligent Feedback System")

# CORS Configuration
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    frontend_url,
]

# Create a regex to allow Vercel previews (safe way to handle wildcards)
# This will match something like https://feedback-system-abcde.vercel.app
origin_regex = None
if "vercel.app" in frontend_url:
    # Escape the dot and use a wildcard before .vercel.app
    import re
    origin_regex = r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    """Initialize MongoDB connection and create upload directories"""
    await connect_to_mongo()
    # Ensure uploads directory exists
    Path("uploads/audio").mkdir(parents=True, exist_ok=True)


@app.on_event("shutdown")
async def on_shutdown():
    """Close MongoDB connection gracefully"""
    await close_mongo_connection()

app.include_router(health_router)
app.include_router(speaker_router)
app.include_router(event_router)
app.include_router(login_router)
app.include_router(feedback_router)
app.include_router(analytics_router)
app.include_router(reports_router)
app.include_router(monitoring_router)

# Mount static files for audio uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")