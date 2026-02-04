"""
Script to clear all feedbacks and analysis for testing
"""
from sqlmodel import Session, select
from db.db import engine
from db.model import Feedback, FeedbackAnalysis, EventReport

def clear_all_feedbacks():
    """Delete all feedbacks, analysis, and reports"""
    with Session(engine) as session:
        # Delete all reports
        reports = session.exec(select(EventReport)).all()
        for report in reports:
            session.delete(report)
        print(f"✅ Deleted {len(reports)} reports")
        
        # Delete all feedback analysis
        analyses = session.exec(select(FeedbackAnalysis)).all()
        for analysis in analyses:
            session.delete(analysis)
        print(f"✅ Deleted {len(analyses)} feedback analyses")
        
        # Delete all feedback
        feedbacks = session.exec(select(Feedback)).all()
        for feedback in feedbacks:
            session.delete(feedback)
        print(f"✅ Deleted {len(feedbacks)} feedbacks")
        
        session.commit()
        print("\n🎉 Database cleared! Ready for new test data.")

if __name__ == "__main__":
    confirm = input("⚠️  This will DELETE ALL feedbacks and reports. Type 'YES' to confirm: ")
    if confirm == "YES":
        clear_all_feedbacks()
    else:
        print("❌ Cancelled")
