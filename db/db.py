
from typing import Annotated
from fastapi.params import Depends
from sqlmodel import SQLModel, Session, create_engine,text
from dotenv import load_dotenv
import os
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine=create_engine(DATABASE_URL,echo=True)

def create_db_and_tables():
    from db import model
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

def check_db_connection() -> None:
    
    with Session(engine) as session:
        session.exec(text("SELECT 1"))