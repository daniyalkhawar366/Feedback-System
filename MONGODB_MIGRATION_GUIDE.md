# MongoDB Migration Guide

Complete guide for migrating the Intelligent Feedback System from SQLite to MongoDB.

## 📋 Overview

This migration converts the application from:
- **SQLModel + SQLite** (sync, file-based)
- **Beanie + MongoDB** (async, document-based)

## 🎯 Why MongoDB?

- ✅ **Cloud-ready**: Works with MongoDB Atlas for easy Vercel deployment
- ✅ **Async**: Native FastAPI async/await support
- ✅ **Scalable**: Better performance for large datasets
- ✅ **Flexible schema**: Easier to modify structure
- ✅ **No file management**: No need to handle .db files

---

## 📦 Step 1: Install MongoDB Dependencies

```powershell
# Activate virtual environment
.\myvenv\Scripts\Activate.ps1

# Install MongoDB packages
pip install motor beanie pymongo

# Or install from updated requirements.txt
pip install -r requirements.txt
```

**Packages installed:**
- `motor>=3.3.0` - Async MongoDB driver
- `beanie>=1.23.0` - ODM (like SQLModel but for MongoDB)
- `pymongo>=4.6.0` - MongoDB Python driver

---

## 🗄️ Step 2: Setup MongoDB

### Option A: Local MongoDB (Docker - Recommended for development)

```powershell
# Run MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Verify it's running
docker ps
```

### Option B: MongoDB Atlas (Cloud - Recommended for production)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster (Free M0 tier available)
4. Click "Connect" → "Connect your application"
5. Copy connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/...`)

### Option C: Local MongoDB Installation

Download from: https://www.mongodb.com/try/download/community

---

## ⚙️ Step 3: Update Environment Variables

Update your `.env` file:

```env
# NEW: MongoDB connection string
MONGODB_URL=mongodb://localhost:27017
# OR for MongoDB Atlas:
# MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/feedback_system?retryWrites=true&w=majority

# Keep these the same
SECRET_KEY=your-super-secret-key
GROQ_API_KEY=your-groq-api-key

# Optional: Keep for migration script
DATABASE_URL=sqlite:///./feedback_system.db
```

**Important:** Replace `username` and `password` in the Atlas connection string with your actual credentials!

---

## 🔄 Step 4: Run Data Migration

This script transfers all existing data from SQLite to MongoDB:

```powershell
# Make sure MongoDB is running first!

# Run migration script
python migrate_to_mongodb.py
```

**What it migrates:**
- ✅ Speakers (users)
- ✅ Events
- ✅ Feedbacks
- ✅ Feedback Analysis
- ✅ Event Analytics
- ✅ Event Reports

**Expected output:**
```
🚀 STARTING SQLITE TO MONGODB MIGRATION
📡 Connecting to MongoDB...
✅ Connected to MongoDB successfully

============================================================
MIGRATING SPEAKERS
============================================================
✅ Migrated speaker: John Doe (john@example.com)
...

