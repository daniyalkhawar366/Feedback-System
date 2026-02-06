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
    feedback = handle_text_feedback(
        session,
        public_token,
        payload.text
    )

    # Return feedback confirmation (sentiment will be analyzed by LLM later)
    return {
        "id": feedback.id,
        "sentiment": None,  # Will be filled by LLM during analysis pipeline
        "confidence": None,
        "decision": feedback.quality_decision
    }


@router.post("/{public_token}/audio", response_model=FeedbackResponse)
def submit_audio_feedback(
    session: SessionDep,
    public_token: str,
    file: UploadFile = File(...)
):
    from fastapi import HTTPException
    
    # Validate file type
    if not file.filename or not file.filename.endswith(('.webm', '.wav', '.mp3', '.m4a')):
        raise HTTPException(
            status_code=400,
            detail="Invalid audio format. Supported: .webm, .wav, .mp3, .m4a"
        )
    
    # Validate file size (max 10MB)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to start
    
    if file_size > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size: 10MB"
        )
    
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = UPLOAD_DIR / filename

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save audio file: {str(e)}"
        )

    feedback = handle_audio_feedback(
        session,
        public_token,
        str(file_path)
    )

    # Return feedback confirmation (sentiment will be analyzed by LLM later)
    return {
        "id": feedback.id,
        "sentiment": None,  # Will be filled by LLM during analysis pipeline
        "confidence": None,
        "decision": feedback.quality_decision
    }
