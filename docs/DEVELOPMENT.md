# Development Guide

Complete development guide for Imperfect Breath - setup, roadmap, implementation, and testing.

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Deployment
```bash
# Check deployment status
npm run deploy

# Deploy vision service
npm run deploy:vision

# Configure domain & SSL
npm run deploy:domain

# Configure firewall
npm run deploy:firewall
```

## Development Environment

### Frontend Only (Recommended)
```bash
npm run dev
# Opens http://localhost:4556
# Works with all core features + fallback AI
```

### Full Stack (Optional)
```bash
# Terminal 1: Backend services
cd backend/vision-service
pip install -r requirements.txt
MODEL_DOWNLOAD_ON_START=false python3 main.py

# Terminal 2: Frontend
npm run dev
```

## Environment Variables

### Required (None)
The app works immediately without any configuration.

### Optional Enhancements
```bash
# .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_key
VITE_HETZNER_SERVICE_URL=https://api.imperfectform.fun
```

## Development Commands

```bash
# Development
npm run dev           # Start dev server
npm run dev:full      # Start with backend
npm run preview       # Preview production build

# Building
npm run build         # Production build
npm run build:analyze # Bundle analysis

# Quality
npm run lint          # ESLint
npm run lint:fix      # Auto-fix issues
npm run format        # Prettier formatting
npm run type-check    # TypeScript check

# Testing
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Project Structure

```
imperfect-breath/
├── src/
│   ├── components/     # React components
│   ├── lib/           # Utilities & services
│   ├── stores/        # State management
│   └── styles/        # CSS & themes
├── backend/
│   └── vision-service/ # Python backend
├── docs/              # Documentation
└── public/            # Static assets
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Make changes and test: `npm test`
4. Submit pull request

## Security

- Never commit API keys
- Use environment variables for secrets
- Run security scan: `npm run security-check`
- Report issues via GitHub Issues

## AI Analysis System Roadmap

### Phase 1: Enhanced Prompt Engineering (✅ Complete)

**Achievements:**
- ✅ Created sophisticated "Dr. Breathe" AI persona with expert knowledge
- ✅ Implemented data-driven prompts that reference specific session metrics
- ✅ Added pattern-specific expertise and scientific explanations
- ✅ Built comprehensive breathing pattern knowledge base

**Key Files:**
- `src/lib/ai/breathing-expertise.ts` - Comprehensive pattern knowledge
- `src/lib/ai/enhanced-prompts.ts` - Sophisticated prompt engineering
- `src/lib/ai/enhanced-analysis-service.ts` - Integration service
- `src/lib/ai/user-experience-assessment.ts` - Advanced user profiling
- `src/components/ai/EnhancedAIAnalysisDisplay.tsx` - Premium UI component

### Phase 2: Interactive Chat System (✅ Complete)

**Achievements:**
- ✅ Dr. Breathe persona system with warm, approachable AI coach personality
- ✅ Interactive chat interface integrated into analysis display
- ✅ Real-time conversation system with message history
- ✅ Usage limits & premium features with smart tracking
- ✅ Complete UI rebrand from "AI Analysis" to "Dr. Breathe"

### Phase 3: Adaptive Learning System (📋 Planned)

**Planned Features:**
- Advanced personalization with user profile learning
- Adaptive recommendation algorithms and goal-based coaching
- Premium features including real-time session guidance
- Advanced analytics dashboard and community coaching features

## Blockchain Implementation

### Real Blockchain Integration (✅ Complete)

**What Was Implemented:**
- ✅ Real Lens Protocol integration with official SDK
- ✅ Real Flow Blockchain integration with NFT operations
- ✅ User-friendly error messages and transaction monitoring
- ✅ Gas cost estimation and transaction status tracking

**Key Features:**
- **Lens Protocol**: Share sessions, create posts, follow users, load timeline
- **Flow Blockchain**: Mint NFTs, transfer assets, marketplace payments
- **Error Handling**: User-friendly error translations and recovery
- **Transaction Monitoring**: Real-time status updates and gas estimates

### Testing Recommendations

#### Lens Protocol Testing
```typescript
// 1. Connect and authenticate
const { authenticateLens } = useBlockchainAuth();
await authenticateLens();

// 2. Share a session
const { shareBreathingSession } = useLens();
await shareBreathingSession(sessionData, score);

// 3. Create a post
const { createPost } = useLens();
await createPost("Test post content", ["breathing", "wellness"]);

// 4. Follow someone
const { followUser } = useLens();
await followUser("0x1234...");
```

#### Flow Testing
```typescript
// 1. Connect wallet
const { connect } = useFlow();
await connect();

// 2. Mint an NFT
const { mintBreathingPattern } = useFlow();
const txId = await mintBreathingPattern(attributes, metadata);

// 3. Monitor transaction
const { waitForTransaction } = useFlow();
await waitForTransaction(txId);
```

## User Testing Readiness

### Integration Rating: 8.5/10 ⭐⭐⭐⭐

**Strengths:**
- ✅ Real blockchain integration using official SDKs
- ✅ Unified architecture with single source of truth
- ✅ Proper error handling and session management
- ✅ Type safety and comprehensive testing coverage

**Areas for Improvement:**
- 🔧 Enhanced transaction status monitoring
- 🔧 User-friendly error message translations
- 🔧 Gas cost preview before transactions
- 🔧 Loading states and progress indicators

