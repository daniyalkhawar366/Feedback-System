"""
Authentication Helper - MongoDB Version (Async)
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv

from db.mongo_models import SpeakerDocument

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production-min-32-chars")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

security = HTTPBearer()


def create_access_token(
    subject: str,  # Changed from int to str (MongoDB ObjectId)
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create JWT access token.
    
    Args:
        subject: Speaker MongoDB ObjectId as string
        expires_delta: Optional token expiration time
        
    Returns:
        Encoded JWT token
    """
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=60)
    )

    payload = {
        "sub": subject,  # Already a string now
        "exp": expire
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_speaker(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> SpeakerDocument:
    """
    Get current authenticated speaker from JWT token.
    
    Args:
        credentials: HTTP Bearer token
        
    Returns:
        Authenticated SpeakerDocument
        
    Raises:
        HTTPException 401: If token is invalid or speaker not found
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        speaker_id = payload.get("sub")
        if not speaker_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
    except (JWTError, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    speaker = await SpeakerDocument.get(speaker_id)

    if not speaker or not speaker.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive or missing user",
        )

    return speaker

