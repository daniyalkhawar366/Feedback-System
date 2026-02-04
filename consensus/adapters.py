"""
Data adapters to convert between feedback system models and consensus models.
Maps: Event + Feedback[] → Discussion + Message[]
"""

from typing import List, Optional
from datetime import datetime
from consensus.types import Discussion, Message, Category


def event_to_discussion(
    event_id: int,
    event_title: str,
    event_description: Optional[str],
    event_date: Optional[datetime],
    speaker_name: Optional[str] = None,
    category: Optional[Category] = None,
) -> dict:
    """
    Convert event metadata to Discussion format.
    
    Args:
        event_id: Event ID
        event_title: Event title/name
        event_description: Event description
        event_date: Event date
        speaker_name: Speaker name (optional)
        category: Pre-assigned category (always FEEDBACK_RETROSPECTIVE for events)
    
    Returns:
        Dict with name, description, template fields.
    """
    # Build enriched description
    parts = []
    if event_description:
        parts.append(event_description)
    if speaker_name:
        parts.append(f"Speaker: {speaker_name}")
    if event_date:
        parts.append(f"Date: {event_date.strftime('%B %d, %Y')}")
    
    description = " | ".join(parts) if parts else event_title
    
    # Event feedback is always retrospective - hardcoded for Groq compatibility
    return {
        "name": event_title,
        "description": description,
        "template": Category.FEEDBACK_RETROSPECTIVE,
    }


def feedback_to_messages(feedbacks: List[dict]) -> List[Message]:
    """
    Convert feedback list to Message list.
    
    Args:
        feedbacks: List of feedback dicts with keys:
            - id: int
            - normalized_text or raw_text: str
            - quality_decision: str (ACCEPT/FLAG/REJECT)
    
    Returns:
        List of Message objects (only ACCEPT quality feedback).
    """
    messages = []
    
    for fb in feedbacks:
        # Only include accepted feedback
        if fb.get("quality_decision") != "ACCEPT":
            continue
        
        # Prefer normalized_text, fallback to raw_text
        text = fb.get("normalized_text") or fb.get("raw_text", "")
        
        if not text or len(text.strip()) < 5:
            continue  # Skip empty/very short feedback
        
        messages.append(Message(
            id=fb["id"],
            message=text.strip()
        ))
    
    return messages


def build_discussion_from_event(
    event: dict,
    feedbacks: List[dict],
    speaker_name: Optional[str] = None,
    category: Optional[Category] = None,
) -> Discussion:
    """
    Build complete Discussion object from event and feedback data.
    
    Args:
        event: Event dict with keys: id, title, description, event_date
        feedbacks: List of feedback dicts
        speaker_name: Optional speaker name
        category: Optional pre-assigned category
    
    Returns:
        Discussion object ready for consensus pipeline.
    
    Raises:
        ValueError: If no valid feedback found.
    """
    # Convert event metadata
    discussion_data = event_to_discussion(
        event_id=event["id"],
        event_title=event["title"],
        event_description=event.get("description"),
        event_date=event.get("event_date"),
        speaker_name=speaker_name,
        category=category,
    )
    
    # Convert feedback to messages
    messages = feedback_to_messages(feedbacks)
    
    if not messages:
        raise ValueError(
            f"No valid feedback found for event {event['id']}. "
            f"Ensure at least 5 feedback items with ACCEPT quality_decision."
        )
    
    return Discussion(
        name=discussion_data["name"],
        description=discussion_data["description"],
        template=discussion_data["template"],
        messages=messages,
    )


def adapt_event_for_report(
    event_id: int,
    db_session,
    category: Optional[Category] = None,
    min_feedback_count: int = 5,
) -> Discussion:
    """
    Fetch event and feedback from database and adapt to Discussion.
    
    Args:
        event_id: Event ID to fetch
        db_session: SQLAlchemy database session
        category: Optional category override
        min_feedback_count: Minimum feedback required
    
    Returns:
        Discussion object ready for report generation.
    
    Raises:
        ValueError: If event not found or insufficient feedback.
    """
    from db.model import Event, Feedback, Speaker
    from sqlmodel import select
    
    # Fetch event
    event = db_session.exec(select(Event).where(Event.id == event_id)).first()
    if not event:
        raise ValueError(f"Event {event_id} not found")
    
    # Fetch speaker name
    speaker = db_session.exec(select(Speaker).where(Speaker.id == event.speaker_id)).first()
    speaker_name = speaker.name if speaker else None
    
    # Fetch all feedback for event
    feedbacks = db_session.exec(select(Feedback).where(Feedback.event_id == event_id)).all()
    
    # Convert to dicts
    event_dict = {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "event_date": event.event_date,
    }
    
    feedback_dicts = [
        {
            "id": fb.id,
            "normalized_text": fb.normalized_text,
            "raw_text": fb.raw_text,
            "quality_decision": fb.quality_decision,
        }
        for fb in feedbacks
    ]
    
    # Build discussion
    discussion = build_discussion_from_event(
        event=event_dict,
        feedbacks=feedback_dicts,
        speaker_name=speaker_name,
        category=category,
    )
    
    # Validate minimum feedback count
    if len(discussion.messages) < min_feedback_count:
        raise ValueError(
            f"Insufficient feedback for event {event_id}. "
            f"Found {len(discussion.messages)} ACCEPT-quality feedback, "
            f"minimum required: {min_feedback_count}"
        )
    
    return discussion
