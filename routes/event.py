from fastapi import APIRouter,Depends, HTTPException
from handlers.event import create_event,get_event,get_event_by_token,list_events_for_speaker,update_event,delete_event
from db.db import SessionDep
from models.event import EventCreate,EventRead,EventUpdate
from helpers.qr_service import generate_qr_base64
from dotenv import load_dotenv
import os 
from handlers.feedback import list_event_feedback
from models.feedback import EventFeedbackRead
from db.model import Speaker, Event, Feedback, FeedbackAnalysis
from helpers.auth import get_current_speaker
from sqlmodel import select, func
from datetime import datetime, timedelta

load_dotenv()
BASE_URL=os.getenv("BASE_URL")

router = APIRouter(prefix="/events", tags=["Events"])

@router.post("/", response_model=EventRead, status_code=201)
def create_event_route(
    data: EventCreate,
    session:SessionDep,
    current_speaker: Speaker = Depends(get_current_speaker),
):
    return create_event(session, current_speaker.id, data)

@router.get("/{event_id}", response_model=EventRead)
def get_event_route(
    event_id: int,
    session: SessionDep,current_speaker: Speaker = Depends(get_current_speaker)
):
    return get_event(session, event_id)

@router.get("/", response_model=list[EventRead])
def list_events_route(
    session: SessionDep,
    current_speaker: Speaker = Depends(get_current_speaker),
):
    return list_events_for_speaker(session, current_speaker.id)

@router.get("/{event_id}/qr")
def get_event_qr(
    event_id: int,
    session: SessionDep,current_speaker: Speaker = Depends(get_current_speaker)
):
    event = get_event(session, event_id)
    url = f"{BASE_URL}/feedback/{event.public_token}"
    return {
        "event_id": event.id,
        "feedback_url": url,
        "qr_base64": generate_qr_base64(url)
    }

@router.get(
    "/{event_id}/feedback",
    response_model=list[EventFeedbackRead]
)
def get_event_feedback(
    event_id: int,
    session: SessionDep,current_speaker: Speaker = Depends(get_current_speaker)
):
    return list_event_feedback(session, event_id)


@router.patch("/{event_id}", response_model=EventRead)
def update_event_route(
    event_id: int,
    data: EventUpdate,
    session: SessionDep,
    current_speaker: Speaker = Depends(get_current_speaker),
):
    return update_event(session, event_id, current_speaker.id, data)


@router.delete("/{event_id}", status_code=204)
def delete_event_route(
    event_id: int,
    session: SessionDep,
    current_speaker: Speaker = Depends(get_current_speaker),
):
    delete_event(session, event_id, current_speaker.id)
    return None
