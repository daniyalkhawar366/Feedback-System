from pydantic import BaseModel, field_validator, model_validator
from datetime import datetime, date
from typing import Optional

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: Optional[date] = None
    feedback_open_at: Optional[datetime] = None
    feedback_close_at: Optional[datetime] = None
    
    @model_validator(mode='after')
    def validate_feedback_window(self):
        if self.feedback_close_at and self.feedback_open_at:
            if self.feedback_close_at <= self.feedback_open_at:
                raise ValueError('feedback_close_at must be after feedback_open_at')
        return self


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[date] = None
    feedback_open_at: Optional[datetime] = None
    feedback_close_at: Optional[datetime] = None
    
    @model_validator(mode='after')
    def validate_feedback_window(self):
        if self.feedback_close_at and self.feedback_open_at:
            if self.feedback_close_at <= self.feedback_open_at:
                raise ValueError('feedback_close_at must be after feedback_open_at')
        return self


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
