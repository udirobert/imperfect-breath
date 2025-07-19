# Project History, Migration & Deployment Guide

## Overview

This document consolidates the project history, blockchain migration status, architectural transformations, and comprehensive deployment procedures for the Imperfect Breath platform. It serves as a complete reference for understanding the project's evolution and current deployment state.

## 📱 Mobile-First Strategic Pivot

### Development Roadmap

**Phase 1: Mobile Navigation & Interface (Weeks 1-2)**

- ✅ Implement bottom tab navigation for mobile
- ✅ Replace overcrowded header with hamburger menu
- ✅ Touch-optimized breathing session interface
- ✅ Progressive onboarding flow

**Phase 2: Core Feature Completion (Weeks 3-4)**

- ✅ Unified authentication system
- 🔄 Real payment processing integration
- ✅ Mobile camera optimization
- ✅ Offline capability for core features

**Phase 3: Advanced Features (Weeks 5-6)**

- ✅ Complete social integration (Lens Protocol)
- 🔄 Creator monetization flows
- ✅ Advanced AI coaching
- ✅ Cross-platform synchronization

## ⛓️ Blockchain Migration Status

### Lens Protocol V3 Migration - COMPLETED ✅

**Migration Summary**

- **From**: Lens Protocol V2 (Polygon Mumbai)
- **To**: Lens Protocol V3 (Lens Chain Testnet)
- **Wallet**: Migrated from Tomo SDK to ConnectKit/Avara
- **Account Model**: Profile-based → Account-based

**Completed Tasks**

- ✅ Updated API URLs to Lens V3 endpoints (`https://api-v3-testnet.lens-chain.xyz`)
- ✅ Updated Lens Hub contract address and network configurations
- ✅ Migrated authentication flow to ConnectKit/Avara
- ✅ Updated social features to use account-based model
- ✅ Implemented real community stats and trending patterns
- ✅ Created blockchain verification utility
- ✅ Enhanced error handling with fallback mechanisms

**Network Configuration**

```typescript
// Updated network settings
const LENS_CONFIG = {
  network: "lens-chain-testnet",
  apiUrl: "https://api-v3-testnet.lens-chain.xyz",
  hubContract: "0x4fbffF20302F3326B20052ab9C217C44F6480900",
  chainId: 37111,
  rpcUrl: "https://rpc.testnet.lens.dev",
};
```

### Flow Blockchain Integration - STABLE ✅

**Current Status**: Production-ready with comprehensive features

**Smart Contract Deployment**

```
Contract: ImperfectBreath
Address: 0xb8404e09b36b6623
Network: Flow Testnet
Features: NFT minting, marketplace, royalties
```

**Key Features Implemented**

- ✅ Breathing pattern NFT minting
- ✅ Marketplace functionality
- ✅ Batch transaction processing
- ✅ COA (Cadence Owned Account) management
- ✅ Real-time transaction monitoring
- ✅ Gas optimization strategies

### Story Protocol Integration - ACTIVE ✅

**Current Status**: Fully integrated with IP protection features

**Configuration**

```typescript
const STORY_CONFIG = {
  network: "story-aeneid-testnet",
  rpcUrl: "https://testnet.storyrpc.io",
  ipAssetRegistry: "0x1a9d0d28a0422F26D31Be72Edc6f13ea4371E11B",
  licensingModule: "0x5a7D9Fa17DE09350F481A53B470D798c1c1aabae",
};
```

**Features Implemented**

- ✅ IP asset registration for breathing patterns
- ✅ Licensing terms management
- ✅ Royalty distribution system
- ✅ Derivative work tracking
- ✅ Grove storage integration

## 🏗️ Architectural Consolidation Summary

### 4-Pillar Enterprise Architecture - COMPLETED ✅

#### 1. Vision System Consolidation ✅

**Before**: ~1,500 lines across 8+ files
**After**: ~900 lines in organized structure
**Reduction**: 40% code reduction achieved

**New Structure**

```
src/lib/vision/
├── index.ts                     # Main exports
├── types.ts                     # Shared interfaces
├── core/
│   ├── vision-engine.ts         # Unified TensorFlow engine
│   ├── face-detector.ts         # Face detection logic
│   └── pose-detector.ts         # Pose detection logic
├── models/
│   ├── model-manager.ts         # Enhanced model management
│   └── model-cache.ts           # Intelligent caching
├── camera/
│   ├── camera-manager.ts        # Unified camera management
│   └── stream-processor.ts      # Video stream processing
└── performance/
    ├── performance-monitor.ts   # Performance tracking
    └── device-detector.ts       # Device capability detection
```

