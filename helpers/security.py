import bcrypt
from sqlmodel import Session, select
from db.model import Speaker

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    password_bytes = password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

def authenticate_speaker(session: Session, identifier: str, password: str):
    # Try to find speaker by email or username
    speaker = session.exec(
        select(Speaker).where(
            (Speaker.email == identifier) | (Speaker.name == identifier)
        )
    ).first()

    if not speaker:
        return None

    if not verify_password(password, speaker.password_hash):
        return None

    return speaker
