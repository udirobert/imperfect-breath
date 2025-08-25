# Development Quick Reference

## 🚀 Essential Commands

```bash
# Start Development
npm run dev              # Frontend (localhost:4556)
# No local backend needed - uses Hetzner server

# Testing & Quality
npm test                 # Run all tests
npm run lint             # Check code quality
npm run build            # Production build
npm run preview          # Test production build

# Reset Environment
rm -rf node_modules package-lock.json
npm install
```

## 🧪 Testing Checklist

### Core Features (5 minutes)

1. ✅ **Visit http://localhost:4556**
2. ✅ **Start a breathing session** (try "4-7-8 Relaxation")
3. ✅ **Enable camera** for vision features
4. ✅ **Complete 1-minute session**
5. ✅ **Check results page**

### AI Features (uses Hetzner server)

1. ✅ **Complete breathing session**
2. ✅ **Check Zen AI coaching feedback**
3. ✅ **Try different patterns for varied analysis**

### PWA Features

1. ✅ **Load app online**
2. ✅ **Disconnect internet**
3. ✅ **Verify offline functionality**

## 🏗️ Key Directories

```
src/
├── components/        # React components
│   ├── auth/         # Authentication
│   ├── breathing/    # Core breathing features
│   ├── vision/       # Computer vision
│   └── ui/           # Reusable UI components
├── hooks/            # Custom React hooks
├── lib/              # Core logic & utilities
├── pages/            # Route components
└── stores/           # State management
```

## 🔧 Environment Variables

```bash
# Quick setup (all optional)
VITE_DEBUG=true                    # Enable debug logging
VITE_ENABLE_AI_ANALYSIS=true       # AI features
VITE_ENABLE_CAMERA=true            # Vision features
VITE_SUPABASE_URL=your_url         # Cloud sync
VITE_OPENAI_API_KEY=your_key       # Unlimited AI
```

## 🐛 Common Issues

**App won't start?**

```bash
rm -rf node_modules package-lock.json
npm install
```

**Camera not working?**

- Check browser permissions
- Ensure HTTPS in production
- Try different browsers

**AI features not working?**

- AI analysis uses production Hetzner server
- Check internet connection
- Verify in browser dev tools: Network tab for API calls

## 📱 Mobile Testing

```bash
# Get local IP for mobile testing
npm run dev -- --host

# Or use ngrok for external testing
npx ngrok http 4556
```

## 🔗 Useful Links

- **[📋 Full Technical Guide](TECHNICAL_GUIDE.md)** - Complete documentation
- **[🌐 Live App](https://imperfectbreath.netlify.app)** - Production version
- **[👤 User Guide](USER_GUIDE.md)** - User-focused documentation

---

**Quick Start**: `npm install && npm run dev` → http://localhost:4556 🚀
