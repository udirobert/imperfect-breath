# Vision Processing Architecture Recommendation

## Problem Analysis

Your current frontend-heavy approach has several issues:

1. **Browser Resource Constraints**: TensorFlow.js models are large and heavy
2. **Network Dependencies**: MediaPipe models require external CDNs 
3. **Device Limitations**: Mobile devices struggle with intensive processing
4. **Reliability Issues**: Complex fallback chains create instability

## Recommended: Hybrid Backend-Frontend Architecture

### Phase 1: Backend Vision Service (Primary)

Create a reliable vision processing service on your Hetzner server:

```typescript
// Backend: /api/vision/process
interface VisionProcessingRequest {
  imageData: string; // base64 encoded frame
  sessionId: string;
  timestamp: number;
  options: {
    detectFace: boolean;
    analyzePosture: boolean;
    trackBreathing: boolean;
  };
}

interface VisionProcessingResponse {
  success: boolean;
  metrics: {
    confidence: number;
    faceDetected: boolean;
    postureScore: number;
    movementLevel: number;
    breathingRate?: number;
    landmarks?: FaceLandmark[];
  };
  processingTime: number;
}
```

**Backend Implementation (Python/FastAPI or Node.js):**
- Use server-grade OpenCV + MediaPipe
- GPU acceleration available
- Stable model versions
- Batch processing capabilities
- No CORS issues

### Phase 2: Lightweight Frontend Client

Simplified frontend that captures and sends frames:

```typescript
// Frontend: Simplified Vision Hook
export const useBackendVision = (config: VisionConfig) => {
  const [metrics, setMetrics] = useState<VisionMetrics | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const processFrame = useCallback(async (videoElement: HTMLVideoElement) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      // Capture frame efficiently
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 320; // Downsample for faster upload
      canvas.height = 240;
      ctx.drawImage(videoElement, 0, 0, 320, 240);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.7);
      
      // Send to backend
      const response = await fetch('/api/vision/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          sessionId: sessionId,
          timestamp: Date.now(),
          options: config.features
        })
      });
      
      const result: VisionProcessingResponse = await response.json();
      
      if (result.success) {
        setMetrics(result.metrics);
      }
    } catch (error) {
      console.error('Backend vision processing failed:', error);
      // Graceful degradation - continue without vision
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, config, sessionId]);
  
  return {
    metrics,
    isProcessing,
    processFrame,
    // Simple, focused API
  };
};
```

### Phase 3: Smart Hybrid System

Combine backend reliability with frontend fallbacks:

```typescript
// Smart Vision Manager
export const useHybridVision = (config: VisionConfig) => {
  const [mode, setMode] = useState<'backend' | 'frontend' | 'off'>('backend');
  const backendVision = useBackendVision(config);
  const frontendVision = useLightweightFrontendVision(config); // Simplified version
  
  const currentVision = mode === 'backend' ? backendVision : frontendVision;
  
  useEffect(() => {
    // Health check backend availability
    const checkBackendHealth = async () => {
      try {
        const response = await fetch('/api/health/vision', { method: 'HEAD' });
        if (!response.ok) {
          setMode('frontend'); // Fallback to frontend
        }
      } catch {
        setMode('frontend');
      }
    };
    
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000); // Check every 30s
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    ...currentVision,
    mode,
    switchToBackend: () => setMode('backend'),
    switchToFrontend: () => setMode('frontend'),
    disable: () => setMode('off'),
  };
};
```

## Implementation Plan

### 1. Backend Service (Day 1-2)

**Option A: Python FastAPI (Recommended)**
```python
from fastapi import FastAPI, HTTPException
import cv2
import mediapipe as mp
import numpy as np
import base64
from io import BytesIO
from PIL import Image

app = FastAPI()

class VisionProcessor:
    def __init__(self):
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
    
    async def process_frame(self, image_data: str):
        # Decode base64 image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = np.array(Image.open(BytesIO(image_bytes)))
        
        # Process with MediaPipe
        results = self.face_mesh.process(image)
        
        metrics = {
            "confidence": 0.0,
            "faceDetected": False,
            "postureScore": 0.0,
            "movementLevel": 0.0,
        }
        
        if results.multi_face_landmarks:
            metrics["faceDetected"] = True
            metrics["confidence"] = 0.9  # MediaPipe doesn't provide confidence
            # Calculate metrics from landmarks
            landmarks = results.multi_face_landmarks[0]
            metrics.update(self.analyze_landmarks(landmarks))
        
        return metrics
    
    def analyze_landmarks(self, landmarks):
        # Your existing landmark analysis logic
        # This is more reliable on the server
        return {
            "postureScore": 0.85,  # Calculated from landmarks
            "movementLevel": 0.1,  # Calculated from movement
        }

@app.post("/api/vision/process")
async def process_vision(request: VisionProcessingRequest):
    try:
        processor = VisionProcessor()
        metrics = await processor.process_frame(request.imageData)
        
        return {
            "success": True,
            "metrics": metrics,
            "processingTime": 50  # Actual processing time
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
```

