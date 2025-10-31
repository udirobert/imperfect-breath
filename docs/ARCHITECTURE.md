# Architecture Overview

Technical architecture and system design for Imperfect Breath.

## System Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   Blockchain    │
│   (React/PWA)   │◄──►│  (Python/FastAPI)│◄──►│  (Flow/Lens)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Local Storage │    │    Supabase      │    │      IPFS       │
│   (IndexedDB)   │    │   (PostgreSQL)   │    │  (Metadata)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Frontend Architecture

### Technology Stack
- **React 18** + **TypeScript** - UI framework
- **Vite** - Build tool & dev server
- **Tailwind CSS** + **shadcn/ui** - Styling
- **Zustand** - State management
- **TensorFlow.js** - Computer vision
- **PWA** - Offline capabilities

### Key Components
```typescript
// Core breathing session
BreathingSession/
├── PatternSelector     # Choose breathing pattern
├── SessionControls     # Start/pause/stop
├── VisionFeedback     # Camera & AI analysis
├── ProgressDisplay    # Real-time metrics
└── SessionSummary     # Results & insights

// AI & Vision
VisionSystem/
├── CameraCapture      # Video stream handling
├── FaceMeshDetection  # MediaPipe integration
├── BreathingAnalysis  # Pattern recognition
└── AICoaching         # Personalized feedback

// Web3 Integration
Web3Features/
├── WalletConnection   # Multi-chain support
├── NFTMinting         # Session achievements
├── SocialFeatures     # Lens Protocol
└── Marketplace        # Pattern trading
```

### State Management
```typescript
interface AppState {
  session: SessionStore      // Current breathing session
  user: UserStore           // Authentication & profile
  vision: VisionStore       // Camera & AI analysis
  web3: Web3Store          // Blockchain interactions
  settings: SettingsStore   // User preferences
}
```

## Backend Architecture

### Services
```python
# FastAPI application
backend/vision-service/
├── main.py              # API routes & middleware
├── vision_processor.py  # MediaPipe processing
├── ai_analysis.py       # Session insights
├── revenuecat_config.py # Monetization
└── webhook_handler.py   # External integrations
```

### API Endpoints
```
GET  /health                    # Service status
POST /api/vision/process        # Frame analysis
GET  /api/vision/sessions/{id}  # Session data
POST /api/ai-analysis          # AI insights
GET  /api/config/revenuecat    # Monetization config
```

### Data Flow
1. **Frame Capture**: Frontend captures video frames
2. **Processing**: Backend analyzes with MediaPipe
3. **AI Analysis**: Generate insights & recommendations
4. **Storage**: Save session data (local + cloud)
5. **Blockchain**: Optional NFT minting

## Database Schema

### Supabase Tables
```sql
-- User management
users (
  id uuid PRIMARY KEY,
  email text,
  wallet_address text,
  created_at timestamp
);

-- Breathing sessions
sessions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  pattern_name text,
  duration integer,
  metrics jsonb,
  created_at timestamp
);

-- Custom patterns
patterns (
  id uuid PRIMARY KEY,
  creator_id uuid REFERENCES users(id),
  name text,
  config jsonb,
  is_public boolean
);
```

### Local Storage (IndexedDB)
```typescript
interface LocalSession {
  id: string;
  timestamp: number;
  pattern: BreathingPattern;
  metrics: SessionMetrics;
  visionData?: VisionAnalysis;
}
```

## Authentication Architecture

### Multi-Chain Authentication Support

**Supported Combinations:**
- Email + Lens + Flow + Wallet = Complete Web3 experience
- Lens only = Social-focused experience
- Flow only = NFT/Creator-focused experience
- Traditional email = Basic experience with upgrade path

### Authentication Flow States
```typescript
interface AuthState {
  // Core authentication
  user: unknown;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Multi-chain states (optional)
  wallet?: { address: string; isConnected: boolean };
  flowUser?: { address: string; loggedIn: boolean };
  lensProfile?: { id: string; handle: string; name?: string };
}
```

### Core Components

#### 1. UnifiedAuthFlow
Handles method selection and shows connection status for all methods.

#### 2. ConsolidatedAuthGate
Single auth gate for all use cases with flexible fallback strategies.

#### 3. LazyWalletAuth
Lazy-loaded with conflict detection and connection timeout protection.

### Platform Compatibility

#### Web Platform
- **Mock implementations** for development
- **Graceful degradation** for unsupported features
- **Clear upgrade paths** to mobile for full functionality

#### Mobile Platform (iOS/Android)
- **Full RevenueCat integration** for subscriptions
- **Native wallet connections** via Capacitor
- **Complete Web3 functionality**

## Blockchain Integration

### Flow Blockchain
```typescript
// NFT minting for achievements
contract BreathingNFT {
  mint(sessionData: SessionMetrics): NFT
  transfer(tokenId: number, to: Address): void
  getMetadata(tokenId: number): Metadata
}
```

### Lens Protocol V3
```typescript
// Social features
interface LensIntegration {
  createPost(sessionSummary: string): Post;
  followUser(address: string): void;
  sharePattern(pattern: BreathingPattern): void;
}
```

## Security Architecture

### Data Protection
- **Client-side**: No sensitive data in localStorage
- **Transport**: HTTPS/WSS for all communications
- **Storage**: Encrypted user data in Supabase
- **Blockchain**: Non-reversible session hashes

### Privacy by Design
```typescript
interface PrivacyControls {
  dataRetention: '30d' | '1y' | 'forever';
  shareMetrics: boolean;
  allowAnalytics: boolean;
  exportData: () => UserData;
  deleteAccount: () => Promise<void>;
}
```

## API Reference

