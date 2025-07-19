# Technical & Development Guide

## Overview

Imperfect Breath is a production-ready multichain wellness platform that combines ancient breathing wisdom with cutting-edge Web3 technology and AI-powered computer vision. This guide provides comprehensive technical documentation for developers, covering architecture, setup, deployment, and advanced features.

## 🏗️ System Architecture

### Mobile-First Multichain Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                MOBILE-FIRST WELLNESS PLATFORM              │
├─────────────────────────────────────────────────────────────┤
│  📱 Mobile-Optimized Frontend                              │
│  ├── Progressive Web App (PWA)                             │
│  ├── Touch-First Interface Design                          │
│  ├── Offline-Capable Core Features                         │
│  └── Responsive Breakpoint Strategy                        │
├─────────────────────────────────────────────────────────────┤
│  🎯 Adaptive Vision System                                  │
│  ├── Mobile-Optimized Processing                           │
│  ├── Battery-Aware Performance                             │
│  ├── Touch-Screen Camera Controls                          │
│  └── Progressive Enhancement                                │
├─────────────────────────────────────────────────────────────┤
│  🔄 Progressive Authentication                              │
│  ├── Email-First Onboarding                                │
│  ├── Optional Wallet Connection                             │
│  ├── Unified Identity Management                            │
│  └── Cross-Platform Sync                                   │
├─────────────────────────────────────────────────────────────┤
│  ⛓️ Blockchain Integration                                  │
│  ├── Flow Blockchain (NFTs & Marketplace)                  │
│  ├── Story Protocol (IP & Royalties)                       │
│  └── Lens Protocol (Social & Community)                    │
├─────────────────────────────────────────────────────────────┤
│  🗄️ Hybrid Data Strategy                                   │
│  ├── Local Storage (Offline capability)                    │
│  ├── Supabase (Cross-platform sync)                        │
│  └── IPFS (Decentralized metadata)                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Touch Input → Progressive Enhancement → Feature Unlock
     ↓                ↓                      ↓
Quick Start → Email Signup → Wallet Connection (Optional)
     ↓                ↓                      ↓
Local Storage → Cloud Sync → Blockchain Integration
     ↓                ↓                      ↓
Offline Practice → Progress Tracking → Social Sharing
```

## 🔧 Development Setup

### Prerequisites

```bash
# Required
Bun (package manager)
Node.js 18+
Git

# Mobile Testing Tools
Chrome DevTools (Mobile simulation)
iOS Simulator / Android Emulator
Real device testing setup

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
   bun install
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
   bun run dev
   ```

### Development Workflow

```bash
# Frontend development
bun run dev              # Start dev server
bun run build           # Production build
bun run preview         # Preview build

# Blockchain development
bun run flow:setup      # Setup Flow environment
bun run flow:deploy     # Deploy contracts
bun run flow:test       # Test contracts

# AI Agent development
cd eliza-agent-temp
pnpm install
pnpm start --character="../characters/breathing-coach.character.json"

# Vision system testing
bun run test:vision     # Test computer vision
bun run test:performance # Performance benchmarks
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

### Three-Tier Architecture

#### 🟢 Basic Tier (95% Device Compatibility)

- **Target**: Budget smartphones, older laptops, basic tablets
- **Performance**: 5 FPS processing, minimal CPU usage
- **Features**: Simple motion detection, face presence, estimated breathing rate

```typescript
interface BasicMetrics {
  confidence: number; // 0-1, overall detection confidence
  movementLevel: number; // 0-1, amount of movement detected
  facePresent: boolean; // Whether face is detected
  estimatedBreathingRate: number; // Breaths per minute estimate
  headAlignment: number; // 0-1, basic posture check
}
```

#### 🟡 Standard Tier (80% Device Compatibility)

- **Target**: Mid-range smartphones, modern laptops, recent tablets
- **Performance**: 10 FPS processing, moderate CPU usage
- **Features**: Lightweight facial landmarks, upper body posture, breathing rhythm

```typescript
interface StandardMetrics extends BasicMetrics {
  facialTension: number; // 0-1, stress indicators in face
  postureQuality: number; // 0-1, upper body alignment
  breathingRhythm: {
    rate: number; // Actual breathing rate
    consistency: number; // 0-1, rhythm regularity
  };
  restlessnessScore: number; // 0-1, overall movement/fidgeting
}
```

#### 🔴 Premium Tier (60% Device Compatibility)

- **Target**: High-end smartphones, gaming laptops, desktop computers
- **Performance**: 15 FPS processing, higher CPU usage
- **Features**: Full facial mesh (468 landmarks), complete pose detection (33 body points)

```typescript
interface PremiumMetrics extends StandardMetrics {
  detailedFacialAnalysis: {
    nostrilMovement: number; // Breathing detection from nostrils
    jawTension: number; // Jaw clenching/tension
    eyeMovement: number; // Gaze stability and focus
    microExpressions: number; // Subtle emotional indicators
  };
  fullBodyPosture: {
    spinalAlignment: number; // Complete spine analysis
    shoulderTension: number; // Shoulder position and stress
    chestExpansion: number; // Breathing depth indicator
    overallPosture: number; // Composite posture score
  };
  preciseBreathingMetrics: {
    actualRate: number; // Precise breathing rate
    targetRate: number; // Pattern target rate
    rhythmAccuracy: number; // 0-1, pattern matching accuracy
    depthConsistency: number; // Breathing depth regularity
  };
}
```

### Basic Integration

```typescript
import { useVisionSystem } from "@/lib/vision";

const MyBreathingComponent = () => {
  const { initialize, start, stop, metrics, tier, error } = useVisionSystem({
    autoInitialize: true,
    defaultMode: "auto",
  });

  const handleStartSession = async () => {
    try {
      await start(); // Automatically requests camera permission
    } catch (error) {
      console.error("Failed to start vision:", error);
    }
  };

  return (
    <div>
      <div>Current Tier: {tier}</div>
      <div>Confidence: {metrics?.confidence}%</div>
      <button onClick={handleStartSession}>Start Vision</button>
      {error && <div>Error: {error}</div>}
    </div>
  );
};
```

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
bun install
cd eliza-agent-temp && pnpm install

# 3. Build vision system
cd packages/breathing-pattern-plugin && pnpm build

# 4. Start services
bun run dev                    # Frontend
cd eliza-agent-temp && ./start-zen.sh  # AI Agent
```

### Production Deployment

**Frontend (Vercel/Netlify)**

```bash
# Build for production
bun run build

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
bun run test:performance

# Load testing
bun run test:load

# Memory leak detection
bun run test:memory
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

This Technical Guide provides comprehensive documentation for developers working with the Imperfect Breath platform, covering all major technical aspects from setup to deployment and monitoring.
