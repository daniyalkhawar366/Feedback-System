from sqlmodel import Session, select
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from db.model import Event
from models.event import EventCreate, EventUpdate
from helpers.tokens import generate_event_token
from db.model import Speaker

def create_event(
    session: Session,
    speaker_id: int,
    data: EventCreate
) -> Event:
    speaker = session.get(Speaker, speaker_id)
    if not speaker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Speaker with id {speaker_id} does not exist"
        )

    db_event = Event(
        **data.model_dump(), 
        speaker_id=speaker_id,
        public_token=generate_event_token()
    )

    try:
        session.add(db_event)
        session.commit()
        session.refresh(db_event)
        return db_event
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not create event due to a token collision. Please try again."
        )


def get_event(session: Session, event_id: int) -> Event:
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


def list_events_for_speaker(
    session: Session,
    speaker_id: int
) -> list[Event]:
    return session.exec(
        select(Event).where(
            Event.speaker_id == speaker_id,
            Event.is_active == True
        )
    ).all()


def get_event_by_token(
    session: Session,
    token: str
) -> Event:
    event = session.exec(
        select(Event).where(
            Event.public_token == token,
            Event.is_active == True
        )
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Invalid or inactive event")

    return event


def update_event(
    session: Session,
    event_id: int,
    speaker_id: int,
    data: EventUpdate
) -> Event:
    event = session.get(Event, event_id)
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
    
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


def delete_event(
    session: Session,
    event_id: int,
    speaker_id: int
) -> None:
    event = session.get(Event, event_id)
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
    session.add(event)
    session.commit()
