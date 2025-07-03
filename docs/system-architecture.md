# BreathFlow Vision - System Architecture

## High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    BreathFlow Vision Platform                   │
├─────────────────────────────────────────────────────────────────┤
│                      Frontend (React/Vite)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │
│  │    User     │  │   Creator   │  │ Marketplace │  │ Social  │  │
│  │ Interface   │  │ Dashboard   │  │   Portal    │  │Features │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                     Core Services Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │
│  │ Breathing   │  │ Pattern     │  │     AI      │  │  Story  │  │
│  │  Engine     │  │ Management  │  │Recommender  │  │Protocol │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        Data Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │
│  │  Supabase   │  │Local Storage│  │   External  │  │ Web3 Infra│  │
│  │(PostgreSQL) │  │    Cache    │  │    APIs     │  │(Multi-Chain)│
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Architecture

#### 1. User Interface Layer

```
src/pages/
├── Home.tsx                    # Landing page
├── Session.tsx                 # Breathing session interface
├── Results.tsx                 # Session results and analytics
├── CreatePattern.tsx           # Pattern creation interface
├── EnhancedMarketplace.tsx     # Pattern marketplace
├── EnhancedCreatorDashboard.tsx # Creator management interface
├── InstructorOnboarding.tsx    # Creator verification flow
└── CreatorDashboard.tsx        # Basic creator interface
```

#### 2. Component Library

```
src/components/
├── ui/                         # Shadcn/UI components
├── breathing/                  # Session-related components
│   ├── BreathingVisualizer.tsx
│   ├── SessionControls.tsx
│   └── ProgressTracker.tsx
├── creator/                    # Creator ecosystem components
│   ├── EnhancedPatternBuilder.tsx
│   ├── AnalyticsDashboard.tsx
│   └── ContentManager.tsx
├── marketplace/                # Marketplace components
│   ├── PatternCard.tsx
│   ├── SearchFilters.tsx
│   ├── PurchaseFlow.tsx
│   ├── PatternDetailsModal.tsx
│   └── PatternReviewForm.tsx
└── social/                     # Social features
    ├── SocialActions.tsx
    ├── UserProfile.tsx
    ├── CommunityFeed.tsx
    └── FollowButton.tsx
```

### Core Services Architecture

#### 1. Breathing Engine

```
src/lib/breathingPatterns.ts
├── Pattern Definitions
├── Session Management
├── Timer Logic
└── Progress Tracking

Integration Points:
- Pattern Storage Service
- AI Recommendation Engine
- Analytics Collection
- Media Content Support
```

#### 2. Pattern Management Service

```
src/lib/patternStorage.ts
src/types/patterns.ts
├── Basic Pattern CRUD
├── Enhanced Pattern Features
├── Version Management
└── Cache Management

Features:
- Rich Metadata Support
- Media Content Management
- IP Registration Integration
```

#### 3. AI Recommendation Engine

```
src/lib/ai/
├── recommendations.ts          # Pattern recommendations
├── providers.ts               # AI service providers
└── personalization.ts         # User preference learning

Capabilities:
- Pattern Matching
- User Behavior Analysis
- Performance Optimization
- Trend Analysis
```

#### 4. Story Protocol Integration

```
src/lib/story/
├── storyClient.ts             # Main integration
├── ipAssetManager.ts          # IP asset management
└── licensingManager.ts        # License management

Features:
- IP Asset Registration
- License Creation & Management
- Royalty Distribution
- Dispute Resolution
```

### Data Architecture

#### 1. Database Schema (Supabase) - Updated

```sql
-- Core Entities
-- (users table is managed by Supabase Auth, extended with a public.users table for profiles)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'user',
  creator_verified BOOLEAN DEFAULT FALSE,
  instructor_credentials JSONB,
  -- other profile data...
);

CREATE TABLE public.patterns (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  phases JSONB NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  duration INTEGER NOT NULL,
  creator UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ip_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Enhanced fields
  enhanced_metadata JSONB,
  media_content JSONB,
  licensing_info JSONB,
  ip_asset_id VARCHAR(255)
);

CREATE TABLE public.sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pattern_id UUID REFERENCES public.patterns(id) ON DELETE CASCADE,
  -- other session data...
);

-- Creator Ecosystem
CREATE TABLE public.creator_analytics (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES public.patterns(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social Features
CREATE TABLE public.pattern_reviews (
  id UUID PRIMARY KEY,
  pattern_id UUID REFERENCES public.patterns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.social_actions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL,
  target_id UUID NOT NULL,
  action_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. State Management

```typescript
// Global State Structure
interface AppState {
  auth: {
    user: User | null;
    role: UserRole;
    permissions: Permission[];
  };
  patterns: {
    available: CustomPattern[];
    purchased: CustomPattern[];
    created: EnhancedCustomPattern[];
  };
  session: {
    current: SessionState | null;
    history: SessionRecord[];
    analytics: SessionAnalytics;
  };
  creator: {
    profile: CreatorProfile | null;
    analytics: CreatorAnalytics;
    earnings: EarningsData;
  };
  social: {
    following: User[];
    followers: User[];
    feed: SocialActivity[];
  };
}
```

## Integration Patterns

### 1. Authentication Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ Login Page  │───▶│ Auth Service │───▶│ Role Check  │
└─────────────┘    └──────────────┘    └─────────────┘
                          │                    │
                          ▼                    ▼
                   ┌──────────────┐    ┌─────────────┐
                   │ Profile Sync │    │ Navigation  │
                   └──────────────┘    │   Update    │
                                      └─────────────┘
```

### 2. Pattern Creation Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│Pattern Build│───▶│   Validation │───▶│ Supabase DB │
└─────────────┘    └──────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│Media Upload │    │IP Registration│   │ Marketplace │
└─────────────┘    └──────────────┘    │   Listing   │
                                      └─────────────┘
