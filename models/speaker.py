from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class SpeakerCreate(BaseModel):
    name: str
    email: EmailStr  
    password: str = Field(min_length=6)
    is_active: Optional[bool] = True

class SpeakerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None

class SpeakerRead(BaseModel):
    id: str
    name: str
    email: EmailStr
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

