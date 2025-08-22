# Imperfect Breath 🌬️

**Ancient Wisdom Meets Modern Technology**

A production-ready multichain wellness platform that transforms breathing practice through AI-powered computer vision, blockchain integration, and social community features. Built mobile-first with progressive Web3 enhancement.

## 🎯 What is Imperfect Breath?

Imperfect Breath is a wellness platform that combines:

- **🫁 Ancient Breathing Wisdom** - Traditional techniques from around the world
- **🤖 AI-Powered Coaching** - Real-time personalized guidance with Zen AI agent
- **📱 Computer Vision** - Objective biometric feedback using your device camera
- **⛓️ Blockchain Integration** - NFT creation, IP protection, and social features
- **👥 Social Community** - Connect with practitioners worldwide

### Core Philosophy

> "Progress over perfection, consistency over intensity, mindful awareness over mechanical practice."

We believe breathing is the foundation of wellness, and technology should enhance—not complicate—this ancient practice.

## 🚀 Quick Start

### Instant Access (0 minutes)

```bash
# Clone and run immediately
git clone [your-repo-url]
cd imperfect-breath
npm install

# Start both frontend and AI server
npm run dev:full    # Starts both frontend (4556) and AI server (3001)
# OR run separately:
npm run dev         # Frontend only (localhost:4556)
npm run dev:server  # AI server only (localhost:3001)
```

**No signup required** - Start breathing immediately with:

- ✅ Complete breathing pattern library
- ✅ AI coaching with Zen (requires server)
- ✅ Computer vision feedback (camera optional)
- ✅ Local progress tracking

### Enhanced Features (2 minutes)

- **Email signup** → Cloud sync across devices
- **Progress analytics** → Historical session data
- **Achievement system** → Gamified wellness journey

### Full Web3 Features (5 minutes)

- **Wallet connection** → Flow, Ethereum, or Lens Chain
- **NFT creation** → Mint exceptional sessions
- **Social sharing** → Lens Protocol integration
- **Content ownership** → Decentralized storage

## 🏗️ Architecture Overview

### Mobile-First Multichain Platform

```
📱 Progressive Web App
├── 🎯 Adaptive Vision System (3-tier performance)
├── 🤖 Zen AI Agent (Eliza framework)
├── 🔄 Progressive Authentication (email → wallet)
└── ⛓️ Multichain Integration
    ├── Flow Blockchain (NFTs & Marketplace)
    └── Lens Protocol V3 (Social & Community)
```

### Technology Stack

**Frontend**

- **React 18** + **TypeScript** - Modern UI framework
- **Vite** - Lightning-fast build system
- **Tailwind CSS** + **shadcn/ui** - Beautiful, accessible components
- **TensorFlow.js** - Client-side computer vision
- **PWA** - Offline-capable mobile experience

**AI & Vision**

- **Multi-Provider AI** - Google Gemini, OpenAI GPT-4, Anthropic Claude
- **Secure Server Architecture** - Server-side API key management
- **Eliza Framework** - Advanced AI agent architecture
- **MediaPipe** - Real-time pose and face detection
- **Three-tier processing** - Adaptive performance (Basic/Standard/Premium)

**Blockchain**

- **Flow Blockchain** - NFT minting and marketplace
- **Lens Protocol V3** - Decentralized social features with gasless transactions
- **ConnectKit/Avara** - Unified wallet connection

**Backend & Data**

- **Supabase** - PostgreSQL database and auth
- **IPFS** - Decentralized metadata storage
- **Local Storage** - Offline capability
- **Real-time sync** - Cross-device synchronization

## 🎯 Key Features

### 🫁 Breathing Practice

- **20+ Traditional Patterns** - 4-7-8, Box Breathing, Wim Hof, Pranayama
- **Custom Pattern Creator** - Build and share your own techniques
- **Difficulty Progression** - Beginner to advanced practices
- **Visual Guidance** - Beautiful breathing animations and timers

### 🤖 Zen AI Coach

- **Real-time Feedback** - "I notice you're moving quite a bit. Let's find your center..."
- **Personalized Coaching** - Adapts to your progress and preferences
- **Session Assessment** - Comprehensive scoring and improvement suggestions
- **Cultural Sensitivity** - Respects traditional practices and diverse perspectives

### 📱 Computer Vision System

- **Three Performance Tiers** - Adapts to device capabilities
- **Real-time Analysis** - Breathing rate, posture, stress indicators
- **Privacy-First** - All processing happens locally on your device
- **95% Device Compatibility** - Works on budget phones to high-end desktops

