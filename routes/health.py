from fastapi import APIRouter, HTTPException
from handlers.health import check_db_health,check_health

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/")
def check():
    return check_health()

@router.get("/db")
def check_db():
    try:
        return check_db_health()
    except Exception:
        raise HTTPException(status_code=503,detail="db is down")