✅ MIGRATION COMPLETED SUCCESSFULLY!
```

---

## 🔧 Step 5: Update Application Code

### Current Status

**Already Updated:**
- ✅ `requirements.txt` - Added MongoDB dependencies
- ✅ `db/mongodb.py` - MongoDB connection manager
- ✅ `db/mongo_models.py` - Beanie document models
- ✅ `main.py` - Uses MongoDB on startup/shutdown
- ✅ `handlers/speaker_mongo.py` - Example async handler
- ✅ `migrate_to_mongodb.py` - Data migration script

**Still Need Updates:**
- ⏳ `handlers/event.py` → Make async, use EventDocument
- ⏳ `handlers/feedback.py` → Make async, use FeedbackDocument
- ⏳ `handlers/analytics.py` → Make async, use MongoDB aggregations
- ⏳ `routes/*.py` → Update all route functions to async
- ⏳ `helpers/auth.py` → Update authentication to use MongoDB

---

## 📝 Code Migration Pattern

### Before (SQLModel - Sync):
```python
from sqlmodel import Session, select
from db.model import Speaker

def create_speaker(data: SpeakerCreate, session: Session):
    speaker = Speaker(**data.model_dump())
    session.add(speaker)
    session.commit()
    session.refresh(speaker)
    return speaker

def get_speaker(speaker_id: int, session: Session):
    return session.get(Speaker, speaker_id)
```

### After (Beanie - Async):
```python
from db.mongo_models import SpeakerDocument

async def create_speaker(data: SpeakerCreate):
    speaker = SpeakerDocument(**data.model_dump())
    await speaker.insert()
    return speaker

async def get_speaker(speaker_id: str):
    return await SpeakerDocument.get(speaker_id)
```

### Key Changes:
1. ✅ Add `async` to function definitions
2. ✅ Add `await` to database operations
3. ✅ Remove `session: Session` parameter
4. ✅ Change ID type from `int` to `str` (MongoDB ObjectIds)
5. ✅ Use `SpeakerDocument` instead of `Speaker`
6. ✅ Use `.insert()`, `.get()`, `.find_one()` instead of SQLModel methods

---

## 🧪 Step 6: Testing

### Test MongoDB Connection

```python
# test_mongodb.py
import asyncio
from db.mongodb import connect_to_mongo, close_mongo_connection
from db.mongo_models import SpeakerDocument

async def test():
    await connect_to_mongo()
    
    # Test query
    speakers = await SpeakerDocument.find_all().to_list()
    print(f"Found {len(speakers)} speakers")
    
    await close_mongo_connection()

asyncio.run(test())
```

### Test API

```powershell
# Start server
uvicorn main:app --reload

# In another terminal, test endpoints
curl http://localhost:8000/health
```

---

## 📊 MongoDB vs SQLite Comparison

| Operation | SQLite/SQLModel | MongoDB/Beanie |
|-----------|----------------|----------------|
| Create | `session.add(obj); session.commit()` | `await obj.insert()` |
| Read One | `session.get(Model, id)` | `await Model.get(id)` |
| Read Many | `session.exec(select(Model)).all()` | `await Model.find_all().to_list()` |
| Update | `setattr(); session.commit()` | `setattr(); await obj.save()` |
| Delete | `session.delete(obj); session.commit()` | `await obj.delete()` |
| Find | `session.exec(select(M).where(...))` | `await Model.find(M.field == value)` |
| ID Type | `int` (auto-increment) | `str` (ObjectId) |
| Sync/Async | Sync (blocking) | Async (non-blocking) |

---

## 🚀 Deployment Considerations

### For Vercel Deployment:

1. **Frontend (Next.js)** → Deploy to Vercel
2. **Backend (FastAPI)** → Deploy to:
   - Railway (easiest, supports FastAPI + MongoDB)
   - Render (free tier available)
   - DigitalOcean App Platform
   - Fly.io

3. **MongoDB** → Use MongoDB Atlas (cloud)

### Environment Variables for Production:

```env
# MongoDB Atlas connection (replace with real values)
MONGODB_URL=mongodb+srv://production_user:secure_password@cluster.mongodb.net/feedback_system?retryWrites=true&w=majority

# Generate secure secret key
SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")

# Your Groq API key
GROQ_API_KEY=gsk_...
```

---

## 🐛 Troubleshooting

### Issue: "MongoDB not connected"
**Solution:** Make sure MongoDB is running and `MONGODB_URL` is correct in `.env`

### Issue: "Module 'motor' not found"
**Solution:** Run `pip install motor beanie pymongo`

### Issue: "Connection refused" (Docker)
**Solution:** Start MongoDB: `docker start mongodb`

### Issue: "Authentication failed" (Atlas)
**Solution:** Check username/password in connection string, enable IP whitelist

### Issue: "Duplicate key error"
**Solution:** Clear MongoDB collections before re-running migration

---

## 📚 Resources

- **Beanie Docs**: https://roman-right.github.io/beanie/
- **Motor Docs**: https://motor.readthedocs.io/
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **FastAPI Async**: https://fastapi.tiangolo.com/async/

---

## ✅ Migration Checklist

- [ ] Install MongoDB (Docker/Atlas/Local)
- [ ] Install Python packages (`pip install -r requirements.txt`)
- [ ] Update `.env` with `MONGODB_URL`
- [ ] Start MongoDB server
- [ ] Run migration script (`python migrate_to_mongodb.py`)
- [ ] Verify data in MongoDB
- [ ] Update all handlers to async
- [ ] Update all routes to async
- [ ] Test API endpoints
- [ ] Deploy to production

---

## 🎉 Next Steps After Migration

1. Test all API endpoints
2. Update frontend API calls if needed
3. Setup MongoDB backups
4. Configure MongoDB Atlas security
5. Deploy to production
6. (Optional) Remove SQLite files after verifying everything works
