from db.db import SessionDep,engine,create_db_and_tables
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from routes.health import router as health_router
from routes.speaker import router as speaker_router
from routes.event import router as event_router
from routes.feedback import router as feedback_router
from routes.login import router as login_router
from routes.analytics import router as analytics_router

app = FastAPI(title="Intelligent Feedback System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.include_router(health_router)
app.include_router(speaker_router)
app.include_router(event_router)
app.include_router(login_router)
app.include_router(feedback_router)
app.include_router(analytics_router)