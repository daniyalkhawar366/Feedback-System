"""
Security Helper - MongoDB Version (Async)
"""
import bcrypt
from db.mongo_models import SpeakerDocument
from typing import Optional


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    password_bytes = password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


async def authenticate_speaker(identifier: str, password: str) -> Optional[SpeakerDocument]:
    """
    Authenticate a speaker by email/username and password.
    
    Args:
        identifier: Email or username
        password: Plain text password
        
    Returns:
        SpeakerDocument if authentication successful, None otherwise
    """
    # Try to find speaker by email first
    speaker = await SpeakerDocument.find_one(SpeakerDocument.email == identifier)
    
    # If not found by email, try by username
    if not speaker:
        speaker = await SpeakerDocument.find_one(SpeakerDocument.name == identifier)

    if not speaker:
        return None

    if not verify_password(password, speaker.password_hash):
        return None

    return speaker