### Vision Service API

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Process Frame
```http
POST /api/vision/process
Content-Type: application/json

{
  "frame": "base64-encoded-image",
  "sessionId": "session-uuid",
  "timestamp": 1640995200
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "breathingPhase": "inhale|hold|exhale",
    "confidence": 0.85,
    "landmarks": [[x, y, z], ...],
    "metrics": {
      "breathRate": 12,
      "consistency": 0.8
    }
  }
}
```

### AI Analysis API

#### Generate Insights
```http
POST /api/ai-analysis
Content-Type: application/json

{
  "sessionData": {
    "pattern": "4-7-8",
    "duration": 600,
    "metrics": {...}
  },
  "userHistory": [...]
}
```

**Response:**
```json
{
  "insights": [
    "Great consistency in breath holds",
    "Try extending exhale phase for deeper relaxation"
  ],
  "recommendations": [
    "Consider 6-7-8 pattern for next session",
    "Focus on smooth transitions between phases"
  ],
  "score": 85
}
```

### Frontend Hooks

#### useSession Hook
```typescript
import { useSession } from '@/hooks/useSession';

const MyComponent = () => {
  const {
    startSession,
    pauseSession,
    endSession,
    currentPhase,
    timeRemaining,
    metrics
  } = useSession();

  const handleStart = () => {
    startSession({
      pattern: '4-7-8',
      duration: 600,
      enableVision: true
    });
  };

  return (
    <div>
      <p>Phase: {currentPhase}</p>
      <p>Time: {timeRemaining}s</p>
      <button onClick={handleStart}>Start</button>
    </div>
  );
};
```

#### useVision Hook
```typescript
import { useVision } from '@/hooks/useVision';

const VisionComponent = () => {
  const {
    isActive,
    startVision,
    stopVision,
    analysis,
    error
  } = useVision();

  useEffect(() => {
    if (isActive && analysis) {
      console.log('Breathing phase:', analysis.breathingPhase);
    }
  }, [analysis]);

  return (
    <div>
      {error && <p>Error: {error}</p>}
      <button onClick={startVision}>Enable Camera</button>
    </div>
  );
};
```

## Blockchain Integration APIs

### Flow Blockchain

#### NFT Minting
```typescript
import { mintBreathingNFT } from '@/lib/flow/nft';

const mintAchievement = async (sessionData) => {
  const nft = await mintBreathingNFT({
    sessionMetrics: sessionData.metrics,
    patternName: sessionData.pattern,
    timestamp: sessionData.completedAt,
    metadata: {
      description: "Breathing session achievement",
      attributes: [
        { trait_type: "Pattern", value: sessionData.pattern },
        { trait_type: "Score", value: sessionData.score }
      ]
    }
  });

  return nft;
};
```

#### Marketplace Integration
```typescript
import { listPatternForSale } from '@/lib/flow/marketplace';

const sellPattern = async (pattern) => {
  const listing = await listPatternForSale({
    patternId: pattern.id,
    price: "10.0", // FLOW tokens
    royalty: 5 // 5% royalty to creator
  });

  return listing;
};
```

## Configuration

### Environment Variables
```bash
# Required for enhanced features (optional)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_key
VITE_HETZNER_SERVICE_URL=https://api.imperfectform.fun

# Blockchain (optional)
VITE_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
VITE_LENS_API_URL=https://api-v2-mumbai.lens.dev
```

### API Client Configuration
```typescript
// src/lib/api/unified-client.ts
export const apiClient = {
  vision: new VisionAPI({
    baseURL: import.meta.env.VITE_HETZNER_SERVICE_URL || 'http://localhost:8001'
  }),

  ai: new AIAnalysisAPI({
    provider: 'gemini', // or 'openai', 'anthropic'
    apiKey: import.meta.env.VITE_GEMINI_API_KEY
  }),

  social: new LensAPI({
    baseURL: import.meta.env.VITE_LENS_API_URL
  })
};
```

## Error Handling

### Standard Error Response Format
```typescript
interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

### Error Handling Patterns
```typescript
// Frontend error handling
const handleAPIError = (error: APIError) => {
  switch (error.error.code) {
    case 'VISION_CAMERA_ERROR':
      // Fallback to manual mode
      setVisionEnabled(false);
      break;
    case 'AUTH_REQUIRED':
      // Redirect to auth
      navigate('/auth');
      break;
    default:
      // Generic error handling
      showToast(error.error.message, 'error');
  }
};
```

## Performance Optimizations

### Frontend
- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: WebP with fallbacks
- **Caching**: Service worker for offline use
- **Bundle Size**: Tree shaking & compression

### Backend
- **Connection Pooling**: Database connections
- **Caching**: Redis for session data
- **Rate Limiting**: API endpoint protection
- **Monitoring**: Health checks & metrics

## Deployment Architecture

### Production Stack
```yaml
# docker-compose.yml
services:
  frontend:
    image: nginx:alpine
    ports: ["80:80", "443:443"]

  backend:
    image: python:3.11-slim
    ports: ["8001:8001"]
    environment:
      - ENV=production

  database:
    image: postgres:15
    volumes: ["./data:/var/lib/postgresql/data"]
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - uses: netlify/actions/deploy@master
```

## Monitoring & Analytics

### Application Metrics
- Session completion rates
- Feature usage patterns
- Performance benchmarks
- Error tracking

### Business Metrics
- User acquisition & retention
- Pattern creation & sharing
- NFT minting activity
- Revenue tracking

## Scalability Considerations

### Horizontal Scaling
- Stateless backend services
- Database read replicas
- CDN for static assets
- Load balancing

### Vertical Scaling
- Optimized algorithms
- Efficient data structures
- Memory management
- CPU utilization
