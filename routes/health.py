"""
Health check routes - MongoDB Version
"""
from fastapi import APIRouter, HTTPException
from handlers.health import check_db_health, check_health

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def check():
    """Basic health check endpoint"""
    return await check_health()


@router.get("/db")
async def check_db():
    """Database health check endpoint"""
    try:
        return await check_db_health()
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Database connection failed: {str(e)}"
        )
