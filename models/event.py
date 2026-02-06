from pydantic import BaseModel, field_validator
from datetime import datetime, date
from typing import Optional

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: Optional[date] = None
    feedback_open_at: Optional[datetime] = None
    feedback_close_at: Optional[datetime] = None
    
    @field_validator('feedback_close_at')
    @classmethod
    def validate_feedback_window(cls, v, info):
        if v and info.data.get('feedback_open_at'):
            if v <= info.data['feedback_open_at']:
                raise ValueError('feedback_close_at must be after feedback_open_at')
        return v


class EventRead(BaseModel):
    id: int
    speaker_id: int
    title: str
    description: Optional[str]
    event_date: Optional[date]
    public_token: str
    is_active: bool
    feedback_open_at: Optional[datetime]
    feedback_close_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
