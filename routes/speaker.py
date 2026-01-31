from fastapi import APIRouter,Depends, HTTPException,status
from models.speaker import SpeakerCreate,SpeakerRead,SpeakerUpdate
from db.db import SessionDep
from db.model import Speaker
from helpers.auth import get_current_speaker
from handlers.speaker import create_speaker,get_speaker,list_speakers,update_speaker

router=APIRouter(prefix="/speakers",tags=["Speakers"])

@router.post("/register",response_model=SpeakerRead)
def create(speaker:SpeakerCreate,session:SessionDep):
    return create_speaker(speaker,session)

@router.get("/me", response_model=SpeakerRead)
def read_me(current_speaker: Speaker = Depends(get_current_speaker)):
    return current_speaker

@router.get("/",response_model=list[SpeakerRead])
def list_all(session:SessionDep,current_speaker: Speaker = Depends(get_current_speaker)):
    return list_speakers(session)


@router.patch("/me", response_model=SpeakerRead)
def update_me(
    data: SpeakerUpdate,
    session: SessionDep,
    current_speaker: Speaker = Depends(get_current_speaker)
):
    return update_speaker(current_speaker.id, data, session)


