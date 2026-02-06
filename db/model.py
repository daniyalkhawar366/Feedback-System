from sqlmodel import Column, SQLModel, Field, Text, JSON
from datetime import date, datetime
from typing import Optional

class Speaker(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)

    password_hash: str
    is_active: bool = Field(default=True)
    role: str = Field(default="speaker")

    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: Optional[datetime] = None


class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    speaker_id: int = Field(foreign_key="speaker.id", index=True)

    title: str
    description: Optional[str] = None
    event_date: Optional[date] = None

    public_token: str = Field(index=True, unique=True)
    is_active: bool = Field(default=True)

    # Feedback window
    feedback_open_at: Optional[datetime] = None
    feedback_close_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)


class Feedback(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="event.id", index=True)

    input_type: str  # "text" | "voice"
    raw_text: str = Field(sa_column=Column(Text))
    normalized_text: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    audio_path: Optional[str] = None
    audio_duration_sec: Optional[float] = None
    language: Optional[str] = None

    quality_decision: str  # "ACCEPT" | "REJECT" | "FLAG"
    quality_flags: Optional[str] = Field(default=None, sa_column=Column(JSON))
    
    validated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FeedbackAnalysis(SQLModel, table=True):
    """Stores LLM-extracted dimensions for each feedback"""
    id: Optional[int] = Field(default=None, primary_key=True)
    feedback_id: int = Field(foreign_key="feedback.id", index=True, unique=True)
    
    # LLM-extracted dimensions
    theme: Optional[str] = Field(default=None, index=True)  # Primary topic cluster
    sentiment: Optional[str] = None  # "Positive" | "Negative" | "Neutral"
    emotion: Optional[str] = None  # JOY, ANGER, SADNESS, etc.
    impact_direction: Optional[str] = None  # "HELPED" | "NEUTRAL" | "HURT"
    is_against: Optional[str] = None  # "YES" | "NO" | "MIXED"
    
    # Signal quality
    confidence: Optional[float] = None  # 0.0 to 1.0
    relevancy: Optional[int] = None  # 0 to 100
    evidence_type: Optional[str] = None  # DATA, ANECDOTE, EXPERT_OPINION, etc.
    is_critical_opinion: Optional[bool] = None
    risk_flag: Optional[bool] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EventReport(SQLModel, table=True):
    """Stores comprehensive consensus reports for events"""
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="event.id", index=True)
    category: str = Field(default="FEEDBACK_RETROSPECTIVE")
    
    # Summary fields
    main_summary: Optional[str] = Field(default=None, sa_column=Column(Text))
    conflicting_statement: Optional[str] = Field(default=None, sa_column=Column(Text))
    top_weighted_points: Optional[str] = Field(default=None, sa_column=Column(JSON))  # JSON array of strings
    
    # Executive bullets
    what_we_agree_on: Optional[str] = Field(default=None, sa_column=Column(JSON))  # JSON array
    where_we_disagree: Optional[str] = Field(default=None, sa_column=Column(JSON))  # JSON array
    what_to_decide_next: Optional[str] = Field(default=None, sa_column=Column(JSON))  # JSON array
    
    # Analytics (optional - can be computed on demand)
    theme_board_json: Optional[str] = Field(default=None, sa_column=Column(JSON))
    evidence_board_json: Optional[str] = Field(default=None, sa_column=Column(JSON))
    
    # Metadata
    feedback_count: int
    generation_time_seconds: Optional[float] = None
    generated_at: datetime = Field(default_factory=datetime.utcnow)

