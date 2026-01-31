from fastapi import Depends, HTTPException,status
from db.db import SessionDep
from helpers.security import authenticate_speaker
from models.login import TokenResponse,LoginRequest
from helpers.auth import create_access_token
from fastapi import APIRouter

router = APIRouter(prefix="/login", tags=["Login"])

@router.post("/", response_model=TokenResponse)
def login(
    data: LoginRequest,
    session: SessionDep,
):
    speaker = authenticate_speaker(
        session, data.identifier, data.password
    )

    if not speaker:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    token = create_access_token(subject=speaker.id)

    return {
        "access_token": token,
        "token_type": "bearer"
    }
