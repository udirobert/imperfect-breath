# Technical Guide

## Overview

Imperfect Breath is a production-ready multichain wellness platform that combines ancient breathing wisdom with cutting-edge Web3 technology and AI-powered computer vision. This guide provides a detailed overview of the platform's technical architecture, development workflow, deployment process, and security considerations. It serves as a consolidated reference for developers and technical stakeholders, with links to additional specialized documentation for deeper insights.

For user-focused instructions, vision system details, and project history, refer to the following companion documents in the /docs directory:

- **User Guide** (`docs/UserGuide.md`): Instructions for end-users on how to use the platform.
- **Vision & AI Guide** (`docs/VisionAIGuide.md`): In-depth documentation on the computer vision and AI coaching system.
- **Project History & Plans** (`docs/ProjectHistoryPlans.md`): Historical context, architectural consolidation plans, and cleanup summaries.

## 🏗️ System Architecture

### Multichain Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    IMPERFECT BREATH PLATFORM               │
├─────────────────────────────────────────────────────────────┤
│  🤖 Zen AI Agent (Eliza Framework)                         │
│  ├── Natural Language Processing                           │
│  ├── Computer Vision Analysis                              │
│  ├── Breathing Pattern Generation                          │
│  └── Cross-Chain Decision Making                           │
├─────────────────────────────────────────────────────────────┤
│  🎯 Computer Vision System                                  │
│  ├── Basic Tier (95% device compatibility)                 │
│  ├── Standard Tier (80% device compatibility)              │
│  └── Premium Tier (60% device compatibility)               │
├─────────────────────────────────────────────────────────────┤
│  ⛓️ Multichain Infrastructure                              │
│  ├── Flow Blockchain (NFTs & Marketplace)                  │
│  ├── Story Protocol (IP & Royalties)                       │
│  └── Lens Protocol (Social & Community)                    │
├─────────────────────────────────────────────────────────────┤
│  🗄️ Data Layer                                             │
│  ├── Supabase (Cross-chain coordination)                   │
│  ├── Local Storage (Vision processing)                     │
│  └── IPFS (Metadata storage)                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → Frontend → Chain Selection → Blockchain Execution
     ↓             ↓            ↓              ↓
Vision Input → AI Analysis → Pattern Gen → NFT Minting (Flow)
     ↓             ↓            ↓              ↓
Biometric Data → Zen Coach → IP Register → Story Protocol
     ↓             ↓            ↓              ↓
Session Metrics → Feedback → Social Share → Lens Protocol
```

## 🔧 Development Setup

### Prerequisites

```bash
# Required
Node.js 18+
npm or pnpm
Git

# Blockchain Tools
Flow CLI
Cadence VSCode Extension

# Optional (for full features)
Supabase CLI
Docker (for local blockchain testing)
```

### Environment Setup

1. **Clone and Install**

   ```bash
   git clone [your-repo-url]
   cd imperfect-breath
   npm install
   ```

2. **Environment Configuration**

   ```bash
   # Copy templates
   cp .env.example .env
   cp flow.json.example flow.json

   # Configure environment variables
   nano .env
   ```

3. **Environment Variables**

   ```bash
   # Flow Blockchain (Pre-configured for testnet)
   VITE_FLOW_NETWORK=testnet
   VITE_IMPERFECT_BREATH_ADDRESS=0xb8404e09b36b6623

   # AI Features
   VITE_GOOGLE_GEMINI_API_KEY=your_gemini_key
   OPENAI_API_KEY=your_openai_key  # For Zen AI agent

   # Database (Optional)
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key

   # Story Protocol
   STORY_PRIVATE_KEY=your_story_private_key
   STORY_RPC_URL=https://testnet.storyrpc.io

   # Lens Protocol
   LENS_API_KEY=your_lens_api_key
   LENS_ENVIRONMENT=testnet
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

### Development Workflow

```bash
# Frontend development
npm run dev              # Start dev server
npm run build           # Production build
npm run preview         # Preview build

# Blockchain development
npm run flow:setup      # Setup Flow environment
npm run flow:deploy     # Deploy contracts
npm run flow:test       # Test contracts

# AI Agent development
cd eliza-agent-temp
pnpm install
pnpm start --character="../characters/breathing-coach.character.json"

# Vision system testing
npm run test:vision     # Test computer vision
npm run test:performance # Performance benchmarks
```

## 🤖 Zen AI Agent Architecture

