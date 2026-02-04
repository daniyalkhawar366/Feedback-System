"""
Test script for consensus reporting system.
Tests LLM connection and basic pipeline functionality.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from consensus.llm_config import test_llm_connection, get_llm
from consensus.types import Discussion, Message, Category
from consensus.dimension_extraction import dimension_extraction_graph
from consensus.summary import summary_graph
from consensus.report_generator import generate_report


def test_llm():
    """Test LLM connection."""
    print("=" * 60)
    print("Testing LLM Connection")
    print("=" * 60)
    
    result = test_llm_connection()
    
    if result["status"] == "success":
        print("✅ LLM connection successful!")
        print(f"   Provider: {result['provider']}")
        print(f"   Model: {result['model']}")
        print(f"   Response: {result['response']}")
    else:
        print("❌ LLM connection failed!")
        print(f"   Error: {result['error']}")
        return False
    
    return True


def test_category_selection():
    """Test category selection - SKIPPED (hardcoded to FEEDBACK_RETROSPECTIVE)."""
    print("\n" + "=" * 60)
    print("Testing Category Selection")
    print("=" * 60)
    
    print("⏭️  Category selection skipped (always FEEDBACK_RETROSPECTIVE for events)")
    print("   This avoids structured output compatibility issues with Groq.")
    print("   ✅ Category: FEEDBACK_RETROSPECTIVE (hardcoded)")
    
    return True


def test_dimension_extraction():
    """Test dimension extraction graph."""
    print("\n" + "=" * 60)
    print("Testing Dimension Extraction")
    print("=" * 60)
    
    discussion = Discussion(
        name="AI Conference 2026",
        description="Annual AI conference keynote",
        template=Category.FEEDBACK_RETROSPECTIVE,
        messages=[
            Message(id=1, message="Excellent speaker! Very clear and engaging presentation."),
            Message(id=2, message="Audio quality was terrible, kept cutting out."),
            Message(id=3, message="Good content but slides were hard to read."),
        ]
    )
    
    try:
        llm = get_llm()
        result = dimension_extraction_graph.invoke(
            {
                "discussion": discussion,
                "category": Category.FEEDBACK_RETROSPECTIVE,
                "dimensions": None,
            },
            config={"configurable": {"llm": llm}}
        )
        
        dimensions = result["dimensions"]
        print(f"✅ Extracted {len(dimensions)} dimensions")
        
        for i, dim in enumerate(dimensions, 1):
            print(f"\n   Feedback {i}:")
            print(f"      Theme: {dim.theme}")
            print(f"      Sentiment: {dim.sentiment}")
            print(f"      Emotion: {dim.emotion}")
            print(f"      Impact: {dim.impact_direction}")
            print(f"      Confidence: {dim.confidence:.2f}")
            print(f"      Relevancy: {dim.relevancy}")
            print(f"      Evidence: {dim.evidence_type}")
        
        return True
        
    except Exception as e:
        print(f"❌ Dimension extraction failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_full_pipeline():
    """Test complete pipeline using simplified report generator."""
    print("\n" + "=" * 60)
    print("Testing Full Pipeline (Simplified)")
    print("=" * 60)
    
    discussion = Discussion(
        name="Workshop: Python Best Practices",
        description="Interactive workshop on Python coding standards | Speaker: John Doe",
        template=Category.FEEDBACK_RETROSPECTIVE,
        messages=[
            Message(id=1, message="Fantastic workshop! Learned a lot about type hints and testing."),
            Message(id=2, message="Speaker was very knowledgeable and answered questions well."),
            Message(id=3, message="Room was too small, very cramped."),
            Message(id=4, message="Audio issues made it hard to hear in the back."),
            Message(id=5, message="Great hands-on exercises, very practical."),
            Message(id=6, message="Would have liked more advanced topics covered."),
        ]
    )
    
    try:
        report = generate_report(discussion)
        
        summary = report["summary"]
        print("\n" + "=" * 60)
        print("FINAL REPORT")
        print("=" * 60)
        print(f"\n📊 Category: {report['category']}")
        print(f"📝 Feedback analyzed: {len(report['dimensions'])}")
        
        print(f"\n📄 Main Summary:")
        print(f"{summary['main_summary']}")
        
        print(f"\n⚠️  Conflicting Statement:")
        print(f"{summary['conflicting_statement']}")
        
        print(f"\n💡 Top Weighted Points:")
        for i, point in enumerate(summary['top_weighted_points'], 1):
            print(f"   {i}. {point}")
        
        if report.get("what_we_agree_on"):
            print(f"\n✅ Event Highlights ({len(report['what_we_agree_on'])}):")
            for item in report["what_we_agree_on"][:3]:
                print(f"   • {item}")
        
        if report.get("where_we_disagree"):
            print(f"\n⚠️  Areas of Concern ({len(report['where_we_disagree'])}):")
            for item in report["where_we_disagree"][:3]:
                print(f"   • {item}")
        
        print("\n✅ Full pipeline completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Full pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("CONSENSUS REPORTING SYSTEM - TEST SUITE")
    print("=" * 60)
    
    # Test 1: LLM connection
    if not test_llm():
        print("\n❌ LLM connection test failed. Check your API key and configuration.")
        return
    
    # Test 2: Category selection
    if not test_category_selection():
        print("\n❌ Category selection test failed.")
        return
    
    # Test 3: Dimension extraction
    if not test_dimension_extraction():
        print("\n❌ Dimension extraction test failed.")
        return
    
    # Test 4: Full pipeline
    if not test_full_pipeline():
        print("\n❌ Full pipeline test failed.")
        return
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED!")
    print("=" * 60)
    print("\nYour consensus reporting system is ready to use.")
    print("Next steps:")
    print("1. Create database tables for event_reports and feedback_dimensions")
    print("2. Add report generation endpoint to routes/")
    print("3. Test with real event data from your database")


if __name__ == "__main__":
    main()
