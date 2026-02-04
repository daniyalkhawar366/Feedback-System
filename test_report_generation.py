"""Test generating a consensus report for Event 1"""
from db.db import Session, engine
from consensus.report_generator import generate_report_for_event
import time

print("=" * 60)
print("Testing Consensus Report Generation")
print("=" * 60)

with Session(engine) as session:
    event_id = 1
    
    print(f"\n📊 Generating report for Event {event_id}...")
    print("This will take 30-90 seconds due to LLM processing...")
    
    start = time.time()
    
    try:
        report = generate_report_for_event(
            event_id=event_id,
            db_session=session,
            min_feedback_count=5
        )
        
        elapsed = time.time() - start
        
        print(f"\n✅ Report generated successfully in {elapsed:.1f} seconds!")
        print("=" * 60)
        
        print(f"\n📋 CATEGORY: {report['category']}")
        print(f"📈 FEEDBACK COUNT: {report['feedback_count']}")
        print(f"📅 EVENT: {report['event_name']}")
        
        print("\n" + "=" * 60)
        print("📝 MAIN SUMMARY")
        print("=" * 60)
        print(report['summary']['main_summary'])
        
        if report['summary']['conflicting_statement']:
            print("\n" + "=" * 60)
            print("⚠️  CONFLICTING STATEMENT")
            print("=" * 60)
            print(report['summary']['conflicting_statement'])
        
        print("\n" + "=" * 60)
        print("⭐ TOP WEIGHTED POINTS")
        print("=" * 60)
        for i, point in enumerate(report['summary']['top_weighted_points'], 1):
            print(f"{i}. {point}")
        
        if report.get('what_we_agree_on'):
            print("\n" + "=" * 60)
            print("✅ WHAT WE AGREE ON")
            print("=" * 60)
            for item in report['what_we_agree_on']:
                print(f"• {item}")
        
        if report.get('where_we_disagree'):
            print("\n" + "=" * 60)
            print("❌ WHERE WE DISAGREE")
            print("=" * 60)
            for item in report['where_we_disagree']:
                print(f"• {item}")
        
        if report.get('what_to_decide_next'):
            print("\n" + "=" * 60)
            print("🤔 WHAT TO DECIDE NEXT")
            print("=" * 60)
            for item in report['what_to_decide_next']:
                print(f"• {item}")
        
        print("\n" + "=" * 60)
        print("📊 DIMENSIONS EXTRACTED")
        print("=" * 60)
        for dim in report['dimensions'][:5]:  # Show first 5
            print(f"\nTheme: {dim['theme']}")
            print(f"  Sentiment: {dim['sentiment']}")
            print(f"  Emotion: {dim.get('emotion', 'N/A')}")
            print(f"  Impact: {dim.get('impact_direction', 'N/A')}")
            print(f"  Confidence: {dim['confidence']:.2f}")
            print(f"  Relevancy: {dim['relevancy']}")
        
        print("\n" + "=" * 60)
        print("✅ Test Complete!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