### Eliza Framework Integration

The Zen AI agent is built on the Eliza framework with custom plugins:

```typescript
// Agent structure
eliza-agent-temp/
├── characters/
│   └── breathing-coach.character.json    # Zen's personality
├── packages/
│   └── breathing-pattern-plugin/         # Core functionality
│       ├── src/
│       │   ├── index.ts                  # Main plugin
│       │   └── ai-breathing-coach.ts     # Integration layer
│       └── package.json
└── agent/
    └── src/
        └── index.ts                      # Agent runtime
```

### Plugin Architecture

```typescript
// Core plugin actions
const breathingPatternPlugin: Plugin = {
  name: "breathing-pattern-plugin",
  actions: [
    createBreathingPatternAction, // Generate custom patterns
    analyzeSessionAction, // Analyze user sessions
    mintPatternNFTAction, // Mint patterns as NFTs
    registerIPAction, // Register IP rights
    recommendPatternAction, // Recommend patterns
  ],
};
```

### AI Integration with Vision

```typescript
class EnhancedZenCoach extends AIBreathingCoach {
  async processSessionWithVision(
    userMessage: string,
    videoStream: MediaStream,
    userContext: UserContext
  ): Promise<string> {
    // Get real-time biometric data
    const visionMetrics = await this.visionAnalyzer.analyze(videoStream);

    // Enhanced context with objective data
    const enhancedContext = {
      ...userContext,
      currentSession: {
        actualBreathingRate: visionMetrics.breathingRate,
        stressLevel: visionMetrics.stressLevel,
        postureQuality: visionMetrics.postureQuality,
      },
    };

    // AI coaching with real data
    return this.generatePersonalizedCoaching(userMessage, enhancedContext);
  }
}
```

## 🎯 Computer Vision System

For a comprehensive guide on the computer vision system, including its three-tier adaptive architecture (Basic, Standard, Premium), device capability detection, performance optimization, and integration with AI coaching, refer to the **Vision & AI Guide** (`docs/VisionAIGuide.md`).

### Key Features

- **Adaptive Tiers**: Automatically adjusts to device capabilities, ensuring compatibility across 95% of devices (Basic Tier), 80% (Standard Tier), and 60% (Premium Tier).
- **Real-Time Analysis**: Provides metrics on breathing rate, posture, movement, and facial tension.
- **Privacy Focus**: All processing is done locally on the user's device, with no video data stored or transmitted.

## ⛓️ Blockchain Integration

### Flow Blockchain

**Smart Contract Architecture**

```cadence
// Main contract: ImperfectBreath.cdc
pub contract ImperfectBreath {
    pub resource BreathingPattern {
        pub let id: UInt64
        pub let name: String
        pub let phases: {String: UInt8}
        pub let creator: Address
        pub let metadata: {String: String}
    }

    pub resource Collection {
        pub fun deposit(token: @BreathingPattern)
        pub fun withdraw(withdrawID: UInt64): @BreathingPattern
        pub fun getIDs(): [UInt64]
    }
}
```

**Transaction Examples**

```typescript
// Mint breathing pattern NFT
const mintTransaction = `
  import ImperfectBreath from 0xb8404e09b36b6623
  
  transaction(name: String, phases: {String: UInt8}) {
    prepare(signer: AuthAccount) {
      let collection = signer.borrow<&ImperfectBreath.Collection>(
        from: /storage/BreathingPatternCollection
      ) ?? panic("Collection not found")
      
      let pattern <- ImperfectBreath.mintPattern(
        name: name,
        phases: phases,
        creator: signer.address
      )
      
      collection.deposit(token: <-pattern)
    }
  }
`;
```

### Story Protocol Integration

```typescript
class StoryBreathingClient {
  async registerIP(pattern: BreathingPattern): Promise<IPRegistrationResult> {
    // Register breathing pattern as IP asset
    const ipAsset = await this.storyClient.registerIpAsset({
      tokenContract: BREATHING_PATTERN_CONTRACT,
      tokenId: pattern.id,
      metadata: {
        name: pattern.name,
        description: pattern.description,
        creator: pattern.creator,
      },
    });

    // Set licensing terms
    await this.storyClient.attachLicenseTerms({
      ipId: ipAsset.ipId,
      licenseTermsId: this.createLicenseTerms({
        commercialUse: true,
        derivativesAllowed: true,
        royaltyRate: 1000, // 10%
      }),
    });

    return { ipAssetId: ipAsset.ipId, licenseId: ipAsset.licenseId };
  }
}
```

