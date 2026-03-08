# 🚀 Deployment Guide - Feedback System

## Overview
- **Frontend**: Vercel (Next.js)
- **Backend**: Railway (FastAPI)
- **Database**: MongoDB Atlas (already configured)

---

## 1️⃣ Backend Deployment (Railway)

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub (free tier available)

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `Feedback-System` repository
4. Railway will auto-detect Python

### Step 3: Configure Environment Variables
In Railway dashboard, add these variables:

```bash
# MongoDB
MONGODB_URL=mongodb+srv://your-connection-string

# JWT Secret (generate new with: python -c "import secrets; print(secrets.token_urlsafe(32))")
SECRET_KEY=your-super-secret-key-change-this-in-production

# Groq API
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.3-70b-versatile

# Environment (activates production optimizations)
ENVIRONMENT=production

# CORS (Vercel domain - add after deploying frontend)
FRONTEND_URL=https://your-app.vercel.app

# Optional - if using custom domain
# BACKEND_URL=https://your-backend.railway.app
```

**Important Notes:**
- `ENVIRONMENT=production` enables cloud-based audio transcription (uses Groq API instead of heavy local models)
- Railway automatically sets `RAILWAY_ENVIRONMENT` variable
- Generate a strong `SECRET_KEY` - don't use the one from .env!

### Step 4: Deploy
- Railway automatically deploys on push to main branch
- Get your backend URL: `https://feedback-system-production.up.railway.app`

### Step 5: Test
```bash
curl https://your-backend.railway.app/health
```

---

## 2️⃣ Frontend Deployment (Vercel)

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub

### Step 2: Import Project
1. Click "Add New" → "Project"
2. Import your `Feedback-System` repository
3. **Root Directory**: Set to `frontend`
4. **Framework Preset**: Next.js (auto-detected)

### Step 3: Configure Build Settings
```
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### Step 4: Environment Variables
In Vercel dashboard → Settings → Environment Variables:

```bash
# Backend API URL (from Railway)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# Optional - if using custom domain
# NEXT_PUBLIC_APP_URL=https://feedback.yourdomain.com
```

### Step 5: Deploy
- Click "Deploy"
- Vercel builds and deploys automatically
- Get your frontend URL: `https://feedback-system.vercel.app`

---

## 3️⃣ Update Backend CORS

After deploying frontend, update backend environment variable:

**Railway Dashboard → Variables:**
```bash
FRONTEND_URL=https://feedback-system.vercel.app
```

Then in `main.py`, ensure CORS is configured:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "https://*.vercel.app",  # Allow all Vercel preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 4️⃣ MongoDB Atlas Setup

Your MongoDB is already configured, but verify:

1. Go to MongoDB Atlas dashboard
2. **Network Access** → Add IP: `0.0.0.0/0` (allow all - Railway uses dynamic IPs)
3. **Database Access** → Ensure user has read/write permissions

---

## 🔐 Security Checklist

### Before Going Live:

1. **Change JWT Secret**
   ```bash
   # Generate strong secret
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Update CORS Origins**
   - Remove wildcard origins
   - Only allow your Vercel domain

3. **Environment Variables**
   - Never commit `.env` to git
   - Use platform-specific secret managers

4. **API Rate Limiting**
   - Consider adding rate limiting middleware
   - Groq has rate limits - monitor usage

---

## 🔄 Continuous Deployment

### Auto-deploy on Git Push

**Railway**: 
- Automatically deploys on push to `main` branch
- No configuration needed

**Vercel**:
- Automatically deploys on push to `main` branch
- Preview deployments for other branches

### Manual Deployment

**Railway**:
```bash
# Push to trigger deployment
git push origin main

# Or use Railway CLI
railway up
```

**Vercel**:
```bash
# Push to trigger deployment
git push origin main

# Or use Vercel CLI
vercel --prod
```

---

## 📊 Monitoring

### Check Backend Health
```bash
curl https://your-backend.railway.app/health
```

### Check Frontend
Open in browser: `https://your-frontend.vercel.app`

### Logs

**Railway**:
- Dashboard → Deployments → View Logs
- Real-time logs available

**Vercel**:
- Dashboard → Deployments → Function Logs
- Deploy logs available

---

## 💰 Costs (Estimate)

| Service | Free Tier | Paid Tier |
|---------|----------|-----------|
| **Vercel** | 100 GB bandwidth/month | $20/month (Pro) |
| **Railway** | $5 credit/month | $5-20/month |
| **MongoDB Atlas** | 512 MB storage | $9/month (M10) |
| **Groq API** | Free tier | Usage-based |
| **Total** | ~Free for testing | ~$15-50/month |

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check Railway logs for errors
# Common issues:
1. Missing environment variables
2. Python version mismatch
3. MongoDB connection string incorrect
```

### Frontend Can't Connect to Backend
```bash
# Verify NEXT_PUBLIC_API_URL is correct
# Check browser console for CORS errors
# Ensure backend FRONTEND_URL includes Vercel domain
```

### Database Connection Fails
```bash
# MongoDB Atlas:
1. Check IP whitelist (0.0.0.0/0 for Railway)
2. Verify username/password
3. Check connection string format
```

---

## 🎯 Custom Domain (Optional)

### Backend (Railway)
1. Railway → Settings → Custom Domain
2. Add CNAME record: `api.yourdomain.com → your-backend.railway.app`

### Frontend (Vercel)
1. Vercel → Settings → Domains
2. Add domain: `feedback.yourdomain.com`
3. Configure DNS records as shown

---

## 🔄 Alternative: Dockerfile Deployment

If you prefer Docker (for Fly.io, DigitalOcean, etc.):

```dockerfile
# See Dockerfile in root directory
# Build: docker build -t feedback-backend .
# Run: docker run -p 8000:8000 feedback-backend
```

---

## ✅ Post-Deployment Checklist

- [ ] Backend healthcheck passes
- [ ] Frontend loads successfully
- [ ] Can register/login users
- [ ] Can create events
- [ ] Can submit feedback (text & audio)
- [ ] Analytics pages work
- [ ] Report generation works
- [ ] QR codes generate correctly
- [ ] Text validation works
- [ ] MongoDB connection stable

---

## 📞 Support Resources

- **Railway**: https://docs.railway.app
- **Vercel**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **FastAPI**: https://fastapi.tiangolo.com
- **Next.js**: https://nextjs.org/docs

---

**Ready to deploy?** Push your code and follow the steps above! 🚀
