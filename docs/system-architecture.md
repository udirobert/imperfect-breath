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
│  │  Supabase   │  │Local Storage│  │   External  │  │Blockchain│  │
│  │(PostgreSQL) │  │    Cache    │  │    APIs     │  │ Storage │  │
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
│   └── PurchaseFlow.tsx
└── social/                     # Social features
    ├── SocialActions.tsx
    ├── UserProfile.tsx
    └── CommunityFeed.tsx
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

- **Session Analytics**: Breathing pattern effectiveness
- **Creator Analytics**: Pattern performance and earnings
- **Marketplace Analytics**: Discovery and conversion rates
- **Social Analytics**: Community engagement metrics

## External Integrations

### 1. Blockchain & Web3

```
Story Protocol
├── IP Asset Registration
├── License Management
├── Royalty Distribution
└── Dispute Resolution

Payment Systems
├── Cryptocurrency Support
├── Traditional Payment Processing
├── Escrow Services
└── Revenue Sharing
```

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