### Lens Protocol Integration

```typescript
class LensBreathingClient {
  async shareBreathingSession(session: BreathingSession): Promise<string> {
    const metadata = {
      content: `Just completed a ${session.pattern.name} breathing session! 
                 ${session.duration} minutes of mindful breathing. 🌬️`,
      tags: ["breathing", "wellness", "mindfulness"],
      attachments: [
        {
          type: "application/json",
          item: session.metrics,
        },
      ],
    };

    const publication = await this.lensClient.publication.postOnchain({
      contentURI: await this.uploadToIPFS(metadata),
    });

    return publication.id;
  }
}
```

## 🗄️ Database Schema

### Supabase Tables

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_address TEXT,
  lens_profile_id TEXT,
  story_address TEXT,
  preferred_chain TEXT DEFAULT 'flow',
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
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
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vision metrics
CREATE TABLE vision_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES breathing_sessions(id),
  tier TEXT NOT NULL,
  confidence DECIMAL,
  movement_level DECIMAL,
  breathing_rate DECIMAL,
  posture_quality DECIMAL,
  restlessness_score DECIMAL,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Deployment

### Development Deployment

```bash
# 1. Environment setup
cp .env.example .env
# Configure all environment variables

# 2. Install dependencies
npm install
cd eliza-agent-temp && pnpm install

# 3. Build vision system
cd packages/breathing-pattern-plugin && pnpm build

# 4. Start services
npm run dev                    # Frontend
cd eliza-agent-temp && ./start-zen.sh  # AI Agent
```

### Production Deployment

**Frontend (Vercel/Netlify)**

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod --dir=dist
```

**AI Agent (Cloud Server)**

```bash
# Docker deployment
FROM node:20-alpine
WORKDIR /app
COPY eliza-agent-temp/ .
RUN pnpm install
CMD ["pnpm", "start", "--character=../characters/breathing-coach.character.json"]
```

**Database (Supabase)**

```sql
-- Run migration scripts
psql -h your-supabase-host -U postgres -d postgres -f migrations/001_initial.sql
```

### Environment Configuration

**Production Environment Variables**

```bash
# Flow Blockchain
VITE_FLOW_NETWORK=mainnet
VITE_IMPERFECT_BREATH_ADDRESS=your_mainnet_address

# AI Services
OPENAI_API_KEY=your_production_openai_key
VITE_GOOGLE_GEMINI_API_KEY=your_production_gemini_key

# Database
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_key

# Security
VITE_ENVIRONMENT=production
VITE_DEBUG_MODE=false
```

## 🔒 Security Considerations

### Frontend Security

```typescript
// API key encryption
class SecureStorage {
  private static encrypt(data: string, key: string): string {
    // Use Web Crypto API for encryption
    return CryptoJS.AES.encrypt(data, key).toString();
  }

  static storeAPIKey(key: string, value: string): void {
    const encrypted = this.encrypt(value, this.getSessionKey());
    sessionStorage.setItem(key, encrypted);
  }
}

// Input validation
const validateBreathingPattern = (pattern: any): BreathingPattern => {
  const schema = z.object({
    name: z.string().min(1).max(100),
    phases: z.object({
      inhale: z.number().min(1).max(20),
      hold: z.number().min(0).max(30).optional(),
      exhale: z.number().min(1).max(30),
    }),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  });

  return schema.parse(pattern);
};
```

### Blockchain Security

```typescript
// Transaction validation
const validateTransaction = async (transaction: string): Promise<boolean> => {
  // Validate transaction structure
  const parsed = await fcl.decode(transaction);

  // Check for malicious code patterns
  const dangerousPatterns = [
    /destroy\s+/,
    /AuthAccount\.save/,
    /AuthAccount\.load/,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(transaction));
};
```

### Privacy Protection

```typescript
// Vision data privacy
class PrivacyPreservingVision {
  private processLocally = true;
  private storeVideoData = false;

