"""
SQLite to MongoDB Migration Script

Migrates all data from SQLite database to MongoDB.
Run this once after setting up MongoDB connection.

Usage:
    python migrate_to_mongodb.py
"""

import asyncio
from sqlmodel import Session, select
from db.db import engine
from db.model import (
    Speaker, Event, Feedback, FeedbackAnalysis,
    EventAnalytics, EventReport
)
from db.mongodb import connect_to_mongo, close_mongo_connection
from db.mongo_models import (
    SpeakerDocument,
    EventDocument,
    FeedbackDocument,
    FeedbackAnalysisDocument,
    EventAnalyticsDocument,
    EventReportDocument
)
from typing import Dict


async def migrate_speakers() -> Dict[int, str]:
    """
    Migrate speakers from SQLite to MongoDB.
    
    Returns:
        Dict mapping old integer IDs to new MongoDB ObjectId strings
    """
    print("\n" + "="*60)
    print("MIGRATING SPEAKERS")
    print("="*60)
    
    with Session(engine) as session:
        speakers = session.exec(select(Speaker)).all()
        
        if not speakers:
            print("❌ No speakers found in SQLite database")
            return {}
        
        id_mapping = {}
        
        for speaker in speakers:
            mongo_speaker = SpeakerDocument(
                name=speaker.name,
                email=speaker.email,
                password_hash=speaker.password_hash,
                is_active=speaker.is_active,
                role=speaker.role,
                created_at=speaker.created_at,
                last_login_at=speaker.last_login_at
            )
            await mongo_speaker.insert()
            id_mapping[speaker.id] = str(mongo_speaker.id)
            print(f"✅ Migrated speaker: {speaker.name} ({speaker.email})")
        
        print(f"\n✅ Total speakers migrated: {len(id_mapping)}")
        return id_mapping


async def migrate_events(speaker_mapping: Dict[int, str]) -> Dict[int, str]:
    """
    Migrate events from SQLite to MongoDB.
    
    Args:
        speaker_mapping: Dictionary mapping old speaker IDs to new MongoDB IDs
        
    Returns:
        Dict mapping old event IDs to new MongoDB ObjectId strings
    """
    print("\n" + "="*60)
    print("MIGRATING EVENTS")
    print("="*60)
    
    with Session(engine) as session:
        events = session.exec(select(Event)).all()
        
        if not events:
            print("❌ No events found in SQLite database")
            return {}
        
        id_mapping = {}
        
        for event in events:
            mongo_event = EventDocument(
                speaker_id=speaker_mapping[event.speaker_id],
                title=event.title,
                description=event.description,
                event_date=event.event_date,
                public_token=event.public_token,
                is_active=event.is_active,
                feedback_open_at=event.feedback_open_at,
                feedback_close_at=event.feedback_close_at,
                analysis_status=event.analysis_status,
                created_at=event.created_at
            )
            await mongo_event.insert()
            id_mapping[event.id] = str(mongo_event.id)
            print(f"✅ Migrated event: {event.title} (Token: {event.public_token})")
        
        print(f"\n✅ Total events migrated: {len(id_mapping)}")
        return id_mapping


async def migrate_feedbacks(event_mapping: Dict[int, str]) -> Dict[int, str]:
    """
    Migrate feedbacks from SQLite to MongoDB.
    
    Args:
        event_mapping: Dictionary mapping old event IDs to new MongoDB IDs
        
    Returns:
        Dict mapping old feedback IDs to new MongoDB ObjectId strings
    """
    print("\n" + "="*60)
    print("MIGRATING FEEDBACKS")
    print("="*60)
    
    with Session(engine) as session:
        feedbacks = session.exec(select(Feedback)).all()
        
        if not feedbacks:
            print("❌ No feedbacks found in SQLite database")
            return {}
        
        id_mapping = {}
        
        for feedback in feedbacks:
            mongo_feedback = FeedbackDocument(
                event_id=event_mapping[feedback.event_id],
                input_type=feedback.input_type,
                raw_text=feedback.raw_text,
                normalized_text=feedback.normalized_text,
                audio_path=feedback.audio_path,
                audio_duration_sec=feedback.audio_duration_sec,
                language=feedback.language,
                quality_decision=feedback.quality_decision,
                quality_flags=feedback.quality_flags,
                created_at=feedback.created_at
            )
            await mongo_feedback.insert()
            id_mapping[feedback.id] = str(mongo_feedback.id)
            
            # Print progress every 50 feedbacks
            if len(id_mapping) % 50 == 0:
                print(f"⏳ Migrated {len(id_mapping)} feedbacks...")
        
        print(f"\n✅ Total feedbacks migrated: {len(id_mapping)}")
        return id_mapping


