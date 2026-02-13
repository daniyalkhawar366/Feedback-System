"""
MongoDB Connection Manager

Handles async MongoDB connection using Motor and Beanie ODM.
Provides connection lifecycle management and database access.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

# Global MongoDB client
mongodb_client: Optional[AsyncIOMotorClient] = None


async def connect_to_mongo():
    """
    Initialize MongoDB connection and Beanie ODM.
    
    Connects to MongoDB using the MONGODB_URL from environment variables,
    then initializes Beanie with all document models.
    
    Raises:
        Exception: If connection fails or models can't be initialized
    """
    global mongodb_client
    
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    
    try:
        # Create async MongoDB client
        mongodb_client = AsyncIOMotorClient(mongodb_url)
        
        # Test connection
        await mongodb_client.admin.command('ping')
        
        # Import all document models
        from db.mongo_models import (
            SpeakerDocument,
            EventDocument,
            FeedbackDocument,
            FeedbackAnalysisDocument,
            EventAnalyticsDocument,
            EventReportDocument
        )
        
        # Initialize Beanie with the database and models
        await init_beanie(
            database=mongodb_client.feedback_system,
            document_models=[
                SpeakerDocument,
                EventDocument,
                FeedbackDocument,
                FeedbackAnalysisDocument,
                EventAnalyticsDocument,
                EventReportDocument
            ]
        )
        
        print("✅ Connected to MongoDB successfully")
        
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """
    Close MongoDB connection gracefully.
    
    Should be called during application shutdown.
    """
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        print("❌ MongoDB connection closed")


def get_database():
    """
    Get MongoDB database instance.
    
    Returns:
        AsyncIOMotorDatabase: The feedback_system database
        
    Raises:
        Exception: If MongoDB is not connected
    """
    if not mongodb_client:
        raise Exception("MongoDB not connected. Call connect_to_mongo() first.")
    return mongodb_client.feedback_system
