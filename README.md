# Intelligent Feedback System

A modern feedback collection platform enabling speakers to gather real-time audience feedback through voice input, sentiment analysis, and comprehensive analytics.

## 🎯 Overview

This system allows speakers to create events, generate QR codes for audience access, and collect voice-based feedback with automatic sentiment analysis and text validation.

## 🏗️ Project Structure

```
├── main.py                      # FastAPI backend server
├── sentiment_classification.py  # Sentiment analysis logic
├── speech_to_text.py           # Voice transcription (5-min max)
├── text_validation.py          # Feedback validation & quality checks
├── db/                         # Database models & operations
├── handlers/                   # Request handlers
├── routes/                     # API routes
├── models/                     # ML models & Pydantic schemas
├── helpers/                    # Authentication & utilities
└── frontend/                   # Next.js frontend application
    ├── app/                    # Next.js pages (App Router)
    ├── components/             # React components
    ├── hooks/                  # Custom React hooks
    ├── types/                  # TypeScript definitions
    └── utils/                  # API client & utilities
```

## 🚀 Quick Start

### Backend Setup

```bash
# Create virtual environment
python -m venv myvenv
source myvenv/bin/activate  # On Windows: myvenv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials and secret key

# Run server
uvicorn main:app --reload
```

Backend will run at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Update NEXT_PUBLIC_API_URL if needed

# Run development server
npm run dev
```

Frontend will run at `http://localhost:3000`

## 🔧 Environment Configuration

### Backend (.env)

```env
# Database Configuration
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/feedback_db

# Server Configuration
BASE_URL=http://127.0.0.1:8000

# JWT Authentication
SECRET_KEY=your-secret-key-here-generate-with-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### Frontend (.env.local)

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## ✨ Key Features

- **Speaker Authentication**: Secure JWT-based login/register system
- **Event Management**: Create and manage events with QR code generation
- **Voice Feedback**: Record audio feedback (max 5 minutes) with speech-to-text conversion
- **Text Feedback**: Submit written feedback with validation
- **Sentiment Analysis**: Automatic sentiment classification (Positive/Negative/Neutral)
- **Quality Filtering**: Feedback quality checks (ACCEPT/FLAG/REJECT)
- **Analytics Dashboard**: 
  - Overview statistics
  - Sentiment trends over time
  - Keyword extraction
  - Quality metrics
  - Individual feedback review
- **PDF Export**: Download analytics reports
- **QR Code Generation**: Easy audience access to feedback forms
- **Mobile-First Design**: Responsive UI optimized for mobile devices

## 🔌 API Endpoints

### Authentication
- `POST /login/` - Speaker authentication
- `POST /speakers/register` - Speaker registration
- `GET /speakers/me` - Get current speaker info

### Events
- `POST /events/` - Create event
- `GET /events/` - List speaker's events
- `GET /events/{id}` - Get event details
- `PUT /events/{id}` - Update event
- `DELETE /events/{id}` - Delete event
- `GET /events/{id}/qr` - Generate QR code

### Feedback
- `GET /feedback/{public_token}` - Get event info (public)
- `POST /feedback/text` - Submit text feedback (public)
- `POST /feedback/audio` - Submit audio feedback (public)
- `GET /events/{id}/feedback` - List event feedback

### Analytics
- `GET /analytics/dashboard` - Dashboard statistics
- `GET /analytics/events/{id}/stats` - Event statistics
- `GET /analytics/events/{id}/trends` - Sentiment trends
- `GET /analytics/events/{id}/keywords` - Keyword analysis
- `GET /analytics/events/{id}/quality` - Quality metrics

## 🛠️ Tech Stack

**Backend**: 
- FastAPI
- Python 3.12
- SQLAlchemy
- PyMySQL
- JWT Authentication
- faster-whisper (speech-to-text)
- transformers (sentiment analysis)

**Frontend**: 
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS v4
- Axios
- Lucide Icons
- Recharts
- QRCode.react
- jsPDF + html2canvas

**ML/AI**: 
- Systran/faster-whisper-small.en (speech-to-text)
- cardiffnlp/twitter-roberta-base-sentiment (sentiment analysis)

**Database**: MySQL

## 📱 User Flow

### For Speakers:
1. Register/Login at `http://localhost:3000`
2. Navigate to Dashboard
3. Create new event with title, description, and date
4. Generate QR code for the event
5. Share QR code or public URL with attendees
6. View analytics as feedback comes in
7. Download PDF reports

### For Attendees:
1. Scan QR code or access public feedback URL
2. Choose text or voice input mode
3. Submit feedback (validated for quality)
4. Receive confirmation

## 🔒 Security Features

- JWT token-based authentication
- Password strength validation (8+ chars, uppercase, lowercase, number, special char)
- HTTP-only cookies in production
- CORS configuration
- Input validation and sanitization
- Quality checks for spam/gibberish detection
- Protected routes for authenticated users