async def migrate_feedback_analysis(feedback_mapping: Dict[int, str]):
    """
    Migrate feedback analysis from SQLite to MongoDB.
    
    Args:
        feedback_mapping: Dictionary mapping old feedback IDs to new MongoDB IDs
    """
    print("\n" + "="*60)
    print("MIGRATING FEEDBACK ANALYSIS")
    print("="*60)
    
    with Session(engine) as session:
        analyses = session.exec(select(FeedbackAnalysis)).all()
        
        if not analyses:
            print("❌ No feedback analyses found in SQLite database")
            return
        
        count = 0
        
        for analysis in analyses:
            mongo_analysis = FeedbackAnalysisDocument(
                feedback_id=feedback_mapping[analysis.feedback_id],
                sentiment=analysis.sentiment,
                confidence=analysis.confidence,
                intent=analysis.intent,
                aspects=analysis.aspects,
                issue_label=analysis.issue_label,
                evidence_quote=analysis.evidence_quote,
                created_at=analysis.created_at
            )
            await mongo_analysis.insert()
            count += 1
            
            # Print progress every 50 analyses
            if count % 50 == 0:
                print(f"⏳ Migrated {count} analyses...")
        
        print(f"\n✅ Total analyses migrated: {count}")


async def migrate_event_analytics(event_mapping: Dict[int, str]):
    """
    Migrate event analytics from SQLite to MongoDB.
    
    Args:
        event_mapping: Dictionary mapping old event IDs to new MongoDB IDs
    """
    print("\n" + "="*60)
    print("MIGRATING EVENT ANALYTICS")
    print("="*60)
    
    with Session(engine) as session:
        analytics = session.exec(select(EventAnalytics)).all()
        
        if not analytics:
            print("❌ No event analytics found in SQLite database")
            return
        
        count = 0
        
        for analytic in analytics:
            mongo_analytic = EventAnalyticsDocument(
                event_id=event_mapping[analytic.event_id],
                total_responses=analytic.total_responses,
                positive_count=analytic.positive_count,
                neutral_count=analytic.neutral_count,
                negative_count=analytic.negative_count,
                satisfaction_score=analytic.satisfaction_score,
                top_strengths=analytic.top_strengths,
                top_issues=analytic.top_issues,
                intent_summary=analytic.intent_summary,
                generated_at=analytic.generated_at
            )
            await mongo_analytic.insert()
            count += 1
            print(f"✅ Migrated analytics for event ID: {analytic.event_id}")
        
        print(f"\n✅ Total analytics migrated: {count}")


async def migrate_event_reports(event_mapping: Dict[int, str]):
    """
    Migrate event reports from SQLite to MongoDB.
    
    Args:
        event_mapping: Dictionary mapping old event IDs to new MongoDB IDs
    """
    print("\n" + "="*60)
    print("MIGRATING EVENT REPORTS")
    print("="*60)
    
    with Session(engine) as session:
        reports = session.exec(select(EventReport)).all()
        
        if not reports:
            print("❌ No event reports found in SQLite database")
            return
        
        count = 0
        
        for report in reports:
            mongo_report = EventReportDocument(
                event_id=event_mapping[report.event_id],
                executive_summary=report.executive_summary,
                strengths=report.strengths,
                improvements=report.improvements,
                recommendations=report.recommendations,
                representative_quotes=report.representative_quotes,
                created_at=report.created_at
            )
            await mongo_report.insert()
            count += 1
            print(f"✅ Migrated report for event ID: {report.event_id}")
        
        print(f"\n✅ Total reports migrated: {count}")


async def main():
    """Main migration function."""
    print("\n" + "🚀"*30)
    print("STARTING SQLITE TO MONGODB MIGRATION")
    print("🚀"*30)
    
    # Connect to MongoDB
    print("\n📡 Connecting to MongoDB...")
    await connect_to_mongo()
    
    try:
        # Migrate in order (respecting foreign key relationships)
        speaker_mapping = await migrate_speakers()
        event_mapping = await migrate_events(speaker_mapping)
        feedback_mapping = await migrate_feedbacks(event_mapping)
        await migrate_feedback_analysis(feedback_mapping)
        await migrate_event_analytics(event_mapping)
        await migrate_event_reports(event_mapping)
        
        print("\n" + "="*60)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("="*60)
        print("\n📊 Summary:")
        print(f"  • Speakers: {len(speaker_mapping)}")
        print(f"  • Events: {len(event_mapping)}")
        print(f"  • Feedbacks: {len(feedback_mapping)}")
        print("\n💡 Next steps:")
        print("  1. Verify data in MongoDB")
        print("  2. Update handlers to use MongoDB")
        print("  3. Test the application")
        print("  4. (Optional) Backup and remove SQLite database\n")
        
    except Exception as e:
        print(f"\n❌ MIGRATION FAILED: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())
