"""
Quick test script to verify MongoDB Atlas connection
"""
import asyncio
from db.mongodb import connect_to_mongo, close_mongo_connection

async def test_connection():
    print("🔌 Testing MongoDB Atlas connection...")
    try:
        await connect_to_mongo()
        print("✅ SUCCESS! Connected to MongoDB Atlas")
        print("✅ Database: feedbackdb")
        print("✅ Connection is working!")
    except Exception as e:
        print(f"❌ FAILED: {e}")
        print("\n💡 Common fixes:")
        print("   1. Check username/password in .env file")
        print("   2. Check IP whitelist (add 0.0.0.0/0 in Network Access)")
        print("   3. URL encode special characters in password")
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(test_connection())
