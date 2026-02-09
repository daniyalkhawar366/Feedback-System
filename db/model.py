from sqlmodel import Column, SQLModel, Field, Text, JSON
from datetime import date, datetime
from typing import Optional, List


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

    feedback_open_at: Optional[datetime] = None
    feedback_close_at: Optional[datetime] = None

    analysis_status: str = Field(default="pending")  # pending | processing | done

    created_at: datetime = Field(default_factory=datetime.utcnow)


class Feedback(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="event.id", index=True)

    input_type: str  # text | voice
    raw_text: str = Field(sa_column=Column(Text))
    normalized_text: Optional[str] = Field(default=None, sa_column=Column(Text))

    audio_path: Optional[str] = None
    audio_duration_sec: Optional[float] = None
    language: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)


class FeedbackAnalysis(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    feedback_id: int = Field(foreign_key="feedback.id", index=True, unique=True)

    sentiment: str  # positive | neutral | negative
    confidence: float  # 0.0 - 1.0

    intent: str  # praise | complaint | suggestion | neutral
    aspects: List[str] = Field(sa_column=Column(JSON))  # content, speaker, time_management, etc.
    
    # Specific issue identification (for granular reporting)
    issue_label: Optional[str] = None  # snake_case label like "poor_internet_connectivity"
    evidence_quote: Optional[str] = None  # Key phrase from feedback (max 100 chars)

    created_at: datetime = Field(default_factory=datetime.utcnow)


class EventAnalytics(SQLModel, table=True):
    event_id: int = Field(foreign_key="event.id", primary_key=True)

    total_responses: int
    positive_count: int
    neutral_count: int
    negative_count: int

    satisfaction_score: float

    top_strengths: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    top_issues: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    intent_summary: Optional[dict] = Field(default=None, sa_column=Column(JSON))

    generated_at: datetime = Field(default_factory=datetime.utcnow)


class EventReport(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="event.id", index=True)

    executive_summary: str = Field(sa_column=Column(Text))
    strengths: str = Field(sa_column=Column(Text))
    improvements: str = Field(sa_column=Column(Text))
    recommendations: str = Field(sa_column=Column(Text))

    representative_quotes: Optional[dict] = Field(default=None, sa_column=Column(JSON))

    pdf_path: Optional[str] = None
    generation_time_seconds: Optional[float] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
