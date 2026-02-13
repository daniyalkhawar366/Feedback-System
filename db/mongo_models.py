"""
MongoDB Document Models

Beanie ODM models for MongoDB collections.
These replace the SQLModel table models.
"""

from beanie import Document, Indexed
from pydantic import Field, EmailStr, ConfigDict
from datetime import date, datetime
from typing import Optional, List
from bson import ObjectId


# Custom serializer for ObjectId
def serialize_object_id(v):
    """Convert ObjectId to string for JSON serialization"""
    if isinstance(v, ObjectId):
        return str(v)
    return v


class SpeakerDocument(Document):
    """
    Speaker/User document.
    
    Stores speaker credentials and profile information.
    """
    name: Indexed(str, unique=True)
    email: Indexed(EmailStr, unique=True)
    password_hash: str
    is_active: bool = True
    role: str = "speaker"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: Optional[datetime] = None
    
    class Settings:
        name = "speakers"
        indexes = ["email", "name"]
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john@example.com",
                "is_active": True,
                "role": "speaker"
            }
        }


class EventDocument(Document):
    """
    Event document.
    
    Stores event details and feedback collection settings.
    """
    speaker_id: str  # ObjectId reference to SpeakerDocument
    title: str
    description: Optional[str] = None
    event_date: Optional[date] = None
    public_token: Indexed(str, unique=True)
    is_active: bool = True
    feedback_open_at: Optional[datetime] = None
    feedback_close_at: Optional[datetime] = None
    analysis_status: str = "pending"  # pending | processing | done
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "events"
        indexes = ["speaker_id", "public_token", "created_at"]
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "AI Workshop 2026",
                "description": "Introduction to Machine Learning",
                "event_date": "2026-03-15",
                "public_token": "abc123xyz",
                "is_active": True
            }
        }


class FeedbackDocument(Document):
    """
    Feedback document.
    
    Stores individual feedback submissions (text or voice).
    """
    event_id: str  # ObjectId reference to EventDocument
    input_type: str  # text | voice
    raw_text: str
    normalized_text: Optional[str] = None
    audio_path: Optional[str] = None
    audio_duration_sec: Optional[float] = None
    language: Optional[str] = None
    quality_decision: Optional[str] = None  # accepted | flagged | rejected
    quality_flags: Optional[str] = None  # JSON string with quality issues
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "feedbacks"
        indexes = ["event_id", "created_at", "quality_decision"]
    
    class Config:
        json_schema_extra = {
            "example": {
                "input_type": "text",
                "raw_text": "Great session, very informative!",
                "quality_decision": "accepted"
            }
        }


class FeedbackAnalysisDocument(Document):
    """
    Feedback analysis document.
    
    Stores AI-generated analysis for each feedback.
    """
    feedback_id: Indexed(str, unique=True)  # ObjectId reference to FeedbackDocument
    sentiment: Optional[str] = None  # positive | neutral | negative
    confidence: Optional[float] = None  # 0.0 - 1.0
    intent: Optional[str] = None  # praise | complaint | suggestion | neutral
    aspects: Optional[List[str]] = []  # content, speaker, time_management, etc.
    issue_label: Optional[str] = None  # snake_case label like "poor_internet_connectivity"
    evidence_quote: Optional[str] = None  # Key phrase from feedback (max 100 chars)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "feedback_analysis"
        indexes = ["feedback_id", "sentiment"]
    
    class Config:
        json_schema_extra = {
            "example": {
                "sentiment": "positive",
                "confidence": 0.95,
                "intent": "praise",
                "aspects": ["content", "speaker"]
            }
        }


class EventAnalyticsDocument(Document):
    """
    Event analytics document.
    
    Stores aggregated analytics for an event.
    """
    event_id: Indexed(str, unique=True)  # ObjectId reference to EventDocument
    total_responses: int
    positive_count: int
    neutral_count: int
    negative_count: int
    satisfaction_score: float
    top_strengths: Optional[dict] = None
    top_issues: Optional[dict] = None
    intent_summary: Optional[dict] = None
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "event_analytics"
        indexes = ["event_id"]
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_responses": 150,
                "positive_count": 120,
                "neutral_count": 20,
                "negative_count": 10,
                "satisfaction_score": 4.5
            }
        }


class EventReportDocument(Document):
    """
    Event report document.
    
    Stores AI-generated comprehensive reports.
    """
    event_id: str  # ObjectId reference to EventDocument
    executive_summary: Optional[str] = None
    strengths: Optional[str] = None
    improvements: Optional[str] = None
    recommendations: Optional[str] = None
    representative_quotes: Optional[dict] = None
    pdf_path: Optional[str] = None
    generation_time_seconds: Optional[float] = None
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "event_reports"
        indexes = ["event_id", "created_at"]
    
    class Config:
        json_schema_extra = {
            "example": {
                "executive_summary": "Overall positive feedback...",
                "strengths": "Great content and delivery",
                "improvements": "More interactive sessions needed",
                "recommendations": "Add Q&A segments",
                "generation_time_seconds": 12.5
            }
        }
