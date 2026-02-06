from pydantic import BaseModel, EmailStr, field_validator
from typing import Union


class LoginRequest(BaseModel):
    identifier: str  # Can be either email or username
    password: str
    
    @field_validator('identifier')
    @classmethod
    def identifier_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Email or username is required')
        return v.strip()

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