  async processSession(videoStream: MediaStream): Promise<SessionMetrics> {
    // All processing happens locally
    const metrics = await this.analyzeLocally(videoStream);

    // Only store aggregated metrics, never raw video
    await this.storeMetrics(metrics);

    // Immediately dispose of video data
    this.disposeVideoData(videoStream);

    return metrics;
  }
}
```

## 🧪 Testing

### Unit Tests

```typescript
// Vision system tests
describe("VisionSystem", () => {
  test("should detect device capabilities", async () => {
    const detector = DeviceCapabilityDetector.getInstance();
    const capabilities = await detector.detectCapabilities();

    expect(capabilities.cpuCores).toBeGreaterThan(0);
    expect(capabilities.wasmSupport).toBeDefined();
  });

  test("should adapt to performance constraints", async () => {
    const visionManager = VisionManager.getInstance();
    await visionManager.initialize("performance");

    expect(visionManager.getCurrentTier()).toBe("basic");
  });
});
```

### Integration Tests

```typescript
// Blockchain integration tests
describe("FlowIntegration", () => {
  test("should mint breathing pattern NFT", async () => {
    const pattern = {
      name: "Test Pattern",
      phases: { inhale: 4, exhale: 6 },
      difficulty: "beginner",
    };

    const result = await flowClient.mintBreathingPattern(pattern);
    expect(result.transactionId).toBeDefined();
    expect(result.tokenId).toBeDefined();
  });
});
```

### Performance Tests

```bash
# Vision system performance
npm run test:performance

# Load testing
npm run test:load

# Memory leak detection
npm run test:memory
```

## 📊 Monitoring & Analytics

### Performance Monitoring

```typescript
// Real-time performance tracking
class PerformanceMonitor {
  trackVisionPerformance(metrics: PerformanceMetrics): void {
    // Track CPU usage, memory, frame rate
    this.analytics.track("vision_performance", {
      cpuUsage: metrics.cpuUsage,
      memoryUsage: metrics.memoryUsage,
      frameRate: metrics.frameRate,
      tier: this.currentTier,
    });
  }

  trackUserEngagement(session: BreathingSession): void {
    this.analytics.track("session_completed", {
      duration: session.duration,
      pattern: session.pattern.name,
      visionEnabled: session.visionMetrics !== null,
      score: session.score,
    });
  }
}
```

### Error Tracking

```typescript
// Comprehensive error handling
class ErrorTracker {
  trackVisionError(error: VisionError): void {
    console.error("Vision error:", error);

    this.analytics.track("vision_error", {
      code: error.code,
      tier: error.tier,
      recoverable: error.recoverable,
      userAgent: navigator.userAgent,
    });
  }
}
```

## 🔄 Maintenance & Updates

### Model Updates

```typescript
// Progressive model updates
class ModelUpdateManager {
  async checkForUpdates(): Promise<void> {
    const availableModels = await this.fetchAvailableModels();
    const currentModels = this.modelLoader.getLoadedModels();

    for (const model of availableModels) {
      if (this.shouldUpdate(model, currentModels)) {
        await this.updateModel(model);
      }
    }
  }
}
```

### Feature Flags

```typescript
// Feature flag system
const featureFlags = {
  visionSystem: process.env.VITE_ENABLE_VISION === "true",
  premiumTier: process.env.VITE_ENABLE_PREMIUM === "true",
  aiCoaching: process.env.VITE_ENABLE_AI_COACHING === "true",
};
```

## 📈 Performance Optimization

### Bundle Optimization

```typescript
// Lazy loading for vision system
const VisionSystem = lazy(() => import("@/lib/vision"));

// Code splitting by tier
const BasicVision = lazy(() => import("@/lib/vision/systems/basic-vision"));
const StandardVision = lazy(
  () => import("@/lib/vision/systems/standard-vision")
);
const PremiumVision = lazy(() => import("@/lib/vision/systems/premium-vision"));
```

### Caching Strategy

```typescript
// Intelligent model caching
class ModelCache {
  private cache = new Map<string, any>();
  private maxSize = 100 * 1024 * 1024; // 100MB

  async cacheModel(name: string, model: any): Promise<void> {
    if (this.getCacheSize() + this.getModelSize(model) > this.maxSize) {
      await this.evictLeastUsed();
    }

    this.cache.set(name, {
      model,
      lastUsed: Date.now(),
      size: this.getModelSize(model),
    });
  }
}
```

## Conclusion

This Technical Guide provides a consolidated overview of the Imperfect Breath platform's architecture, development processes, and operational considerations. It is designed to be a primary resource for developers while referencing specialized documentation for deeper dives into specific areas such as the vision system and project history. The platform is built for production use with robust error handling, security measures, and performance optimizations, ensuring a scalable and maintainable Web3 wellness solution.
