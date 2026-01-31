from sqlmodel import  select
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from models.speaker import SpeakerCreate, SpeakerUpdate
from helpers.security import hash_password
from sqlmodel import Session
from db.model import Speaker

def create_speaker( data: SpeakerCreate,session: Session):
    speaker_data = data.model_dump(exclude={"password"})
    speaker = Speaker(**speaker_data, password_hash=hash_password(data.password))
    try:
        session.add(speaker)
        session.commit() 
        session.refresh(speaker)
        return speaker
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email or name already registered"
    )

    
def get_speaker(speaker_id: int,session: Session) -> Speaker:
    speaker = session.get(Speaker, speaker_id)
    if not speaker:
        raise HTTPException(status_code=404, detail="Speaker not found")
    return speaker


def list_speakers(session: Session) -> list[Speaker]:
    return session.exec(select(Speaker)).all()

def update_speaker(
    speaker_id: int,
    data: SpeakerUpdate,
    session: Session
) -> Speaker:
    speaker = get_speaker(speaker_id, session)

    if data.email and data.email != speaker.email:
        exists = session.exec(
            select(Speaker).where(Speaker.email == data.email)
        ).first()
        if exists:
            raise HTTPException(status_code=409, detail="Email already in use")

    if data.name and data.name != speaker.name:
        exists = session.exec(
            select(Speaker).where(Speaker.name == data.name)
        ).first()
        if exists:
            raise HTTPException(status_code=409, detail="Name already in use")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(speaker, key, value)

    session.commit()
    session.refresh(speaker)
    return speaker