### Pre-User Testing Checklist

#### Critical (Must Have) 🔴
- [x] Transaction status tracking
- [x] User-friendly error messages
- [x] Loading states and progress indicators
- [x] Wallet connection UI

#### Important (Should Have) 🟡
- [x] Transaction history
- [x] Gas cost preview
- [x] Network status indicator
- [x] Retry logic for failed operations

### Testing Plan

#### Phase 1: Internal Testing (1-2 days)
**Lens Protocol Tests:**
1. Connect wallet → Authenticate → Create post
2. Follow/unfollow users
3. Load timeline with pagination
4. Load user profiles
5. Share breathing session

**Flow Blockchain Tests:**
1. Connect Flow wallet
2. Mint NFT (check on Flow testnet explorer)
3. Transfer NFT between accounts
4. Execute payment transaction
5. Check transaction status

#### Phase 2: Alpha Testing (3-5 days)
**Participants**: 5-10 internal users
**Focus**: Complete user flows and error scenarios

#### Phase 3: Beta Testing (1-2 weeks)
**Participants**: 50-100 external users
**Focus**: Real-world usage and performance under load

## Deployment Checklist

### Before User Testing
- [x] Set up testnet faucets for users
- [x] Create test accounts with tokens
- [x] Deploy to staging environment
- [x] Set up error monitoring (Sentry)
- [x] Configure analytics (PostHog/Mixpanel)
- [x] Create user testing guide
- [x] Set up feedback collection form
- [x] Prepare rollback plan

### Environment Variables
```env
# .env.testing
VITE_LENS_APP_ID=0xC75A89145d765c396fd75CbD16380Eb184Bd2ca7
VITE_LENS_ENVIRONMENT=testnet
VITE_FLOW_NETWORK=testnet
VITE_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
```

## Success Metrics

### Technical Metrics
- Transaction success rate: >95%
- Average transaction time: <30 seconds
- Error rate: <5%
- Session persistence: >90%

### User Experience Metrics
- Task completion rate: >80%
- User satisfaction: >4/5
- Feature discovery: >70%
- Return rate: >60%

## Common Issues

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules dist .vite
npm install
npm run build
```

### Backend Connection Issues
```bash
# Check backend health
curl http://localhost:8001/health
# Should return: {"status": "healthy"}
```

### Camera Not Working
- Ensure HTTPS (required for camera access)
- Check browser permissions
- Try different browser

## Performance Optimization

### Caching Strategies
```typescript
// Session data caching
const cacheManager = {
  get: (key: string) => {
    const cached = localStorage.getItem(`cache:${key}`);
    if (cached) {
      const { data, expiry } = JSON.parse(cached);
      if (Date.now() < expiry) {
        return data;
      }
    }
    return null;
  },

  set: (key: string, data: any, ttlMinutes = 30) => {
    const cacheEntry = {
      data,
      expiry: Date.now() + (ttlMinutes * 60 * 1000)
    };
    localStorage.setItem(`cache:${key}`, JSON.stringify(cacheEntry));
  }
};
```

### Rate Limiting
```typescript
// Client-side rate limiting
const rateLimiter = {
  requests: new Map(),

  canMakeRequest: (endpoint: string): boolean => {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    const endpointRequests = rateLimiter.requests.get(endpoint) || [];

    // Clean old requests
    const recentRequests = endpointRequests.filter(time => time > windowStart);

    // Check limit (max 30 requests per minute)
    if (recentRequests.length >= 30) {
      return false;
    }

    // Record this request
    recentRequests.push(now);
    rateLimiter.requests.set(endpoint, recentRequests);
    return true;
  }
};
```

## Deployment Architecture

### API Service Deployment
```yaml
# docker-compose.yml
version: '3.8'
services:
  vision-api:
    build: ./backend/vision-service
    ports:
      - "8001:8001"
    environment:
      - ENV=production
      - MODEL_DOWNLOAD_ON_START=false
    restart: unless-stopped

  ai-service:
    build: ./backend/ai-service
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - vision-api
```

### Health Monitoring
```typescript
// Health check implementation
const healthCheck = async () => {
  const checks = await Promise.all([
    checkVisionService(),
    checkAIService(),
    checkDatabase(),
    checkBlockchain()
  ]);

  return {
    status: checks.every(check => check.status === 'healthy') ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  };
};
```

## Next Steps

### Week 1: Critical Fixes
1. ✅ Implement transaction status tracking
2. ✅ Add user-friendly error messages
3. ✅ Create wallet connection UI
4. ✅ Add loading states and progress indicators
5. ✅ Set up error monitoring

### Week 2: Testing & Refinement
1. ✅ Internal testing (all team members)
2. ✅ Fix critical bugs
3. ✅ Alpha testing (5-10 users)
4. ✅ Iterate based on feedback
5. ✅ Performance optimization

### Week 3: Beta Preparation
1. ✅ Beta testing (50-100 users)
2. ✅ Monitor metrics
3. ✅ Collect feedback
4. ✅ Final refinements
5. ✅ Prepare for production

## Resources

- [Lens Protocol Documentation](https://docs.lens.xyz/)
- [Flow Blockchain Documentation](https://developers.flow.com/)
- [FCL Documentation](https://developers.flow.com/tools/fcl-js)
- [Live Demo](https://imperfectbreath.netlify.app)