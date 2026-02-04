"""
Migration script to create EventReport and FeedbackDimension tables
Run this once to add the new consensus reporting tables.
"""

from db.db import engine
from db.model import SQLModel

def run_migration():
    """Create new consensus reporting tables"""
    print("Creating EventReport and FeedbackDimension tables...")
    
    # This will only create tables that don't exist yet
    SQLModel.metadata.create_all(engine)
    
    print("✅ Migration complete! Tables created:")
    print("  - EventReport")
    print("  - FeedbackDimension")
    print("\nYou can now generate consensus reports for events.")

if __name__ == "__main__":
    run_migration()
