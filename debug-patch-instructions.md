# 🔧 Debug Patch Instructions

## Quick Debug Setup

To debug the AI analysis issue, temporarily add the debug button to your Results page:

### 1. **Add Import to Results.tsx**

Add this import at the top of `src/pages/Results.tsx`:

```typescript
// Add this import (temporary for debugging)
import { AIAnalysisDebugButton } from '../components/debug/AIAnalysisDebugButton';
```

### 2. **Add Debug Button to Results Page**

Add this component right after the AI Analysis section (around line 880):

```tsx
{/* AI Analysis Section - Only for enhanced sessions */}
{enhancedSessionData.sessionType !== \"classic\" && !showAIAnalysis && (
  <div className=\"mb-8 w-full max-w-4xl\">
    {/* Existing AI Analysis Card */}
    <Card>
      {/* ... existing content ... */}
    </Card>
    
    {/* 🚧 TEMPORARY DEBUG BUTTON - Remove after debugging */}
    <div className=\"mt-4\">
      <AIAnalysisDebugButton />
    </div>
  </div>
)}
```

### 3. **Test the Debug Flow**

1. Complete a breathing session (Enhanced mode)
2. Go to Results page
3. Scroll down to find the orange "AI Analysis Debug Tool" card
4. Click "Debug AI Analysis" button
5. Review the test results

### 4. **Interpret Results**

The debug tool will test:

- ✅ **Environment Config**: Check if VITE_HETZNER_SERVICE_URL is set
- ✅ **Basic Connectivity**: Can reach your Hetzner server
- ✅ **Health Endpoint**: Server responds to `/health`
- ✅ **AI Analysis Endpoint**: Server responds to `/api/ai-analysis`
- ✅ **Real Session Data**: Full AI analysis request

### 5. **Common Issues & Solutions**

#### Issue: Environment Config Fails
```bash
# Check your environment variables
echo $VITE_HETZNER_SERVICE_URL
# Should output your Hetzner server URL
```

#### Issue: Basic Connectivity Fails
- Check if Hetzner server is running
- Verify firewall/security group settings
- Test with: `curl -I YOUR_HETZNER_URL`

#### Issue: Health Endpoint Fails
- Server may not have `/health` endpoint
- Check server logs for errors
- Verify server is listening on correct port

#### Issue: AI Analysis Endpoint Fails
- Server may not have `/api/ai-analysis` endpoint
- Check request format matches server expectations
- Verify CORS headers are configured

#### Issue: CORS Errors
Add to your Hetzner server:
```python
# For FastAPI
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-netlify-domain.netlify.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 6. **Browser Console Debug**

You can also run diagnostics directly in browser console:

```javascript
// Run full diagnostic
await window.debugAIAnalysis();

// Check environment
console.log('Hetzner URL:', import.meta.env.VITE_HETZNER_SERVICE_URL);

// Test direct API call
fetch('YOUR_HETZNER_URL/health')
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);
```

### 7. **Remove Debug Code**

After debugging, remove:
1. The import from Results.tsx
2. The `<AIAnalysisDebugButton />` component
3. The debug files (optional):
   - `src/debug/ai-analysis-debug.ts`
   - `src/components/debug/AIAnalysisDebugButton.tsx`

## 🎯 Expected Outcomes

### If All Tests Pass ✅
- AI analysis should work normally
- Issue might be intermittent or data-specific

### If Environment Config Fails ❌
- Set `VITE_HETZNER_SERVICE_URL` environment variable
- Redeploy your frontend

### If Connectivity Fails ❌
- Check Hetzner server status
- Verify network/firewall settings
- Test server accessibility

### If Health Endpoint Fails ❌
- Implement `/health` endpoint on server
- Check server logs for errors

### If AI Endpoint Fails ❌
- Implement `/api/ai-analysis` endpoint
- Check request/response format
- Verify AI provider configuration

This debug tool will quickly identify exactly where the AI analysis is failing!