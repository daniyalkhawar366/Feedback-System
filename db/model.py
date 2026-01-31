from sqlmodel import Column, SQLModel, Field, Text
from datetime import date, datetime
from typing import Optional

class Speaker(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str=Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)

    password_hash: str
    is_active: bool = Field(default=True)

    created_at: datetime = Field(default_factory=datetime.utcnow)


class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    speaker_id: int = Field(foreign_key="speaker.id", index=True)

    title: str
    description: Optional[str] = None
    event_date: Optional[date] = None

    public_token: str = Field(index=True, unique=True)
    is_active: bool = Field(default=True)

    created_at: datetime = Field(default_factory=datetime.utcnow)


class Feedback(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="event.id", index=True)

    input_type: str 
    raw_text: str = Field(sa_column=Column(Text))
    normalized_text: Optional[str] = Field(default=None, sa_column=Column(Text))
    audio_path: Optional[str] = None

    quality_decision: str  
    quality_flags: Optional[str] = None  

    created_at: datetime = Field(default_factory=datetime.utcnow)


class FeedbackAnalysis(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    feedback_id: int = Field(foreign_key="feedback.id", index=True)

    sentiment: str  
    confidence: float
    margin: Optional[float] = None

    model_name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EventSummary(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="event.id", unique=True)

    positive_percent: float
    neutral_percent: float
    negative_percent: float

    overall_summary: Optional[str] = None
    improvement_suggestions: Optional[str] = None

    generated_by_model: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
