# 🔍 AI Analysis Debug Investigation

## Current Flow Analysis

When a user clicks "Get AI Analysis" button, here's what happens:

### 1. **Frontend Flow** (`src/pages/Results.tsx`)
```javascript
const handleAIAnalysis = async () => {
  // 1. Check session data exists
  if (!sessionData.patternName) {
    toast.error("No session data available for analysis");
    return;
  }

  // 2. Build enhanced session data
  let enhancedSessionData: SessionData = {
    breathHoldTime: sessionData.breathHoldTime || 0,
    restlessnessScore: sessionData.restlessnessScore || 0,
    patternName: sessionData.patternName,
    sessionDuration: sessionData.sessionDuration || 0,
    timestamp: new Date().toISOString(),
    landmarks: 68,
  };

  // 3. Fetch vision data from Hetzner server (if available)
  if (sessionData.visionSessionId && sessionData.cameraUsed !== false) {
    // Fetch from: ${VITE_HETZNER_SERVICE_URL}/api/vision/sessions/${sessionId}/summary
  }

  // 4. Call AI analysis
  setShowAIAnalysis(true);
  await analyzeSession(enhancedSessionData);
};
```

### 2. **useSecureAIAnalysis Hook** (`src/hooks/useSecureAIAnalysis.ts`)
```javascript
const analyzeSession = async (sessionData: SessionData) => {
  setIsAnalyzing(true);
  setResults([]);
  setError(null);

  // Try all 3 providers: ['google', 'openai', 'anthropic']
  const providers: SecureAIProvider[] = ['google', 'openai', 'anthropic'];
  const analysisPromises = providers.map(provider => 
    analyzeWithProvider(provider, sessionData)
  );

  // Wait for all providers to respond
  const analysisResults = await Promise.allSettled(analysisPromises);
  // Filter successful results
  const successfulResults = analysisResults
    .filter(result => result.status === 'fulfilled' && !result.value.error)
    .map(result => result.value);

  if (successfulResults.length === 0) {
    setError('All AI providers failed to analyze the session');
  }
  setResults(successfulResults);
};
```

### 3. **API Client** (`src/lib/api/unified-client.ts`)
```javascript
async analyzeSession(provider: string, sessionData: any): Promise<APIResponse> {
  const requestBody = {
    provider,
    session_data: sessionData, // Match Hetzner server format
    analysis_type: 'session'
  };

  return await this.request('ai', API_ENDPOINTS.ai.analysis, {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
}
```

### 4. **Service Registry** (`src/lib/api/unified-client.ts`)
```javascript
// AI service configuration
this.registerService({
  name: 'ai',
  baseUrl: config.services.ai.url, // VITE_HETZNER_SERVICE_URL || 'http://localhost:8001'
  healthCheck: API_ENDPOINTS.ai.health, // '/health'
  timeout: config.services.ai.timeout, // 30000ms
  retries: config.services.ai.retries, // 3
  requiresAuth: false,
});
```

## 🚨 **Potential Issues**

### Issue 1: **Environment Variable**
- **Expected**: `VITE_HETZNER_SERVICE_URL` should point to your Hetzner server
- **Fallback**: `http://localhost:8001` (development)
- **Check**: What is the actual value in production?

### Issue 2: **API Endpoint Path**
- **Frontend sends to**: `${HETZNER_URL}/api/ai-analysis`
- **Backend expects**: Does your Hetzner server have this endpoint?

### Issue 3: **Request Format**
- **Frontend sends**:
  ```json
  {
    "provider": "openai",
    "session_data": {
      "patternName": "Box Breathing",
      "sessionDuration": 300,
      "breathHoldTime": 15,
      "restlessnessScore": 25,
      "landmarks": 68,
      "timestamp": "2024-01-05T..."
    },
    "analysis_type": "session"
  }
  ```
- **Backend expects**: Does this match your server's expected format?

### Issue 4: **CORS Configuration**
- **Frontend origin**: Your Netlify domain
- **Backend**: Hetzner server needs CORS headers for your domain

### Issue 5: **Network/Firewall**
- **Hetzner server**: Is it accessible from external networks?
- **Port**: Is the service running on the expected port?

## 🔧 **Debug Steps**

### Step 1: Check Environment Variables
```bash
# In browser console on your production site:
console.log('HETZNER_URL:', import.meta.env.VITE_HETZNER_SERVICE_URL);
console.log('AI_URL:', config.services.ai.url);
```

### Step 2: Test Direct API Call
```javascript
// In browser console:
fetch('YOUR_HETZNER_URL/health')
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);
```

### Step 3: Test AI Endpoint
```javascript
// In browser console:
fetch('YOUR_HETZNER_URL/api/ai-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'openai',
    session_data: {
      patternName: 'Test',
      sessionDuration: 60,
      breathHoldTime: 10,
      restlessnessScore: 30
    },
    analysis_type: 'session'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Step 4: Check Network Tab
1. Open DevTools → Network tab
2. Click "Get AI Analysis"
3. Look for requests to your Hetzner server
4. Check:
   - Request URL
   - Request headers
   - Request body
   - Response status
   - Response body
   - Any CORS errors

## 🎯 **Most Likely Issues**

1. **Environment Variable Not Set**: `VITE_HETZNER_SERVICE_URL` is undefined in production
2. **CORS Error**: Hetzner server not configured for your domain
3. **Wrong Endpoint**: Server doesn't have `/api/ai-analysis` endpoint
4. **Server Down**: Hetzner server not running or accessible
5. **Request Format Mismatch**: Server expects different JSON structure

## 🚀 **Quick Fixes**

### Fix 1: Add Debug Logging
```javascript
// Add to handleAIAnalysis in Results.tsx
console.log('🔍 AI Analysis Debug:', {
  hetznerUrl: import.meta.env.VITE_HETZNER_SERVICE_URL,
  aiServiceUrl: config.services.ai.url,
  sessionData: enhancedSessionData,
  hasVisionSessionId: !!sessionData.visionSessionId
});
```

### Fix 2: Add Error Handling
```javascript
// In useSecureAIAnalysis.ts analyzeWithProvider
try {
  console.log('🚀 Calling AI API:', { provider, url: api.ai.analyzeSession });
  const response = await api.ai.analyzeSession(provider, sessionData);
  console.log('✅ AI API Response:', response);
  // ... rest of code
} catch (error) {
  console.error('❌ AI API Error:', error);
  // ... error handling
}
```

### Fix 3: Test Fallback
```javascript
// Temporarily modify unified-client.ts to always use fallback
async analyzeSession(provider: string, sessionData: any): Promise<APIResponse> {
  console.warn('🔧 Using fallback AI response for debugging');
  return {
    success: true,
    data: {
      analysis: 'Debug: AI analysis working with fallback response',
      suggestions: ['Test suggestion 1', 'Test suggestion 2'],
      score: { overall: 75, focus: 70, consistency: 80, progress: 75 },
      nextSteps: ['Debug step 1', 'Debug step 2'],
    },
    metadata: { provider: 'debug-fallback' },
  };
}
```

## 📋 **Action Items**

1. **Check environment variables** in production
2. **Test Hetzner server accessibility** from browser
3. **Verify API endpoint exists** on server
4. **Check CORS configuration** on server
5. **Add debug logging** to frontend
6. **Test with fallback response** to isolate issue