| Tier        | Devices                      | Features                                   |
| ----------- | ---------------------------- | ------------------------------------------ |
| 🟢 Basic    | Budget phones, older laptops | Motion detection, basic breathing rate     |
| 🟡 Standard | Mid-range devices            | Posture analysis, facial tension detection |
| 🔴 Premium  | High-end devices             | Full body analysis, micro-expressions      |

### ⛓️ Blockchain Features

- **NFT Creation** - Mint exceptional breathing sessions as unique NFTs
- **Content Ownership** - Decentralized storage with Grove
- **Social Sharing** - Share achievements on Lens Protocol V3
- **Creator Economy** - Earn from pattern sales and licensing
- **Marketplace** - Buy and sell breathing patterns and courses

### 👥 Social Community

- **Breathing Circles** - Group sessions with friends
- **Achievement Sharing** - Celebrate milestones together
- **Instructor Network** - Connect with certified breathing coaches
- **Global Challenges** - Community-wide wellness goals

## 🛠️ Development

### Prerequisites

```bash
# Required
Node.js 18+
npm or yarn
Git

# Optional (for full features)
Flow CLI (blockchain development)
Supabase CLI (database management)
Docker (containerized deployment)
```

### Environment Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
cp flow.json.example flow.json

# 3. Configure environment variables
# See docs/TECHNICAL_GUIDE.md for complete setup

# 4. Start development
npm run dev:full         # Both frontend (4556) and AI server (3001)
# OR separately:
npm run dev              # Frontend only (localhost:4556)
npm run dev:server       # AI server only (localhost:3001)
```

### Local Development vs Production Deployment

#### 🏠 Local Development

For local development, you need to run two separate services:

```bash
# Terminal 1: Start the frontend development server
npm run dev
# Access at: http://localhost:4556

# Terminal 2: Start the backend AI server
npm run dev:server
# AI API endpoint: http://localhost:3001/api/ai-analysis
```

**Key Points for Local Development:**
- The frontend runs on port `4556`
- The AI backend server runs on port `3001`
- Both services must be running simultaneously for full functionality
- Camera access requires HTTPS in production but works with HTTP locally
- AI analysis features require the backend server to be running

#### 🚀 Production Deployment

For production deployment, you have several options:

1. **Netlify Deployment** (Recommended for frontend):
   ```bash
   # Netlify automatically builds and deploys the frontend
   # Backend functions are deployed as Netlify Functions
   # See netlify.toml for configuration
   ```

2. **Vercel Deployment**:
   ```bash
   # Configure Vercel to build the frontend
   # Deploy the server separately or as serverless functions
   ```

3. **Traditional Server Deployment**:
   ```bash
   # Build frontend for production
   npm run build
   
   # Serve built files with any static server
   # Deploy the server/ directory separately
   ```

**Environment Variables for Production:**
```bash
# Frontend (.env in root)
VITE_APP_URL=                    # Leave empty for relative paths
VITE_ENABLE_AI_ANALYSIS=true     # Enable AI features
# Add your client-side AI keys for unlimited use:
VITE_GOOGLE_GEMINI_API_KEY=your_key
VITE_OPENAI_API_KEY=your_key
VITE_ANTHROPIC_API_KEY=your_key

# Backend (server/.env)
PORT=3001                        # Server port
# Server-side keys for trial system:
GOOGLE_AI_API_KEY=your_key
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
```

### AI Configuration - Dual System

The app uses **two separate AI systems** for optimal user experience:

#### 🆓 Trial System (Server-side keys)

- **1 free AI analysis** per user
- Uses server-side API keys (secure, never exposed)
- No user setup required

#### 🔓 Unlimited Personal Use (Client-side keys)

- **Unlimited AI analysis** with your own keys
- Add keys in AI Settings page
- Keys stored securely in your browser

```bash
# In your .env file:

# CLIENT-SIDE (VITE_ prefix) - For unlimited personal use
VITE_GOOGLE_GEMINI_API_KEY=your_personal_key_here
VITE_OPENAI_API_KEY=your_personal_key_here
VITE_ANTHROPIC_API_KEY=your_personal_key_here

# SERVER-SIDE (NO prefix) - For trial system
GOOGLE_AI_API_KEY=your_server_key_here
OPENAI_API_KEY=your_server_key_here
ANTHROPIC_API_KEY=your_server_key_here
```

**Important**: Client-side keys (with `VITE_` prefix) are for users' personal unlimited use, while server-side keys (no prefix) power the trial system.

### Key Commands

```bash
# Development
npm run dev              # Start frontend (localhost:4556)
npm run dev:server       # Start AI server (localhost:3001)
npm run dev:full         # Start both frontend and server
npm run build           # Production build
npm run preview         # Preview build

