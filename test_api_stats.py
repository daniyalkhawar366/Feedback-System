"""
Test the analytics API endpoint to see what stats it returns
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from db.mongo_models import (
    SpeakerDocument, EventDocument, FeedbackDocument,
    FeedbackAnalysisDocument, EventAnalyticsDocument, EventReportDocument
)
from dotenv import load_dotenv
from handlers.analytics import get_event_stats

load_dotenv()


async def test_api():
    # Initialize database
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongodb_url)
    database = client.feedback_system
    
    await init_beanie(
        database=database,
        document_models=[
            SpeakerDocument, EventDocument, FeedbackDocument,
            FeedbackAnalysisDocument, EventAnalyticsDocument, EventReportDocument
        ]
    )
    
    # Get the first event  
    events = await EventDocument.find().to_list()
    if not events:
        print("No events found")
        return
    
    event = events[0]
    event_id = str(event.id)
    speaker_id = str(event.speaker_id)
    
    print(f"\n=== Testing API for Event: {event.title} ===")
    print(f"Event ID: {event_id}")
    print(f"Speaker ID: {speaker_id}")
    
    # Call the actual analytics handler
    print("\n--- Calling get_event_stats() ---")
    stats = await get_event_stats(event_id, speaker_id)
    
    print(f"\nTotal feedback: {stats['total_feedback']}")
    print(f"Valid feedback: {stats['valid_feedback']}")
    print("\nSentiment Distribution:")
    for sentiment, data in stats['sentiment_distribution'].items():
        print(f"  {sentiment.capitalize()}: {data['count']} ({data['percentage']}%)")
    
    print("\nQuality Breakdown:")
    for quality, count in stats['quality_breakdown'].items():
        print(f"  {quality}: {count}")
    
    # Also check if there's an EventAnalyticsDocument
    print("\n--- Checking EventAnalyticsDocument (from report generation) ---")
    analytics_doc = await EventAnalyticsDocument.find_one(
        EventAnalyticsDocument.event_id == event_id
    )
    
    if analytics_doc:
        print(f"Total responses (in doc): {analytics_doc.total_responses}")
        print(f"Positive count (in doc): {analytics_doc.positive_count}")
        print(f"Negative count (in doc): {analytics_doc.negative_count}")
        print(f"Neutral count (in doc): {analytics_doc.neutral_count}")
        print(f"Generated at: {analytics_doc.generated_at}")
    else:
        print("No EventAnalyticsDocument found")


if __name__ == "__main__":
    asyncio.run(test_api())
