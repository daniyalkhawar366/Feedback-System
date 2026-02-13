import json
from datetime import datetime
from sqlmodel import Session, select
from fastapi import HTTPException, status

from db.model import Feedback, FeedbackAnalysis, Event
from handlers.event import get_event_by_token
from speech_to_text import transcribe_audio
from text_validation import validate_text_feedback, is_valid_feedback


def check_feedback_window(event: Event):
    """
    Validate that feedback can be accepted for this event.
    
    Args:
        event: Event object
        
    Raises:
        HTTPException if feedback window is not open
    """
    now = datetime.utcnow()
    
    # If no feedback window is set, allow feedback (backward compatibility)
    if not event.feedback_open_at or not event.feedback_close_at:
        return
    
    if now < event.feedback_open_at:
        # Format datetime in a readable way
        open_time = event.feedback_open_at.strftime("%B %d, %Y at %I:%M %p UTC")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Feedback window has not opened yet. Opens at {open_time}"
        )
    
    if now > event.feedback_close_at:
        # Format datetime in a readable way
        close_time = event.feedback_close_at.strftime("%B %d, %Y at %I:%M %p UTC")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Feedback window has closed. It closed on {close_time}"
        )


def handle_text_feedback(
    session: Session,
    public_token: str,
    text: str
):
    """
    Handle text feedback submission with validation
    
    Args:
        session: Database session
        public_token: Event's public token
        text: Raw feedback text
        
    Returns:
        (feedback, analysis) tuple or raises HTTPException if invalid
    """
    event = get_event_by_token(session, public_token)
    
    # Check if feedback window is open
    check_feedback_window(event)

    # --- Validate text input ---
    validation_result = validate_text_feedback(text)
    
    # Only reject if text is too short or too long
    if validation_result["decision"] == "REJECT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation_result.get("reason", "Text validation failed")
        )

    # --- Store feedback ---
    # Use clean_text (censored version) for storage
    feedback = Feedback(
        event_id=event.id,
        input_type="text",
        raw_text=text,
        normalized_text=validation_result["clean_text"],
        quality_decision=validation_result["decision"],  # "ACCEPT" or "FLAG"
        quality_flags=json.dumps(validation_result["flags"]) if validation_result["flags"] else None
    )

    session.add(feedback)
    session.commit()
    session.refresh(feedback)

    # Note: Dimension extraction happens during report generation (batch processing)
    # to avoid making 100 LLM calls for 100 individual feedbacks
    return feedback


def handle_audio_feedback(
    session: Session,
    public_token: str,
    audio_path: str
):
    """
    Handle audio feedback submission with transcription and validation
    
    Args:
        session: Database session
        public_token: Event's public token
        audio_path: Path to audio file
        
    Returns:
        feedback object or raises HTTPException if invalid
    """
    event = get_event_by_token(session, public_token)
    
    # Check if feedback window is open
    check_feedback_window(event)

    # Step 1: Transcribe audio (audio-specific validation)
    transcription_result = transcribe_audio(audio_path)

    if not transcription_result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid audio: {transcription_result.get('reason', 'Unknown error')}"
        )

    raw_text = transcription_result["raw_text"]
    
    # Step 2: Validate transcribed text (same as text feedback)
    validation_result = validate_text_feedback(raw_text)
    
    # Only reject if text is too short or too long
    if validation_result["decision"] == "REJECT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation_result.get("reason", "Text validation failed")
        )

    # Step 3: Store feedback with censored text
    feedback = Feedback(
        event_id=event.id,
        input_type="audio",
        raw_text=raw_text,
        normalized_text=validation_result["clean_text"],
        audio_path=audio_path,
        audio_duration_sec=transcription_result.get("audio_duration"),
        language=transcription_result.get("language"),
        quality_decision=validation_result["decision"],  # "ACCEPT" or "FLAG"
        quality_flags=json.dumps(validation_result["flags"]) if validation_result["flags"] else None
    )

    session.add(feedback)
    session.commit()
    session.refresh(feedback)

    # Note: Dimension extraction happens during report generation (batch processing)
    # to avoid making 100 LLM calls for 100 individual feedbacks
    return feedback


