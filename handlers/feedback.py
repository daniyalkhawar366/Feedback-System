import json
from sqlmodel import Session, select
from fastapi import HTTPException, status

from db.model import Feedback, FeedbackAnalysis
from handlers.event import get_event_by_token
from speech_to_text import transcribe_and_validate
from text_validation import validate_text_feedback, is_valid_feedback
from sentiment_classification import classify_feedback


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

    # --- Validate text input ---
    validation_result = validate_text_feedback(text)
    
    if validation_result["decision"] == "REJECT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation_result.get("reason", "Text validation failed")
        )

    # --- Classify sentiment ---
    sentiment_result = classify_feedback(text)

    # --- Store feedback ---
    feedback = Feedback(
        event_id=event.id,
        input_type="text",
        raw_text=text,
        normalized_text=validation_result["clean_text"],
        quality_decision=validation_result["decision"],
        quality_flags=json.dumps(validation_result.get("flags", []))
    )

    session.add(feedback)
    session.commit()
    session.refresh(feedback)

    # --- Store analysis ---
    analysis = FeedbackAnalysis(
        feedback_id=feedback.id,
        sentiment=sentiment_result["sentiment"],
        confidence=sentiment_result["confidence"],
        margin=sentiment_result.get("margin"),
        model_name="cardiffnlp/twitter-roberta-base-sentiment"
    )

    session.add(analysis)
    session.commit()

    return feedback, analysis


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
        (feedback, analysis) tuple or raises HTTPException if invalid
    """
    event = get_event_by_token(session, public_token)

    # --- Transcribe audio ---
    result = transcribe_and_validate(audio_path)

    if result["decision"] == "REJECT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid audio feedback: {result.get('reason', 'Unknown error')}"
        )

    # --- Classify sentiment on transcribed text ---
    sentiment_result = classify_feedback(result["normalized_text"])

    # --- Store feedback ---
    feedback = Feedback(
        event_id=event.id,
        input_type="audio",
        raw_text=result["raw_text"],
        normalized_text=result["normalized_text"],
        audio_path=audio_path,
        quality_decision=result["decision"],
        quality_flags=json.dumps(result.get("flags", []))
    )

    session.add(feedback)
    session.commit()
    session.refresh(feedback)

    # --- Store analysis ---
    analysis = FeedbackAnalysis(
        feedback_id=feedback.id,
        sentiment=sentiment_result["sentiment"],
        confidence=sentiment_result["confidence"],
        margin=sentiment_result.get("margin"),
        model_name="cardiffnlp/twitter-roberta-base-sentiment"
    )

    session.add(analysis)
    session.commit()

    return feedback, analysis


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
            "text_feedback": row.normalized_text,
            "audio_path": f"http://localhost:8000/{row.audio_path}" if row.audio_path else None,
            "sentiment": row.sentiment,
            "confidence": row.confidence,
            "quality_decision": row.quality_decision,
            "quality_flags": row.quality_flags,
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
            Feedback.quality_decision,
            Feedback.quality_flags,
            Feedback.created_at,
            FeedbackAnalysis.sentiment,
            FeedbackAnalysis.confidence,
            FeedbackAnalysis.margin,
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
        "margin": result.margin,
        "quality_decision": result.quality_decision,
        "quality_flags": json.loads(result.quality_flags) if result.quality_flags else [],
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