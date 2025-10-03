# Architecture Overview

Technical architecture and system design decisions.

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
// Zustand stores
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
