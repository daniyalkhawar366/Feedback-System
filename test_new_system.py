"""
Quick Guide: Testing the NEW Consensus Reporting System
=========================================================

The new system is SEPARATE from analytics. It uses LLM + LangGraph.

Test Methods:
"""

# ============================================================
# METHOD 1: Direct Python Test (Fastest)
# ============================================================
print("\n" + "="*60)
print("METHOD 1: Direct Python Test")
print("="*60)

from db.db import Session, engine
from consensus.report_generator import generate_report_for_event

with Session(engine) as session:
    print("\nGenerating report for Event 1...")
    report = generate_report_for_event(event_id=1, db_session=session)
    
    print(f"\n✅ Report Generated!")
    print(f"Category: {report['category']}")
    print(f"Feedback: {report['feedback_count']}")
    print(f"\nMain Summary:\n{report['summary']['main_summary'][:300]}...")
    print(f"\nHighlights:")
    for h in report.get('what_we_agree_on', []):
        print(f"  ✅ {h}")


# ============================================================
# METHOD 2: API Test with curl
# ============================================================
print("\n\n" + "="*60)
print("METHOD 2: Test via API (curl)")
print("="*60)
print("""
1. Start server (if not running):
   python -m uvicorn main:app --port 8000

2. Generate report:
   curl -X POST http://127.0.0.1:8000/api/reports/events/1/generate

3. Get latest report:
   curl http://127.0.0.1:8000/api/reports/events/1/latest

4. Get report history:
   curl http://127.0.0.1:8000/api/reports/events/1/history
""")


# ============================================================
# METHOD 3: API Test with Python requests
# ============================================================
print("\n" + "="*60)
print("METHOD 3: Test via API (Python)")
print("="*60)

import requests

try:
    # Check if server is running
    response = requests.get("http://127.0.0.1:8000/docs", timeout=2)
    print("\n✅ Server is running at http://127.0.0.1:8000")
    print("\nGenerating report via API...")
    
    # Generate report
    response = requests.post(
        "http://127.0.0.1:8000/api/reports/events/1/generate",
        timeout=120  # 2 min timeout
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ Report Generated via API!")
        print(f"Report ID: {data['report_id']}")
        print(f"Event: {data['event_title']}")
        print(f"Generation Time: {data['generation_time']}s")
        print(f"\nMain Summary:\n{data['summary']['main_summary'][:300]}...")
    else:
        print(f"\n❌ Error: {response.status_code}")
        print(response.text)
        
except requests.exceptions.ConnectionError:
    print("\n❌ Server not running!")
    print("Start it with: python -m uvicorn main:app --port 8000")
except Exception as e:
    print(f"\n❌ Error: {e}")


# ============================================================
# COMPARISON: OLD vs NEW
# ============================================================
print("\n\n" + "="*60)
print("OLD Analytics vs NEW Consensus Reports")
print("="*60)
print("""
┌──────────────────┬─────────────────────┬──────────────────────┐
│ Feature          │ OLD Analytics       │ NEW Consensus Report │
├──────────────────┼─────────────────────┼──────────────────────┤
│ Route            │ /analytics/...      │ /api/reports/...     │
│ Speed            │ Instant             │ 10-90 seconds        │
│ Model            │ RoBERTa (sentiment) │ LLM + LangGraph      │
│ Output           │ Sentiment %         │ Themes, consensus    │
│ Storage          │ EventSummary        │ EventReport          │
│ Detail Level     │ Basic               │ Comprehensive        │
│ Use Case         │ Quick overview      │ Deep analysis        │
└──────────────────┴─────────────────────┴──────────────────────┘

Both systems work together!
- Use OLD for quick sentiment check
- Use NEW for detailed consensus analysis
""")

print("\n" + "="*60)
print("Ready to test! Run this file:")
print("python test_new_system.py")
print("="*60)