# Testing
npm run test            # Run tests
npm run test:vision     # Test computer vision
npm run test:blockchain # Test blockchain connections

# AI Agent
cd eliza-agent-temp
pnpm install
pnpm start --character="../characters/breathing-coach.character.json"

# Blockchain
npm run flow:setup      # Setup Flow environment
npm run flow:deploy     # Deploy contracts
npm run flow:test       # Test contracts
```

## 📚 Documentation

Our documentation is organized into three comprehensive guides:

### 📖 [Technical Guide](docs/TECHNICAL_GUIDE.md)

Complete technical documentation for developers:

- System architecture and data flow
- Development setup and workflow
- AI agent integration (Eliza framework)
- Computer vision system (three-tier architecture)
- Blockchain integration (Flow, Lens V3)
- Database schema and API design
- Security considerations and testing

### 👤 [User Features Guide](docs/USER_FEATURES_GUIDE.md)

Comprehensive user experience documentation:

- Progressive onboarding flow
- Breathing pattern library and custom creation
- AI-powered coaching examples
- Computer vision features and privacy
- Blockchain features (NFTs, IP protection, social)
- Progress tracking and achievements
- Customization and accessibility

### 🚀 [Project History & Deployment](docs/PROJECT_HISTORY_DEPLOYMENT.md)

Project evolution and deployment procedures:

- Mobile-first strategic pivot
- Blockchain migration status (Lens V3, Flow)
- Architectural consolidation summary
- Complete deployment procedures
- Monitoring and security considerations
- Backup and recovery strategies

## 🌟 Getting Started as a User

### 1. **Instant Practice** (0 minutes)

- Visit the app and start breathing immediately
- Try the 4-7-8 relaxation pattern
- Enable camera for AI coaching (optional)

### 2. **Enhanced Experience** (2 minutes)

- Create account with email
- Sync progress across devices
- Unlock achievement system

### 3. **Web3 Features** (5 minutes)

- Connect wallet (Flow, Ethereum, or Lens Chain)
- Mint your first breathing NFT
- Join the social community

### 4. **Advanced Features**

- Create custom breathing patterns
- Share patterns with the community
- Become a certified instructor
- Earn from pattern sales

## 🤝 Contributing

We welcome contributions from developers, breathing instructors, and wellness practitioners!

### Development Contributions

```bash
# 1. Fork the repository
# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Make changes and test
npm run test
npm run lint

# 4. Submit pull request
```

### Content Contributions

- **Breathing Patterns** - Share traditional techniques
- **Translations** - Help make the app accessible globally
- **Documentation** - Improve guides and tutorials
- **Community** - Help newcomers and share experiences

## 🔒 Privacy & Security

### What We Protect

- **Video Data** - Never stored, processed locally only
- **Personal Information** - Encrypted and user-controlled
- **Blockchain Data** - Decentralized and user-owned
- **Health Metrics** - Aggregated only, no personal identifiers

### What We Store

- ✅ Session metrics (breathing rate, duration, score)
- ✅ User preferences and settings
- ✅ Achievement progress
- ✅ Social interactions (with consent)

### What We Never Store

- ❌ Raw video footage or frames
- ❌ Facial recognition data
- ❌ Personal health information
- ❌ Private keys or wallet data

## 🌍 Roadmap

### Q1 2024 - Foundation ✅

- ✅ Core breathing patterns and AI coaching
- ✅ Computer vision system (three-tier)
- ✅ Flow blockchain integration
- ✅ Mobile-first responsive design

### Q2 2024 - Social & IP ✅

- ✅ Lens Protocol social features
- ✅ Decentralized content storage
- ✅ NFT marketplace
- ✅ Creator economy features

### Q3 2024 - Enhancement 🔄

- 🔄 Advanced biometrics (HRV, stress detection)
- 🔄 Instructor certification program
- 🔄 Enterprise wellness partnerships
- 🔄 Multi-language support

### Q4 2024 - Scale 📋

- 📋 Mobile app (iOS/Android)
- 📋 Wearable device integration
- 📋 Advanced AI coaching
- 📋 Global community features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ancient Traditions** - Honoring thousands of years of breathing wisdom
- **Open Source Community** - Built on the shoulders of giants
- **Early Users** - Thank you for your feedback and support
- **Blockchain Pioneers** - Enabling decentralized wellness

---

**Start your breathing journey today** - No signup required, just breathe. 🌬️

[Live Demo](https://imperfect-breath.vercel.app) | [Documentation](docs/) | [Community](https://lens.xyz/u/imperfectbreath)