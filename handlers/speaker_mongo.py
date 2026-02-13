"""
Speaker Handler - MongoDB Version

Async handlers for speaker CRUD operations using MongoDB.
"""

from fastapi import HTTPException, status
from models.speaker import SpeakerCreate, SpeakerUpdate
from helpers.security import hash_password
from db.mongo_models import SpeakerDocument
from typing import List


async def create_speaker(data: SpeakerCreate) -> SpeakerDocument:
    """
    Create a new speaker in MongoDB.
    
    Args:
        data: Speaker creation data including name, email, password
        
    Returns:
        Created SpeakerDocument
        
    Raises:
        HTTPException 409: If email or name already exists
    """
    # Check if email already exists
    existing_email = await SpeakerDocument.find_one(SpeakerDocument.email == data.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    # Check if name already exists
    existing_name = await SpeakerDocument.find_one(SpeakerDocument.name == data.name)
    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Name already registered"
        )
    
    # Create new speaker document
    speaker_data = data.model_dump(exclude={"password"})
    speaker = SpeakerDocument(
        **speaker_data,
        password_hash=hash_password(data.password)
    )
    
    await speaker.insert()
    return speaker


async def get_speaker(speaker_id: str) -> SpeakerDocument:
    """
    Get a speaker by MongoDB ObjectId.
    
    Args:
        speaker_id: MongoDB ObjectId string
        
    Returns:
        SpeakerDocument
        
    Raises:
        HTTPException 404: If speaker not found
    """
    speaker = await SpeakerDocument.get(speaker_id)
    if not speaker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Speaker not found"
        )
    return speaker


async def get_speaker_by_email(email: str) -> SpeakerDocument:
    """
    Get a speaker by email address.
    
    Args:
        email: Speaker's email address
        
    Returns:
        SpeakerDocument or None if not found
    """
    return await SpeakerDocument.find_one(SpeakerDocument.email == email)


async def get_speaker_by_name(name: str) -> SpeakerDocument:
    """
    Get a speaker by username.
    
    Args:
        name: Speaker's username
        
    Returns:
        SpeakerDocument or None if not found
    """
    return await SpeakerDocument.find_one(SpeakerDocument.name == name)


async def list_speakers() -> List[SpeakerDocument]:
    """
    Get all speakers.
    
    Returns:
        List of all SpeakerDocuments
    """
    return await SpeakerDocument.find_all().to_list()


async def update_speaker(
    speaker_id: str,
    data: SpeakerUpdate
) -> SpeakerDocument:
    """
    Update a speaker's information.
    
    Args:
        speaker_id: MongoDB ObjectId string
        data: Update data
        
    Returns:
        Updated SpeakerDocument
        
    Raises:
        HTTPException 404: If speaker not found
        HTTPException 409: If email/name already in use by another speaker
    """
    speaker = await get_speaker(speaker_id)
    
    # Check if email is being changed and if it's already in use
    if data.email and data.email != speaker.email:
        existing = await SpeakerDocument.find_one(SpeakerDocument.email == data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already in use"
            )
    
    # Check if name is being changed and if it's already in use
    if data.name and data.name != speaker.name:
        existing = await SpeakerDocument.find_one(SpeakerDocument.name == data.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Name already in use"
            )
    
    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(speaker, key, value)
    
    await speaker.save()
    return speaker


async def delete_speaker(speaker_id: str) -> None:
    """
    Delete a speaker (soft delete by setting is_active=False).
    
    Args:
        speaker_id: MongoDB ObjectId string
        
    Raises:
        HTTPException 404: If speaker not found
    """
    speaker = await get_speaker(speaker_id)
    speaker.is_active = False
    await speaker.save()
