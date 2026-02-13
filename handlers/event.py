"""
Event Handler - MongoDB Version (Async)
"""
from fastapi import HTTPException, status
from db.mongo_models import EventDocument, SpeakerDocument
from models.event import EventCreate, EventUpdate
from helpers.tokens import generate_event_token
from typing import List


async def create_event(
    speaker_id: str,
    data: EventCreate
) -> EventDocument:
    """Create a new event for a speaker."""
    # Verify speaker exists
    speaker = await SpeakerDocument.get(speaker_id)
    if not speaker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Speaker with id {speaker_id} does not exist"
        )

    # Check for token collision (very unlikely but possible)
    max_attempts = 5
    for _ in range(max_attempts):
        token = generate_event_token()
        existing = await EventDocument.find_one(EventDocument.public_token == token)
        if not existing:
            break
    else:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not create event due to token collision. Please try again."
        )

    # Create event
    db_event = EventDocument(
        **data.model_dump(), 
        speaker_id=speaker_id,
        public_token=token
    )
    
    await db_event.insert()
    return db_event


async def get_event(event_id: str) -> EventDocument:
    """Get event by MongoDB ObjectId."""
    event = await EventDocument.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


async def list_events_for_speaker(speaker_id: str) -> List[EventDocument]:
    """Get all active events for a speaker."""
    return await EventDocument.find(
        EventDocument.speaker_id == speaker_id,
        EventDocument.is_active == True
    ).to_list()


async def get_event_by_token(token: str) -> EventDocument:
    """Get active event by public token."""
    event = await EventDocument.find_one(
        EventDocument.public_token == token,
        EventDocument.is_active == True
    )

    if not event:
        raise HTTPException(status_code=404, detail="Invalid or inactive event")

    return event


async def update_event(
    event_id: str,
    speaker_id: str,
    data: EventUpdate
) -> EventDocument:
    """Update an event (only if owned by speaker)."""
    event = await EventDocument.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if the speaker owns this event
    if event.speaker_id != speaker_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit this event"
        )
    
    # Update only the fields that are provided
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event, key, value)
    
    await event.save()
    return event


async def delete_event(event_id: str, speaker_id: str) -> None:
    """Soft delete an event (only if owned by speaker)."""
    event = await EventDocument.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if the speaker owns this event
    if event.speaker_id != speaker_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this event"
        )
    
    # Soft delete by setting is_active to False
    event.is_active = False
    await event.save()
