"""
Health check handlers - MongoDB Version
"""
from db.mongodb import mongodb_client


async def check_health() -> dict:
    """Basic health check"""
    return {"status": "healthy"}


async def check_db_health() -> dict:
    """Check MongoDB connection health"""
    try:
        if mongodb_client is None:
            return {"status": "unhealthy", "mongodb": "not connected"}
        
        # Ping MongoDB to verify connection
        await mongodb_client.admin.command('ping')
        return {"status": "healthy", "mongodb": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "mongodb": f"error: {str(e)}"}
