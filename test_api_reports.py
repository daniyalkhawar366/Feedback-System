"""Test the reports API endpoint"""
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

print("=" * 70)
print("Testing Reports API Endpoint")
print("=" * 70)

# Test 1: Generate report
print("\n🚀 Test 1: POST /api/reports/events/1/generate")
print("This will take 30-90 seconds...")

start = time.time()
response = requests.post(f"{BASE_URL}/api/reports/events/1/generate")
elapsed = time.time() - start

print(f"Status Code: {response.status_code}")
print(f"Generation Time: {elapsed:.1f} seconds")

if response.status_code == 200:
    data = response.json()
    print(f"\n✅ Report Generated Successfully!")
    print(f"   Report ID: {data['report_id']}")
    print(f"   Event: {data['event_title']}")
    print(f"   Category: {data['category']}")
    print(f"   Feedback Count: {data['feedback_count']}")
    print(f"   Generation Time: {data['generation_time']}s")
    
    print(f"\n📝 Main Summary:")
    print(f"   {data['summary']['main_summary'][:200]}...")
    
    print(f"\n⭐ Top Points:")
    for i, point in enumerate(data['summary']['top_weighted_points'][:3], 1):
        print(f"   {i}. {point[:80]}...")
    
    print(f"\n✅ Highlights ({len(data['highlights'])}):")
    for h in data['highlights']:
        print(f"   • {h}")
    
    print(f"\n❌ Concerns ({len(data['concerns'])}):")
    for c in data['concerns']:
        print(f"   • {c}")
else:
    print(f"❌ Error: {response.text}")

# Test 2: Get latest report
print("\n" + "=" * 70)
print("🚀 Test 2: GET /api/reports/events/1/latest")

response = requests.get(f"{BASE_URL}/api/reports/events/1/latest")
print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"✅ Latest report retrieved!")
    print(f"   Report ID: {data['report_id']}")
    print(f"   Generated At: {data['generated_at']}")
    print(f"   Feedback Count: {data['feedback_count']}")
else:
    print(f"❌ Error: {response.text}")

# Test 3: Get report history
print("\n" + "=" * 70)
print("🚀 Test 3: GET /api/reports/events/1/history")

response = requests.get(f"{BASE_URL}/api/reports/events/1/history")
print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"✅ Report history retrieved!")
    print(f"   Total Reports: {data['total_reports']}")
    for r in data['reports']:
        print(f"   • Report {r['report_id']}: {r['generated_at']} ({r['feedback_count']} feedback, {r['generation_time']:.1f}s)")
else:
    print(f"❌ Error: {response.text}")

print("\n" + "=" * 70)
print("✅ All Tests Complete!")
print("=" * 70)
