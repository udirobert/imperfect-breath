# Imperfect Breath 🌬️

**Ancient Wisdom Meets Modern Technology**

A production-ready multichain wellness platform that transforms breathing practice through AI-powered computer vision, blockchain integration, and social community features. Built mobile-first with progressive Web3 enhancement.

## 🎯 What is Imperfect Breath?

Imperfect Breath is the world's first comprehensive Web3 wellness platform that combines:

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
bun install
bun run dev
```

**No signup required** - Start breathing immediately with:

- ✅ Complete breathing pattern library
- ✅ AI coaching with Zen
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
- **IP protection** → Story Protocol registration

## 🏗️ Architecture Overview

### Mobile-First Multichain Platform

```
📱 Progressive Web App
├── 🎯 Adaptive Vision System (3-tier performance)
├── 🤖 Zen AI Agent (Eliza framework)
├── 🔄 Progressive Authentication (email → wallet)
└── ⛓️ Multichain Integration
    ├── Flow Blockchain (NFTs & Marketplace)
    ├── Story Protocol (IP & Royalties)
    └── Lens Protocol (Social & Community)
```

### Technology Stack

**Frontend**

- **React 18** + **TypeScript** - Modern UI framework
- **Vite** + **Bun** - Lightning-fast build system
- **Tailwind CSS** + **shadcn/ui** - Beautiful, accessible components
- **TensorFlow.js** - Client-side computer vision
- **PWA** - Offline-capable mobile experience

**AI & Vision**

- **Eliza Framework** - Advanced AI agent architecture
- **OpenAI GPT-4** - Natural language processing
- **Google Gemini** - Multimodal AI capabilities
- **MediaPipe** - Real-time pose and face detection
- **Three-tier processing** - Adaptive performance (Basic/Standard/Premium)

**Blockchain**

- **Flow Blockchain** - NFT minting and marketplace
- **Story Protocol** - IP registration and royalties
- **Lens Protocol** - Decentralized social features
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
- **IP Protection** - Register custom patterns with Story Protocol
- **Social Sharing** - Share achievements on Lens Protocol
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
Bun (package manager)
Node.js 18+
Git

# Optional (for full features)
Flow CLI (blockchain development)
Supabase CLI (database management)
Docker (containerized deployment)
```

### Environment Setup

```bash
# 1. Install dependencies
bun install

# 2. Setup environment
cp .env.example .env
cp flow.json.example flow.json

# 3. Configure environment variables
# See docs/TECHNICAL_GUIDE.md for complete setup

# 4. Start development
bun run dev              # Frontend
cd eliza-agent-temp && ./start-zen.sh  # AI Agent
```

### Key Commands

```bash
# Development
bun run dev              # Start dev server
bun run build           # Production build
bun run preview         # Preview build

# Testing
bun run test            # Run tests
bun run test:vision     # Test computer vision
bun run test:blockchain # Test blockchain connections

# AI Agent
cd eliza-agent-temp
pnpm install
pnpm start --character="../characters/breathing-coach.character.json"

# Blockchain
bun run flow:setup      # Setup Flow environment
bun run flow:deploy     # Deploy contracts
bun run flow:test       # Test contracts
```

## 📚 Documentation

Our documentation is organized into three comprehensive guides:

### 📖 [Technical Guide](docs/TECHNICAL_GUIDE.md)

Complete technical documentation for developers:

- System architecture and data flow
- Development setup and workflow
- AI agent integration (Eliza framework)
- Computer vision system (three-tier architecture)
- Blockchain integration (Flow, Story, Lens)
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
- Blockchain migration status (Lens V3, Flow, Story)
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
- Register IP with Story Protocol
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
bun run test
bun run lint

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
- ✅ Story Protocol IP protection
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
