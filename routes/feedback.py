"""
Feedback Routes - MongoDB Version (Async)
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
import shutil
import uuid
from pathlib import Path

from models.feedback import FeedbackTextCreate, FeedbackResponse
from handlers.feedback import handle_text_feedback, handle_audio_feedback
from handlers.event import get_event_by_token

router = APIRouter(prefix="/feedback", tags=["Public Feedback"])

UPLOAD_DIR = Path("uploads/audio")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/{public_token}")
async def resolve_event(public_token: str):
    """Get event details by public token."""
    event = await get_event_by_token(public_token)
    
    return {
        "event_id": str(event.id),
        "title": event.title,
        "description": event.description
    }


@router.post("/{public_token}/text", response_model=FeedbackResponse)
async def submit_text_feedback(
    public_token: str,
    payload: FeedbackTextCreate
):
    """
    Submit text feedback for an event.
    
    Returns feedback confirmation with ID.
    Sentiment analysis happens during report generation.
    """
    feedback = await handle_text_feedback(public_token, payload.text)

    return {
        "id": str(feedback.id),
        "sentiment": None,  # Will be filled by LLM during analysis pipeline
        "confidence": None,
        "decision": "accepted"  # All feedback accepted, classification happens during report generation
    }


@router.post("/{public_token}/audio", response_model=FeedbackResponse)
async def submit_audio_feedback(
    public_token: str,
    file: UploadFile = File(...)
):
    """
    Submit audio feedback for an event.
    
    Audio is transcribed and validated before storage.
    Returns feedback confirmation with ID.
    """
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
    
    # Save audio file
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

    # Process audio feedback (transcribe + validate + store)
    feedback = await handle_audio_feedback(public_token, str(file_path))

    return {
        "id": str(feedback.id),
        "sentiment": None,  # Will be filled by LLM during analysis pipeline
        "confidence": None,
        "decision": "accepted"  # All feedback accepted, classification happens during report generation
    }
