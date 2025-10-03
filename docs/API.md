# API Reference

Technical documentation for developers working with Imperfect Breath APIs and integrations.

## Backend API

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

#### Get Session Data
```http
GET /api/vision/sessions/{sessionId}
```

**Response:**
```json
{
  "id": "session-uuid",
  "userId": "user-uuid",
  "patternName": "4-7-8 Breathing",
  "duration": 600,
  "metrics": {
    "avgBreathRate": 12,
    "consistencyScore": 85,
    "phasesCompleted": 8
  },
  "createdAt": "2024-01-01T00:00:00Z"
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

## Frontend Hooks

### useSession Hook

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

### useVision Hook

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

### useLens Hook

```typescript
import { useLens } from '@/hooks/useLens';

const SocialComponent = () => {
  const {
    isAuthenticated,
    authenticate,
    shareSession,
    timeline,
    loadTimeline
  } = useLens();

  const handleShare = async (session) => {
    const result = await shareSession(session);
    if (result.success) {
      await loadTimeline(); // Refresh feed
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <Feed posts={timeline} onShare={handleShare} />
      ) : (
        <button onClick={() => authenticate()}>
          Connect to Lens
        </button>
      )}
    </div>
  );
};
```

## Blockchain Integration

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

// Example error response
{
  "success": false,
  "error": {
    "code": "VISION_CAMERA_ERROR",
    "message": "Camera access denied by user",
    "details": {
      "browserError": "NotAllowedError"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
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

// Backend error handling
app.use((error, req, res, next) => {
  const apiError: APIError = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred'
    },
    timestamp: new Date().toISOString()
  };

  res.status(error.status || 500).json(apiError);
});
```

## Testing

### API Testing

```typescript
// Test vision processing
const testVisionAPI = async () => {
  const mockFrame = generateMockFrame();

  const response = await fetch('/api/vision/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      frame: mockFrame,
      sessionId: 'test-session',
      timestamp: Date.now()
    })
  });

  const result = await response.json();
  console.log('Vision API test:', result);
};

// Test AI analysis
const testAIAnalysis = async () => {
  const mockSession = generateMockSession();

  const response = await fetch('/api/ai-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionData: mockSession })
  });

  const result = await response.json();
  console.log('AI Analysis test:', result);
};
```

### Integration Testing

```typescript
// Test complete session flow
const testCompleteSession = async () => {
  // 1. Start session
  const session = await startSession({
    pattern: '4-7-8',
    duration: 300
  });

  // 2. Process frames
  for (let i = 0; i < 10; i++) {
    const frame = captureFrame();
    await processFrame(frame, session.id);
  }

  // 3. Get analysis
  const analysis = await getSessionAnalysis(session.id);
  console.log('Session complete:', analysis);
};
```

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

## Deployment

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

---

For more detailed implementation examples, see the [Architecture Guide](ARCHITECTURE.md) and [Setup Guide](SETUP.md).