```

### 3. Session Experience Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│Pattern Select│───▶│Session Setup │───▶│Breathing UI │
└─────────────┘    └──────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│Analytics    │    │AI Analysis   │    │Results &    │
│Collection   │    │& Feedback    │    │Sharing      │
└─────────────┘    └──────────────┘    └─────────────┘
```

## Security Architecture

### 1. Authentication & Authorization

```
┌─────────────────────────────────────────────────────┐
│                Security Layer                       │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │    JWT      │  │  Role-Based  │  │  Route      │  │
│  │   Tokens    │  │ Permissions  │  │  Guards     │  │
│  └─────────────┘  └──────────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   Input     │  │   API Rate   │  │   Data      │  │
│  │Validation   │  │   Limiting   │  │Encryption   │  │
│  └─────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 2. Data Protection

- **Pattern IP Protection**: Story Protocol registration
- **User Data Privacy**: GDPR compliance, encrypted storage
- **Payment Security**: Secure payment processing
- **Content Security**: Digital rights management

## Performance Architecture

### 1. Optimization Strategies

```
┌─────────────────────────────────────────────────────┐
│               Performance Layer                     │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   Caching   │  │   Lazy       │  │  Code       │  │
│  │  Strategy   │  │  Loading     │  │ Splitting   │  │
│  └─────────────┘  └──────────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   CDN       │  │  Progressive │  │  Database   │  │
│  │Integration  │  │    PWA       │  │Optimization │  │
│  └─────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 2. Scalability Considerations

- **Database Indexing**: Optimized queries for pattern search
- **Media Content**: CDN delivery for audio/video content
- **Real-time Features**: WebSocket connections for live features
- **Mobile Performance**: Optimized for mobile devices

## Monitoring & Analytics

### 1. System Monitoring

```
Application Metrics
├── User Engagement (DAU/MAU, Session Duration)
├── Creator Success (Pattern Creation, Revenue)
├── System Performance (Response Times, Error Rates)
└── Business Metrics (Transaction Volume, User Growth)

Technical Monitoring
├── Error Tracking (Sentry integration)
├── Performance Monitoring (Web Vitals)
├── Database Performance (Query optimization)
└── API Monitoring (Rate limiting, Response times)
```

### 2. User Analytics

- **Session Analytics**: Breathing pattern effectiveness, user progress over time.
- **Creator Analytics**: Pattern performance, revenue, user engagement with patterns.
- **Marketplace Analytics**: Discovery funnels, conversion rates, search query analysis.
- **Social Analytics**: Community engagement metrics, follow/unfollow rates, content sharing velocity.

## External Integrations

### 1. Multi-Chain Web3 Architecture

Our platform leverages a multi-chain strategy to optimize for social engagement, real-time performance tracking, intellectual property management, and monetization. Each chain is selected for its specific strengths, creating a cohesive and powerful wellness network.

#### 🌿 Lens Chain — Social Layer & Identity

- **Role**: Social coordination, discovery, and community building. Powers the breathwork social graph.
- **Integrations**:
  - User profiles mapped to Lens profiles.
  - Publishing breathwork flows and sessions as Lens posts.
  - Social actions (likes, comments, mirrors, collects) via Lens Protocol.
  - Following creators and building communities.
  - Token-gated content based on creator NFTs or social graph interactions.
- **Lens Protocol V3 Integration Status** (Updated from `LENS_V3_INTEGRATION.md`):
  - **Current Setup**: Using `@lens-protocol/react-web@canary` and `@lens-protocol/wagmi@canary` for V3 SDK.
  - **Configuration**: App Address `DF7gzk-zW-C24tTtRamHCwj8VCuSZ40erZ` in development environment with Wagmi bindings.
  - **Completed**: Basic setup with LensProvider, session tracking with `useSession`, and error resolution.
  - **In Progress**: Authentication flow and account management are placeholders.
  - **Not Implemented**: Full authentication, content publishing, and advanced social features.
  - **Next Steps**: Implement full authentication, account operations, content features, and error handling.

#### 🌊 Flow Chain — Real-Time Interaction & Gamification

- **Role**: High-throughput, low-latency layer for real-time session data and gamified user experiences.
- **Integrations**:
  - Real-time tracking of breath patterns (inhale/exhale/holds) stored on-chain.
  - Session analytics, streaks, and personal bests recorded on Flow.
  - Dynamic NFTs that evolve based on user practice and achievements.
  - On-chain badges and quests to drive engagement.

#### 💳 Base Chain — Monetization Layer

- **Role**: Secure and low-cost monetization for creators, leveraging Zora for NFT minting.
- **Integrations**:
  - Tokenizing breathwork sessions as NFTs on Zora, minted on Base.
  - Primary and secondary sales of patterns.
  - Utilizing standards for seamless payments (e.g., pay with any token).
  - Connecting creator earnings to their on-chain identity.

#### 🧠 Story Protocol — Intellectual Property Layer

- **Role**: Registering breathwork flows as on-chain intellectual property.
- **Integrations**:
  - `registerIpAsset` flow for creators to establish ownership.
  - On-chain licensing for programmatic revenue sharing and remixes.
  - Ensuring provenance and attribution for all creative work.

### 2. AI & Machine Learning

```
AI Services
├── Pattern Recommendation Engine
├── Performance Optimization
├── Content Moderation
└── Fraud Detection

Data Sources
├── User Behavior Analytics
├── Session Performance Data
├── Market Trend Analysis
└── Community Feedback
```

This architecture provides a solid foundation for the integrated BreathFlow Vision platform, ensuring scalability, maintainability, and seamless user experience across all components.