def list_event_feedback(session: Session, event_id: int):
    """
    List all feedback for an event with sentiment analysis
    
    Args:
        session: Database session
        event_id: Event ID
        
    Returns:
        List of feedback dictionaries with sentiment and quality metrics
    """
    statement = (
        select(
            Feedback.id,
            Feedback.event_id,
            Feedback.input_type,
            Feedback.raw_text,
            Feedback.normalized_text,
            Feedback.audio_path,
            Feedback.quality_decision,
            Feedback.quality_flags,
            Feedback.created_at,
            FeedbackAnalysis.sentiment,
            FeedbackAnalysis.confidence,
        )
        .outerjoin(
            FeedbackAnalysis,
            FeedbackAnalysis.feedback_id == Feedback.id
        )
        .where(Feedback.event_id == event_id)
        .order_by(Feedback.created_at.desc())
    )

    results = session.exec(statement).all()

    return [
        {
            "id": row.id,
            "event_id": row.event_id,
            "input_type": row.input_type,
            "raw_text": row.raw_text,
            "normalized_text": row.normalized_text,
            "audio_path": f"http://localhost:8000/{row.audio_path}" if row.audio_path else None,
            "quality_decision": row.quality_decision,
            "quality_flags": row.quality_flags,
            "sentiment": row.sentiment,
            "confidence": row.confidence,
            "created_at": row.created_at,
        }
        for row in results
    ]


def get_feedback_detail(session: Session, feedback_id: int, event_id: int):
    """
    Get detailed information about a specific feedback entry
    
    Args:
        session: Database session
        feedback_id: Feedback ID
        event_id: Event ID (for authorization)
        
    Returns:
        Detailed feedback dictionary or None
    """
    statement = (
        select(
            Feedback.id,
            Feedback.event_id,
            Feedback.input_type,
            Feedback.raw_text,
            Feedback.normalized_text,
            Feedback.audio_path,
            Feedback.created_at,
            FeedbackAnalysis.sentiment,
            FeedbackAnalysis.confidence,
            FeedbackAnalysis.intent,
        )
        .join(
            FeedbackAnalysis,
            FeedbackAnalysis.feedback_id == Feedback.id
        )
        .where(
            (Feedback.id == feedback_id) & 
            (Feedback.event_id == event_id)
        )
    )

    result = session.exec(statement).first()

    if not result:
        return None

    # Convert local file path to URL path
    audio_url = None
    if result.audio_path:
        # Convert "uploads/audio/file.webm" to "http://localhost:8000/uploads/audio/file.webm"
        audio_url = f"http://localhost:8000/{result.audio_path}"
    
    return {
        "id": result.id,
        "event_id": result.event_id,
        "input_type": result.input_type,
        "raw_text": result.raw_text,
        "normalized_text": result.normalized_text,
        "audio_path": audio_url,
        "sentiment": result.sentiment,
        "confidence": result.confidence,
        "intent": result.intent,
        "created_at": result.created_at,
    }


def delete_feedback(session: Session, feedback_id: int, event_id: int) -> bool:
    """
    Delete feedback entry and associated analysis
    
    Args:
        session: Database session
        feedback_id: Feedback ID
        event_id: Event ID (for authorization)
        
    Returns:
        True if deleted, False if not found
    """
    # Get feedback
    feedback = session.exec(
        select(Feedback).where(
            (Feedback.id == feedback_id) & 
            (Feedback.event_id == event_id)
        )
    ).first()

    if not feedback:
        return False

    # Delete associated analysis
    session.exec(
        select(FeedbackAnalysis).where(
            FeedbackAnalysis.feedback_id == feedback_id
        )
    ).delete()

    # Delete feedback
    session.delete(feedback)
    session.commit()

    return True