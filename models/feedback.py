
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class FeedbackTextCreate(BaseModel):
    text: str


class FeedbackResponse(BaseModel):
    id: int
    sentiment: Optional[str] = None  # Will be filled by LLM during analysis
    confidence: Optional[float] = None
    decision: str
    
class EventFeedbackRead(BaseModel):
    id: int
    event_id: int
    input_type: str
    raw_text: Optional[str] = None
    normalized_text: Optional[str] = None
    audio_path: Optional[str] = None
    sentiment: Optional[str] = None
    confidence: Optional[float] = None
    quality_decision: Optional[str] = None
    quality_flags: Optional[str] = None
    created_at: datetime