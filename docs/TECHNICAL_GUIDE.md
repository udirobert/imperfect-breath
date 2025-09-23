# Technical Developer Guide

Quick setup and testing guide for Imperfect Breath local development.

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone https://github.com/udirobert/imperfect-breath.git
cd imperfect-breath
npm install

# 2. Start development
npm run dev  # Frontend at localhost:4556
```

**That's it!** App works immediately - no additional setup required.

## 🏗️ Architecture

**Single Frontend Architecture:**

- **Frontend**: React + Vite (served by Netlify) - port 4556 in dev
- **Backend**: Python FastAPI API service (Hetzner) - port 8000
- **Services**: Supabase (auth/data), Flow/Lens (blockchain)

**Key Point**: Backend is pure API service. Frontend always runs separately and calls backend APIs for AI/vision processing.

## 🎯 Local Testing

### Frontend Only (Default)

```bash
npm run dev
# Visit: http://localhost:4556
```

**What works:**

- ✅ All breathing patterns and sessions
- ✅ Local camera vision (TensorFlow.js)
- ✅ PWA offline features
- ✅ Authentication (with Supabase)
- ✅ Basic AI coaching (production server)

**Test Flow:**

1. Click "Start Breathing"
2. Select pattern (try "4-7-8 Relaxation")
3. Enable camera when prompted
4. Complete 1-minute session
5. Check results page

### Backend Development (Optional)

**Only needed for AI/vision backend changes:**

```bash
# Terminal 1: Start Python API backend
cd backend/vision-service
pip install -r requirements.txt
python main.py  # API server on port 8000

# Terminal 2: Start frontend (same as always)
npm run dev  # Frontend on port 4556

# Configure frontend to use local backend API
echo "VITE_HETZNER_SERVICE_URL=http://localhost:8001" > .env.local
```

**Test Backend APIs:**

```bash
# Test API health endpoint
curl http://localhost:8001/api/health

# Test AI analysis API endpoint
curl -X POST http://localhost:8001/api/ai-analysis \
  -H "Content-Type: application/json" \
  -d '{"session_data": {"duration": 300}}'

# Frontend automatically calls local backend when .env.local is configured
```

## 🧪 Feature Testing

### Core Features

```bash
# 1. Breathing Sessions
# - Start session → Select pattern → Complete session
# - Expected: Animation, timer, results page

# 2. Camera Vision
# - Enable camera → Start session → Watch face mesh
# - Expected: 20+ face landmarks, posture feedback

# 3. PWA Offline
# - Load app → Disconnect internet → Refresh
# - Expected: App still works, patterns available
```

### Authentication

```bash
# Email signup/login
# - Click "Sign Up" → Enter email/password → Verify
# - Expected: Login persists, progress syncs
```

### Blockchain (Optional)

```bash
# Wallet connection
# - Click "Connect Wallet" → Choose wallet → Approve
# - Expected: Wallet connects, NFT minting works (testnet)
```

## 🔧 Development Commands

```bash
# Development
npm run dev                 # Start frontend
npm run build              # Production build
npm run preview            # Test production build

# Testing
npm test                   # Run tests
npm run lint              # Check code quality
npm run type-check        # TypeScript validation

# Backend (if needed)
cd backend/vision-service
python main.py            # Start Python server
```

## 🐛 Common Issues

**App won't start:**

```bash
rm -rf node_modules package-lock.json
npm install
```

**Camera not working:**

- Check browser permissions
- Try different browsers
- Ensure good lighting

**Face mesh not appearing:**

```bash
# 1. Start vision backend service
cd backend/vision-service
MODEL_DOWNLOAD_ON_START=false python3 main.py

# 2. Check backend health
curl -I http://localhost:8001/api/health/vision

# 3. Look for console errors about 404s on /api/health
# 4. Refresh frontend after starting backend
```

**Common facemesh issues:**

- ❌ **404 errors on `/api/health`** → Vision service not running
- ❌ **No face landmarks** → Backend not connected, using fallback mode  
- ❌ **"Position face here" message** → Face not detected by MediaPipe
- ✅ **Green dots on face** → Working correctly!

**AI features not working:**

- Check if backend is running: `curl http://localhost:8001/api/health`
- Verify API keys in `.env` file

## 📝 Environment Setup (Optional)

```bash
# Copy example config
cp .env.example .env
```

**Key variables:**

```bash
# AI Services (optional - enables unlimited AI)
VITE_GOOGLE_GEMINI_API_KEY=your_key
VITE_OPENAI_API_KEY=your_key

# Supabase (optional - for cloud sync)
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key

# Backend (if running locally)
VITE_HETZNER_SERVICE_URL=http://
```

## 🚀 Quick Test Checklist

**Frontend Development:**

1. ✅ `npm run dev` starts successfully
2. ✅ Breathing session completes
3. ✅ Camera enables and shows face mesh
4. ✅ PWA works offline
5. ✅ `npm run build` succeeds

**Backend Development (if needed):**

1. ✅ Python server starts on port 8000
2. ✅ Health endpoint responds
3. ✅ AI analysis endpoint works
4. ✅ Frontend connects to local backend

## 📚 Project Structure

```
src/
├── components/     # UI components
├── pages/         # App routes
├── hooks/         # React hooks
├── lib/           # Core logic
├── agents/        # AI characters
└── types/         # TypeScript types

backend/vision-service/
├── main.py        # FastAPI server
├── requirements.txt
└── Dockerfile
```

## 💡 Development Tips

- **Start with frontend-only** development
- **Use browser dev tools** for debugging
- **Test on mobile** - it's mobile-first
- **Enable debug mode**: `VITE_DEBUG=true`
- **Check console** for important logs

---

**Need help?** Check browser console for errors or create an issue on GitHub.
