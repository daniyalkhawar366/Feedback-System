"""
Event Routes - MongoDB Version (Async)
"""
from fastapi import APIRouter, Depends
from dotenv import load_dotenv
import os

from handlers.event import (
    create_event,
    get_event,
    list_events_for_speaker,
    update_event,
    delete_event
)
from handlers.feedback import list_event_feedback
from models.event import EventCreate, EventRead, EventUpdate
from models.feedback import EventFeedbackRead
from helpers.auth import get_current_speaker
from helpers.qr_service import generate_qr_base64
from db.mongo_models import SpeakerDocument

load_dotenv()
BASE_URL = os.getenv("BASE_URL")

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("/", response_model=EventRead, status_code=201)
async def create_event_route(
    data: EventCreate,
    current_speaker: SpeakerDocument = Depends(get_current_speaker),
):
    """Create a new event."""
    doc = await create_event(str(current_speaker.id), data)
    return {
        "id": str(doc.id),
        "speaker_id": str(doc.speaker_id),
        "title": doc.title,
        "description": doc.description,
        "event_date": doc.event_date,
        "public_token": doc.public_token,
        "is_active": doc.is_active,
        "feedback_open_at": doc.feedback_open_at,
        "feedback_close_at": doc.feedback_close_at,
        "created_at": doc.created_at
    }


@router.get("/{event_id}", response_model=EventRead)
async def get_event_route(
    event_id: str,
    current_speaker: SpeakerDocument = Depends(get_current_speaker)
):
    """Get event by ID."""
    doc = await get_event(event_id)
    return {
        "id": str(doc.id),
        "speaker_id": str(doc.speaker_id),
        "title": doc.title,
        "description": doc.description,
        "event_date": doc.event_date,
        "public_token": doc.public_token,
        "is_active": doc.is_active,
        "feedback_open_at": doc.feedback_open_at,
        "feedback_close_at": doc.feedback_close_at,
        "created_at": doc.created_at
    }


@router.get("/", response_model=list[EventRead])
async def list_events_route(
    current_speaker: SpeakerDocument = Depends(get_current_speaker),
):
    """List all events for the current speaker."""
    docs = await list_events_for_speaker(str(current_speaker.id))
    return [
        {
            "id": str(doc.id),
            "speaker_id": str(doc.speaker_id),
            "title": doc.title,
            "description": doc.description,
            "event_date": doc.event_date,
            "public_token": doc.public_token,
            "is_active": doc.is_active,
            "feedback_open_at": doc.feedback_open_at,
            "feedback_close_at": doc.feedback_close_at,
            "created_at": doc.created_at
        }
        for doc in docs
    ]


@router.get("/{event_id}/qr")
async def get_event_qr(
    event_id: str,
    current_speaker: SpeakerDocument = Depends(get_current_speaker)
):
    """Generate QR code for event feedback URL."""
    event = await get_event(event_id)
    url = f"{BASE_URL}/feedback/{event.public_token}"
    
    return {
        "event_id": str(event.id),
        "feedback_url": url,
        "qr_base64": generate_qr_base64(url)
    }


@router.get(
    "/{event_id}/feedback",
    response_model=list[EventFeedbackRead]
)
async def get_event_feedback(
    event_id: str,
    current_speaker: SpeakerDocument = Depends(get_current_speaker)
):
    """List all feedback for an event."""
    feedbacks = await list_event_feedback(event_id)
    return [
        {
            "id": str(fb["id"]),
            "event_id": str(fb["event_id"]),
            "input_type": fb["input_type"],
            "raw_text": fb.get("raw_text"),
            "normalized_text": fb.get("normalized_text"),
            "audio_path": fb.get("audio_path"),
            "sentiment": fb.get("sentiment"),
            "confidence": fb.get("confidence"),
            "quality_decision": fb.get("quality_decision"),
            "quality_flags": fb.get("quality_flags"),
            "created_at": fb["created_at"]
        }
        for fb in feedbacks
    ]


@router.patch("/{event_id}", response_model=EventRead)
async def update_event_route(
    event_id: str,
    data: EventUpdate,
    current_speaker: SpeakerDocument = Depends(get_current_speaker),
):
    """Update an event."""
    doc = await update_event(event_id, str(current_speaker.id), data)
    return {
        "id": str(doc.id),
        "speaker_id": str(doc.speaker_id),
        "title": doc.title,
        "description": doc.description,
        "event_date": doc.event_date,
        "public_token": doc.public_token,
        "is_active": doc.is_active,
        "feedback_open_at": doc.feedback_open_at,
        "feedback_close_at": doc.feedback_close_at,
        "created_at": doc.created_at
    }


@router.delete("/{event_id}", status_code=204)
async def delete_event_route(
    event_id: str,
    current_speaker: SpeakerDocument = Depends(get_current_speaker),
):
    """Delete an event (soft delete)."""
    await delete_event(event_id, str(current_speaker.id))
    return None