#### 2. Flow Blockchain Consolidation ✅

**Before**: ~38,000 lines across multiple files
**After**: ~25,000 lines in organized structure
**Reduction**: 35% code reduction achieved

**Benefits Achieved**

- ✅ Single `useFlow()` API for all Flow features
- ✅ Centralized transaction management
- ✅ Optimized batch operations
- ✅ Better error handling and loading states
- ✅ Improved TypeScript support

#### 3. Social Integration Cleanup ✅

**Files Removed**: 4 deprecated files
**Files Updated**: Consolidated into `IntegratedSocialFlow.tsx`
**Benefits**: 50% code reduction, single source of truth

#### 4. Story Protocol Consolidation ✅

**Before**: ~1,500 lines across multiple files
**After**: ~1,000 lines in organized structure
**Reduction**: 35% code reduction achieved

### Performance Optimizations Implemented

**Utility Modules Created**

- ✅ `error-utils.ts` - Standardized error handling
- ✅ `performance-utils.ts` - Timing and metrics collection
- ✅ `cache-utils.ts` - In-memory caching system
- ✅ `batch-transactions.ts` - Optimized batch operations

**Client Enhancements**

- ✅ Performance monitoring for all critical methods
- ✅ Caching for expensive blockchain operations
- ✅ Standardized error handling across all clients
- ✅ Optimized batch operations to reduce transaction costs

## 🚀 Deployment Procedures

### Development Environment Setup

**Prerequisites Installation**

```bash
# Install Bun (primary package manager)
curl -fsSL https://bun.sh/install | bash

# Install Node.js 18+ (for compatibility)
nvm install 18
nvm use 18

# Install Flow CLI
sh -ci "$(curl -fsSL https://storage.googleapis.com/flow-cli/install.sh)"

# Install Supabase CLI (optional)
npm install -g supabase
```

**Project Setup**

```bash
# 1. Clone repository
git clone [repository-url]
cd imperfect-breath

# 2. Install dependencies
bun install

# 3. Setup environment
cp .env.example .env
cp flow.json.example flow.json

# 4. Configure environment variables
nano .env
```

**Required Environment Variables**

```bash
# Core Configuration
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0

# Flow Blockchain (Pre-configured)
VITE_FLOW_NETWORK=testnet
VITE_IMPERFECT_BREATH_ADDRESS=0xb8404e09b36b6623
VITE_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org

# AI Services
VITE_GOOGLE_GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key

# Database (Optional for full features)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Story Protocol
STORY_PRIVATE_KEY=your_story_private_key
STORY_RPC_URL=https://testnet.storyrpc.io

# Lens Protocol
LENS_API_KEY=your_lens_api_key
LENS_ENVIRONMENT=testnet
```

**Development Commands**

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Run tests
bun run test

# Lint and format
bun run lint
bun run format
```

### AI Agent Deployment

**Zen AI Agent Setup**

```bash
# Navigate to agent directory
cd eliza-agent-temp

# Install dependencies
pnpm install

# Build breathing pattern plugin
cd packages/breathing-pattern-plugin
pnpm build
cd ../..

# Start Zen agent
pnpm start --character="../characters/breathing-coach.character.json"

# Or use the convenience script
./start-zen.sh
```

**Agent Configuration**

```json
{
  "name": "Zen",
  "description": "Ancient breathing master and wellness guide",
  "personality": {
    "traits": ["wise", "patient", "encouraging", "mindful"],
    "style": "Combines ancient wisdom with modern science",
    "approach": "Progress over perfection, consistency over intensity"
  },
  "capabilities": [
    "breathing pattern analysis",
    "personalized coaching",
    "session assessment",
    "NFT recommendations",
    "progress tracking"
  ]
}
```

### Production Deployment

#### Frontend Deployment (Vercel)

**Vercel Configuration**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_FLOW_NETWORK": "mainnet",
    "VITE_IMPERFECT_BREATH_ADDRESS": "0x...",
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

**Deployment Commands**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add VITE_FLOW_NETWORK
vercel env add VITE_SUPABASE_URL
# ... add all required variables
```

#### AI Agent Deployment (Docker)

**Dockerfile**

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy agent files
COPY eliza-agent-temp/ .

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Build plugins
RUN cd packages/breathing-pattern-plugin && pnpm build

# Expose port
EXPOSE 3000

