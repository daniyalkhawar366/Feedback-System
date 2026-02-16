"""
Feedback Handler - MongoDB Version (Async)
"""
import json
import os
from datetime import datetime
from fastapi import HTTPException, status
from typing import List, Dict, Optional

from db.mongo_models import FeedbackDocument, FeedbackAnalysisDocument, EventDocument
from handlers.event import get_event_by_token

# Use cloud-based transcription in production (Railway), local for development
if os.getenv("ENVIRONMENT") == "production" or os.getenv("RAILWAY_ENVIRONMENT"):
    from speech_to_text_cloud import transcribe_audio
else:
    from speech_to_text import transcribe_audio

from text_validation import validate_text_feedback, is_valid_feedback


async def check_feedback_window(event: EventDocument):
    """
    Validate that feedback can be accepted for this event.
    
    Args:
        event: Event document
        
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


async def handle_text_feedback(
    public_token: str,
    text: str
) -> FeedbackDocument:
    """
    Handle text feedback submission with validation
    
    Args:
        public_token: Event's public token
        text: Raw feedback text
        
    Returns:
        Created FeedbackDocument
    """
    event = await get_event_by_token(public_token)
    
    # Check if feedback window is open
    await check_feedback_window(event)

    # --- Validate text input ---
    validation_result = validate_text_feedback(text)
    
    # Only reject if text is too short or too long
    if validation_result["decision"] == "REJECT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation_result.get("reason", "Text validation failed")
        )

    # --- Store feedback ---
    feedback = FeedbackDocument(
        event_id=str(event.id),
        input_type="text",
        raw_text=text,
        normalized_text=validation_result["clean_text"],
        quality_decision=validation_result["decision"],  # "ACCEPT" or "FLAG"
        quality_flags=json.dumps(validation_result["flags"]) if validation_result["flags"] else None
    )

    await feedback.insert()
    return feedback


async def handle_audio_feedback(
    public_token: str,
    audio_path: str
) -> FeedbackDocument:
    """
    Handle audio feedback submission with transcription and validation
    
    Args:
        public_token: Event's public token
        audio_path: Path to audio file
        
    Returns:
        Created FeedbackDocument
    """
    event = await get_event_by_token(public_token)
    
    # Check if feedback window is open
    await check_feedback_window(event)

    # Step 1: Transcribe audio
    transcription_result = transcribe_audio(audio_path)

    if not transcription_result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid audio: {transcription_result.get('reason', 'Unknown error')}"
        )

    raw_text = transcription_result["raw_text"]
    
    # Step 2: Validate transcribed text
    validation_result = validate_text_feedback(raw_text)
    
    if validation_result["decision"] == "REJECT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation_result.get("reason", "Text validation failed")
        )

    # Step 3: Store feedback
    feedback = FeedbackDocument(
        event_id=str(event.id),
        input_type="audio",
        raw_text=raw_text,
        normalized_text=validation_result["clean_text"],
        audio_path=audio_path,
        audio_duration_sec=transcription_result.get("audio_duration"),
        language=transcription_result.get("language"),
        quality_decision=validation_result["decision"],
        quality_flags=json.dumps(validation_result["flags"]) if validation_result["flags"] else None
    )

    await feedback.insert()
    return feedback


async def list_event_feedback(event_id: str) -> List[Dict]:
    """
    List all feedback for an event with sentiment analysis
    
    Args:
        event_id: Event MongoDB ObjectId
        
    Returns:
        List of feedback dictionaries with sentiment
    """
    feedbacks = await FeedbackDocument.find(
        FeedbackDocument.event_id == event_id
    ).sort("-created_at").to_list()

    result = []
    for feedback in feedbacks:
        # Get associated analysis if exists
        analysis = await FeedbackAnalysisDocument.find_one(
            FeedbackAnalysisDocument.feedback_id == str(feedback.id)
        )
        
        result.append({
            "id": str(feedback.id),
            "event_id": feedback.event_id,
            "input_type": feedback.input_type,
            "raw_text": feedback.raw_text,
            "normalized_text": feedback.normalized_text,
            "audio_path": f"http://localhost:8000/{feedback.audio_path}" if feedback.audio_path else None,
            "quality_decision": feedback.quality_decision,
            "quality_flags": feedback.quality_flags,
            "sentiment": analysis.sentiment if analysis else None,
            "confidence": analysis.confidence if analysis else None,
            "created_at": feedback.created_at,
        })
    
    return result


async def get_feedback_detail(feedback_id: str, event_id: str) -> Optional[Dict]:
    """
    Get detailed information about a specific feedback entry
    
    Args:
        feedback_id: Feedback MongoDB ObjectId
        event_id: Event MongoDB ObjectId (for authorization)
        
    Returns:
        Detailed feedback dictionary or None
    """
    feedback = await FeedbackDocument.get(feedback_id)

    if not feedback or feedback.event_id != event_id:
        return None

    # Get analysis
    analysis = await FeedbackAnalysisDocument.find_one(
        FeedbackAnalysisDocument.feedback_id == feedback_id
    )

    audio_url = None
    if feedback.audio_path:
        audio_url = f"http://localhost:8000/{feedback.audio_path}"
    
    return {
        "id": str(feedback.id),
        "event_id": feedback.event_id,
        "input_type": feedback.input_type,
        "raw_text": feedback.raw_text,
        "normalized_text": feedback.normalized_text,
        "audio_path": audio_url,
        "sentiment": analysis.sentiment if analysis else None,
        "confidence": analysis.confidence if analysis else None,
        "intent": analysis.intent if analysis else None,
        "created_at": feedback.created_at,
    }


async def delete_feedback(feedback_id: str, event_id: str) -> bool:
    """
    Delete feedback entry and associated analysis
    
    Args:
        feedback_id: Feedback MongoDB ObjectId
        event_id: Event MongoDB ObjectId (for authorization)
        
    Returns:
        True if deleted, False if not found
    """
    # Get feedback
    feedback = await FeedbackDocument.get(feedback_id)

    if not feedback or feedback.event_id != event_id:
        return False

    # Delete associated analysis
    analysis = await FeedbackAnalysisDocument.find_one(
        FeedbackAnalysisDocument.feedback_id == feedback_id
    )
    if analysis:
        await analysis.delete()

    # Delete feedback
    await feedback.delete()
    return True