"""
Speaker Routes - MongoDB Version (Async)
"""
from fastapi import APIRouter, Depends

from models.speaker import SpeakerCreate, SpeakerRead, SpeakerUpdate
from handlers.speaker import create_speaker, list_speakers, update_speaker
from helpers.auth import get_current_speaker
from db.mongo_models import SpeakerDocument

router = APIRouter(prefix="/speakers", tags=["Speakers"])


@router.post("/register", response_model=SpeakerRead)
async def create(speaker: SpeakerCreate):
    """Register a new speaker account."""
    doc = await create_speaker(speaker)
    return {
        "id": str(doc.id),
        "name": doc.name,
        "email": doc.email,
        "is_active": doc.is_active,
        "created_at": doc.created_at
    }


@router.get("/me", response_model=SpeakerRead)
async def read_me(current_speaker: SpeakerDocument = Depends(get_current_speaker)):
    """Get current authenticated speaker details."""
    return {
        "id": str(current_speaker.id),
        "name": current_speaker.name,
        "email": current_speaker.email,
        "is_active": current_speaker.is_active,
        "created_at": current_speaker.created_at
    }


@router.get("/", response_model=list[SpeakerRead])
async def list_all(
    current_speaker: SpeakerDocument = Depends(get_current_speaker)
):
    """List all speakers (requires authentication)."""
    docs = await list_speakers()
    return [
        {
            "id": str(doc.id),
            "name": doc.name,
            "email": doc.email,
            "is_active": doc.is_active,
            "created_at": doc.created_at
        }
        for doc in docs
    ]


@router.patch("/me", response_model=SpeakerRead)
async def update_me(
    data: SpeakerUpdate,
    current_speaker: SpeakerDocument = Depends(get_current_speaker)
):
    """Update current speaker profile."""
    doc = await update_speaker(str(current_speaker.id), data)
    return {
        "id": str(doc.id),
        "name": doc.name,
        "email": doc.email,
        "is_active": doc.is_active,
        "created_at": doc.created_at
    }


