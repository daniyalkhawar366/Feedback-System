"""
Login Route - MongoDB Version (Async)
"""
from fastapi import HTTPException, status, APIRouter
from helpers.security import authenticate_speaker
from models.login import TokenResponse, LoginRequest
from helpers.auth import create_access_token

router = APIRouter(prefix="/login", tags=["Login"])


@router.post("/", response_model=TokenResponse)
async def login(data: LoginRequest):
    """
    Authenticate user and return JWT token.
    
    Args:
        data: Login credentials (email/username and password)
        
    Returns:
        JWT access token and speaker info
    """
    speaker = await authenticate_speaker(data.identifier, data.password)

    if not speaker:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    token = create_access_token(subject=str(speaker.id))

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        speaker_id=str(speaker.id),
        speaker_name=speaker.name
    )