**Option B: Node.js with OpenCV.js**
```javascript
// If you prefer staying in Node.js ecosystem
const cv = require('opencv4nodejs');
const express = require('express');

const app = express();

class VisionProcessor {
  async processFrame(imageData) {
    // Decode base64 and process with OpenCV.js
    const buffer = Buffer.from(imageData.split(',')[1], 'base64');
    const mat = cv.imdecode(buffer);
    
    // Use OpenCV.js face detection (lighter than MediaPipe)
    const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);
    const faces = classifier.detectMultiScale(mat).objects;
    
    return {
      faceDetected: faces.length > 0,
      confidence: faces.length > 0 ? 0.8 : 0,
      // Additional metrics
    };
  }
}
```

### 2. Simplified Frontend (Day 2-3)

Replace your complex vision system with:

```typescript
// hooks/useSimpleVision.ts
export const useSimpleVision = () => {
  const [metrics, setMetrics] = useState<VisionMetrics | null>(null);
  const [isActive, setIsActive] = useState(false);
  const processingRef = useRef(false);
  
  const startProcessing = useCallback(async (videoElement: HTMLVideoElement) => {
    setIsActive(true);
    
    const processLoop = async () => {
      if (!isActive || processingRef.current) return;
      
      processingRef.current = true;
      try {
        // Simple frame capture
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = 320;
        canvas.height = 240;
        ctx.drawImage(videoElement, 0, 0, 320, 240);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.7);
        
        // Send to backend (with timeout)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/vision/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData, timestamp: Date.now() }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setMetrics(result.metrics);
          }
        }
        
      } catch (error) {
        console.warn('Vision processing failed, continuing gracefully:', error);
        // Don't break the session - just continue without vision metrics
      } finally {
        processingRef.current = false;
        
        // Schedule next frame (limit to 2 FPS to reduce server load)
        if (isActive) {
          setTimeout(() => processLoop(), 500);
        }
      }
    };
    
    processLoop();
  }, [isActive]);
  
  const stopProcessing = useCallback(() => {
    setIsActive(false);
    setMetrics(null);
  }, []);
  
  return {
    metrics,
    isActive,
    startProcessing,
    stopProcessing,
    // Clean, simple API
  };
};
```

### 3. Update Your Session Component (Day 3)

Simplify your UnifiedBreathingSession:

```typescript
// components/session/UnifiedBreathingSession.tsx
export const UnifiedBreathingSession = ({ pattern, mode, onSessionComplete }) => {
  const vision = useSimpleVision(); // Much simpler!
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Remove all the complex fallback logic - keep it simple
  useEffect(() => {
    if (cameraEnabled && videoRef.current && config.enableVision) {
      vision.startProcessing(videoRef.current);
    }
    
    return () => {
      vision.stopProcessing();
    };
  }, [cameraEnabled, config.enableVision]);
  
  // Rest of your component logic remains the same
  // Just use vision.metrics instead of the complex state
};
```

## Benefits of This Architecture

1. **Reliability**: Server-grade processing with stable dependencies
2. **Performance**: Offload heavy processing from client devices
3. **Scalability**: Can serve multiple clients efficiently
4. **Maintainability**: Simpler frontend code, easier to debug
5. **Flexibility**: Easy to add new vision features on the server
6. **Cost Effective**: Your Hetzner server can handle this easily

## Migration Strategy

1. **Week 1**: Deploy backend vision service
2. **Week 2**: Create simplified frontend client
3. **Week 3**: Integrate and test hybrid system
4. **Week 4**: Gradual rollout with fallbacks

This approach leverages your server infrastructure while keeping the frontend light and reliable. The backend can handle the heavy lifting with proper hardware acceleration and stable dependencies.