# Start agent
CMD ["pnpm", "start", "--character=../characters/breathing-coach.character.json"]
```

**Docker Deployment**

```bash
# Build image
docker build -t imperfect-breath-agent .

# Run container
docker run -d \
  --name zen-agent \
  -p 3000:3000 \
  -e OPENAI_API_KEY=your_key \
  -e FLOW_PRIVATE_KEY=your_key \
  imperfect-breath-agent

# Deploy to cloud (example with Google Cloud Run)
gcloud run deploy zen-agent \
  --image gcr.io/your-project/imperfect-breath-agent \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Database Deployment (Supabase)

**Database Schema Migration**

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  flow_address TEXT,
  lens_profile_id TEXT,
  story_address TEXT,
  preferred_chain TEXT DEFAULT 'flow',
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Breathing patterns
CREATE TABLE breathing_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phases JSONB NOT NULL,
  difficulty TEXT NOT NULL,
  benefits TEXT[],
  creator_id UUID REFERENCES users(id),
  flow_nft_id TEXT,
  story_ip_id TEXT,
  lens_post_id TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions
CREATE TABLE breathing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  pattern_id UUID REFERENCES breathing_patterns(id),
  duration INTEGER NOT NULL,
  vision_metrics JSONB,
  ai_feedback TEXT,
  session_score INTEGER,
  nft_minted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vision metrics (detailed)
CREATE TABLE vision_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES breathing_sessions(id),
  tier TEXT NOT NULL,
  confidence DECIMAL,
  movement_level DECIMAL,
  breathing_rate DECIMAL,
  posture_quality DECIMAL,
  restlessness_score DECIMAL,
  facial_tension DECIMAL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  achievement_id TEXT NOT NULL,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Social interactions
CREATE TABLE social_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  interaction_type TEXT NOT NULL, -- 'follow', 'like', 'share', 'comment'
  target_id TEXT NOT NULL, -- lens post id, user id, etc.
  lens_transaction_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Row Level Security (RLS)**

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE breathing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_metrics ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Sessions are private to users
CREATE POLICY "Users can view own sessions" ON breathing_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON breathing_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Monitoring & Analytics

**Performance Monitoring Setup**

```typescript
// Analytics configuration
const analytics = {
  // User engagement
  trackSessionStart: (pattern: string, visionEnabled: boolean) => {
    gtag("event", "session_start", {
      pattern_name: pattern,
      vision_enabled: visionEnabled,
      timestamp: Date.now(),
    });
  },

  // Performance metrics
  trackVisionPerformance: (tier: string, fps: number, cpuUsage: number) => {
    gtag("event", "vision_performance", {
      tier: tier,
      fps: fps,
      cpu_usage: cpuUsage,
    });
  },

  // Blockchain interactions
  trackBlockchainTransaction: (
    chain: string,
    type: string,
    success: boolean
  ) => {
    gtag("event", "blockchain_transaction", {
      chain: chain,
      transaction_type: type,
      success: success,
    });
  },
};
```

**Health Checks**

```typescript
// API health check endpoints
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
    services: {
      database: "connected",
      ai_agent: "running",
      blockchain: "synced",
    },
  });
});

// Blockchain connection verification
app.get("/health/blockchain", async (req, res) => {
  const results = await runBlockchainVerificationTests();
  res.json(results);
});
```

### Security Considerations

**API Security**

```typescript
// Rate limiting
const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
});

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
  credentials: true,
  optionsSuccessStatus: 200,
};
```

**Environment Security**

```bash
# Production environment variables should be encrypted
# Use services like Vercel's encrypted environment variables
# or AWS Secrets Manager for sensitive data

# Never commit these to version control:
OPENAI_API_KEY=sk-...
STORY_PRIVATE_KEY=0x...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Backup & Recovery

**Database Backup Strategy**

```bash
# Automated daily backups
supabase db dump --db-url="$DATABASE_URL" > backup-$(date +%Y%m%d).sql

# Point-in-time recovery setup
supabase projects create-backup --project-ref your-project-ref
```

**Code Deployment Rollback**

```bash
# Vercel rollback to previous deployment
vercel rollback [deployment-url]

# Docker rollback
docker tag imperfect-breath-agent:latest imperfect-breath-agent:backup
docker pull imperfect-breath-agent:previous
docker tag imperfect-breath-agent:previous imperfect-breath-agent:latest
```

This comprehensive guide provides complete deployment procedures and project history, ensuring successful deployment and maintenance of the Imperfect Breath platform across all environments and blockchain networks.
