from fastapi import APIRouter, Depends
from db.db import SessionDep

from handlers.event import get_event_by_token

from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlmodel import Session
import shutil
import uuid
from pathlib import Path

from models.feedback import FeedbackTextCreate, FeedbackResponse
from handlers.feedback import (
    handle_text_feedback,
    handle_audio_feedback
)

router = APIRouter(prefix="/feedback", tags=["Public Feedback"])

UPLOAD_DIR = Path("uploads/audio")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


router = APIRouter(prefix="/feedback", tags=["Public Feedback"])

@router.get("/{public_token}")
def resolve_event(public_token: str, session: SessionDep):
    event = get_event_by_token(session, public_token)
    return {
        "event_id": event.id,
        "title": event.title,
        "description": event.description
    }


@router.post("/{public_token}/text", response_model=FeedbackResponse)
def submit_text_feedback(
    public_token: str,
    payload: FeedbackTextCreate,
    session: SessionDep
):
    feedback, analysis = handle_text_feedback(
        session,
        public_token,
        payload.text
    )

    return {
        "id": feedback.id,
        "sentiment": analysis.sentiment,
        "confidence": analysis.confidence,
        "decision": feedback.quality_decision
    }


@router.post("/{public_token}/audio", response_model=FeedbackResponse)
def submit_audio_feedback(
    session:SessionDep,
    public_token: str,
    file: UploadFile = File(...)
):
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = UPLOAD_DIR / filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    feedback, analysis = handle_audio_feedback(
        session,
        public_token,
        str(file_path)
    )

    return {
        "id": feedback.id,
        "sentiment": analysis.sentiment,
        "confidence": analysis.confidence,
        "decision": feedback.quality_decision
    }
