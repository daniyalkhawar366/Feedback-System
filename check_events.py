"""Quick test to check events and feedback in database"""
from db.db import Session, engine
from db.model import Event, Feedback
from sqlmodel import select

with Session(engine) as session:
    events = session.exec(select(Event)).all()
    print(f"Total events: {len(events)}\n")
    
    for event in events[:5]:
        feedback_count = len(
            session.exec(
                select(Feedback)
                .where(Feedback.event_id == event.id)
                .where(Feedback.quality_decision == "ACCEPT")
            ).all()
        )
        print(f"Event {event.id}: {event.title}")
        print(f"  ACCEPT feedback: {feedback_count}")
        print()
