"""
Debug script to check sentiment counting logic
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from db.mongo_models import FeedbackDocument, FeedbackAnalysisDocument, EventDocument, SpeakerDocument, EventAnalyticsDocument, EventReportDocument
import os
from dotenv import load_dotenv

load_dotenv()


async def debug_stats():
    # Initialize database connection (same as main app)
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    
    client = AsyncIOMotorClient(mongodb_url)
    database = client.feedback_system  # Use the same database name as main app
    
    await init_beanie(
        database=database,
        document_models=[
            SpeakerDocument,
            EventDocument,
            FeedbackDocument,
            FeedbackAnalysisDocument,
            EventAnalyticsDocument,
            EventReportDocument
        ]
    )
    # Get all events
    events = await EventDocument.find().to_list()
    
    print(f"Database name: feedback_system")
    print(f"Total events found: {len(events)}")
    
    if not events:
        print("\nNo events found. Let's check all collections:")
        
        # Check speakers
        speakers = await SpeakerDocument.find().to_list()
        print(f"  Speakers: {len(speakers)}")
        
        # Check feedbacks
        feedbacks = await FeedbackDocument.find().to_list()
        print(f"  Feedbacks: {len(feedbacks)}")
        
        if feedbacks:
            print("\nFound feedbacks! Let's analyze them:")
            for fb in feedbacks:
                print(f"\n  Feedback ID: {fb.id}")
                print(f"    Event ID: {fb.event_id}")
                print(f"    Quality: {fb.quality_decision}")
                print(f"    Text: {fb.raw_text[:50]}...")
                
                # Check analysis
                analysis = await FeedbackAnalysisDocument.find_one(
                    FeedbackAnalysisDocument.feedback_id == str(fb.id)
                )
                if analysis:
                    print(f"    Analysis: sentiment={analysis.sentiment}, confidence={analysis.confidence}")
                else:
                    print(f"    Analysis: NOT FOUND")
        
        return
    
    # Use the first event for debugging
    event_id = str(events[0].id)
    print(f"\n=== Debugging Event: {events[0].title} (ID: {event_id}) ===\n")
    
    # Get all feedbacks for this event
    all_feedbacks = await FeedbackDocument.find(
        FeedbackDocument.event_id == event_id
    ).to_list()
    
    print(f"Total feedbacks: {len(all_feedbacks)}\n")
    
    sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0, "pending": 0}
    
    for i, feedback in enumerate(all_feedbacks, 1):
        print(f"\nFeedback #{i}:")
        print(f"  ID: {feedback.id}")
        print(f"  Quality Decision: {feedback.quality_decision}")
        print(f"  Input Type: {feedback.input_type}")
        print(f"  Text: {feedback.raw_text[:50]}...")
        
        # Get analysis
        analysis = await FeedbackAnalysisDocument.find_one(
            FeedbackAnalysisDocument.feedback_id == str(feedback.id)
        )
        
        if analysis:
            print(f"  Analysis exists:")
            print(f"    Sentiment: {analysis.sentiment}")
            print(f"    Confidence: {analysis.confidence}")
        else:
            print(f"  ❌ No analysis found")
        
        # Count like the analytics handler does
        if feedback.quality_decision == "ACCEPT":
            if analysis and analysis.sentiment:
                sentiment = analysis.sentiment.lower()
                sentiment_counts[sentiment] += 1
                print(f"  ✓ Counted as {sentiment}")
            else:
                sentiment_counts["pending"] += 1
                print(f"  ⚠️  Counted as pending")
        else:
            print(f"  ⏭️  Skipped (not ACCEPT)")
    
    print("\n" + "="*60)
    print("SENTIMENT COUNTS (from analytics handler logic):")
    print(f"  Positive: {sentiment_counts['positive']}")
    print(f"  Negative: {sentiment_counts['negative']}")
    print(f"  Neutral: {sentiment_counts['neutral']}")
    print(f"  Pending: {sentiment_counts['pending']}")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(debug_stats())
