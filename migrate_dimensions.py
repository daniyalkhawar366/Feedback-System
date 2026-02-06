"""
Database migration script to update FeedbackAnalysis table with new dimension columns.
Run this after updating the model to add the new fields.
"""

from sqlmodel import create_engine, Session
from db.db import engine
from db.model import FeedbackAnalysis
import sys

def migrate_dimensions():
    """
    This script will help migrate the database by recreating tables.
    
    WARNING: This will drop and recreate the FeedbackAnalysis table.
    Existing analysis data will be lost (which is fine since we'll regenerate reports).
    """
    
    print("🔄 Starting database migration for dimension tracking...")
    print("\n⚠️  WARNING: This will drop the FeedbackAnalysis table and recreate it.")
    print("   All existing analysis data will be lost (can be regenerated).")
    
    confirm = input("\nContinue? (yes/no): ")
    if confirm.lower() != "yes":
        print("❌ Migration cancelled.")
        sys.exit(0)
    
    try:
        # Drop and recreate tables
        from sqlmodel import SQLModel
        from db.model import (
            Speaker, Event, Feedback, FeedbackAnalysis, EventReport
        )
        
        print("\n📋 Dropping FeedbackAnalysis table...")
        with engine.begin() as conn:
            conn.execute(text("DROP TABLE IF EXISTS feedbackanalysis CASCADE"))
        
        print("✅ Creating new FeedbackAnalysis table with dimension columns...")
        SQLModel.metadata.create_all(engine)
        
        print("\n✅ Migration completed successfully!")
        print("\n📝 Next steps:")
        print("   1. Start your backend server")
        print("   2. Generate reports for your events to extract dimensions")
        print("   3. Check the feedbackanalysis table to see the extracted dimensions")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    from sqlalchemy import text
    migrate_dimensions()
