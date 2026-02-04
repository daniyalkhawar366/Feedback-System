from sqlmodel import Column, SQLModel, Field, Text, JSON
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


class FeedbackDimension(SQLModel, table=True):
    """Stores extracted dimensions for each feedback message"""
    id: Optional[int] = Field(default=None, primary_key=True)
    feedback_id: int = Field(foreign_key="feedback.id", index=True)
    report_id: int = Field(foreign_key="eventreport.id", index=True)
    
    # Extracted dimensions
    theme: Optional[str] = None
    sentiment: Optional[str] = None
    emotion: Optional[str] = None
    impact_direction: Optional[str] = None
    
    confidence: Optional[float] = None
    relevancy: Optional[int] = None
    evidence_type: Optional[str] = None
    is_critical_opinion: Optional[bool] = None
    is_against: Optional[str] = None
    risk_flag: Optional[bool] = None
    
    weight_score: Optional[float] = None
    extracted_at: datetime = Field(default_factory=datetime.utcnow)

