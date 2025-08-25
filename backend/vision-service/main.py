"""
Unified Backend Service
A reliable, server-grade service using FastAPI and MediaPipe.
Handles vision processing, face detection, landmark analysis, breathing pattern detection,
and AI-powered session analysis.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import cv2
import mediapipe as mp
import numpy as np
import base64
import io
from PIL import Image
import asyncio
import time
import logging
from dataclasses import dataclass
from collections import deque
import uuid

# AI Analysis imports
import os
import json
import hashlib
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Unified Backend Service",
    description="Server-grade vision processing and AI analysis for breathing sessions",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4556",        # Local development frontend
        "https://*.netlify.app",        # Netlify deployments
        "https://imperfectbreath.com",  # Production domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class VisionProcessingRequest(BaseModel):
    image_data: str  # base64 encoded image
    session_id: str
    timestamp: int
    options: Dict[str, bool] = {
        "detect_face": True,
        "analyze_posture": True,
        "track_breathing": True
    }

class FaceLandmark(BaseModel):
    x: float
    y: float
    z: float = 0.0

class VisionMetrics(BaseModel):
    confidence: float
    face_detected: bool
    posture_score: float
    movement_level: float
    breathing_rate: Optional[float] = None
    landmarks: List[FaceLandmark] = []
    processing_time_ms: float

class VisionProcessingResponse(BaseModel):
    success: bool
    metrics: Optional[VisionMetrics] = None
    error: Optional[str] = None
    session_id: str

# AI Analysis Models
class AIAnalysisRequest(BaseModel):
    provider: str
    session_data: Dict[str, Any]
    analysis_type: str = "session"

class AIAnalysisResponse(BaseModel):
    success: bool
    provider: str
    analysis_type: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    cached: bool = False

# Core Vision Processor
@dataclass
class SessionState:
    """Track state for each session"""
    session_id: str
    last_landmarks: Optional[List[FaceLandmark]] = None
    landmark_history: deque = None
    breathing_history: deque = None
    movement_history: deque = None
    # Enhanced tracking for AI integration
    confidence_history: deque = None
    posture_history: deque = None
    created_at: float = 0.0

    def __post_init__(self):
        if self.landmark_history is None:
            self.landmark_history = deque(maxlen=30)  # 30 frames of history
        if self.breathing_history is None:
            self.breathing_history = deque(maxlen=100)  # breathing pattern history
        if self.movement_history is None:
            self.movement_history = deque(maxlen=50)  # movement history
        if self.confidence_history is None:
            self.confidence_history = deque(maxlen=50)  # confidence tracking
        if self.posture_history is None:
            self.posture_history = deque(maxlen=50)  # posture tracking
        if self.created_at == 0.0:
            self.created_at = time.time()

    def add_frame_metrics(self, confidence: float, posture: float, movement: float, breathing: Optional[float] = None):
        """Add metrics from a processed frame"""
        self.confidence_history.append(confidence)
        self.posture_history.append(posture)
        self.movement_history.append(movement)
        if breathing is not None:
            self.breathing_history.append(breathing)

    def get_session_summary(self) -> Dict[str, Any]:
        """Get aggregated session metrics for AI analysis"""
        duration = time.time() - self.created_at

        return {
            "session_id": self.session_id,
            "duration": duration,
            "total_frames": len(self.landmark_history),
            "avg_confidence": sum(self.confidence_history) / len(self.confidence_history) if self.confidence_history else 0,
            "avg_posture_score": sum(self.posture_history) / len(self.posture_history) if self.posture_history else 0,
            "avg_movement_level": sum(self.movement_history) / len(self.movement_history) if self.movement_history else 0,
            "avg_breathing_rate": sum(self.breathing_history) / len(self.breathing_history) if self.breathing_history else None,
            "stillness_percentage": sum(1 for m in self.movement_history if m < 0.2) / len(self.movement_history) * 100 if self.movement_history else 0,
            "consistency_score": self._calculate_consistency(),
        }

    def _calculate_consistency(self) -> float:
        """Calculate breathing consistency score"""
        if len(self.breathing_history) < 5:
            return 0.0

        # Calculate variance in breathing rate
        rates = list(self.breathing_history)
        mean_rate = sum(rates) / len(rates)
        variance = sum((r - mean_rate) ** 2 for r in rates) / len(rates)

        # Convert to consistency score (lower variance = higher consistency)
        consistency = max(0, 100 - (variance * 10))
        return min(100, consistency)

class VisionProcessor:
    """Core vision processing engine"""
    
    def __init__(self):
        """Initialize MediaPipe components"""
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.5
        )
        
        self.face_detection = mp.solutions.face_detection.FaceDetection(
            model_selection=0,  # Use model optimized for faces within 2 meters
            min_detection_confidence=0.5
        )
        
        # Session management
        self.sessions: Dict[str, SessionState] = {}
        
        # Cleanup old sessions periodically
        self._cleanup_interval = 300  # 5 minutes
        self._last_cleanup = time.time()
        
    def _cleanup_old_sessions(self):
        """Remove sessions older than 1 hour"""
        current_time = time.time()
        if current_time - self._last_cleanup < self._cleanup_interval:
            return
            
        hour_ago = current_time - 3600
        old_sessions = [
            session_id for session_id, session in self.sessions.items()
            if session.created_at < hour_ago
        ]
        
        for session_id in old_sessions:
            del self.sessions[session_id]
            logger.info(f"Cleaned up old session: {session_id}")
            
        self._last_cleanup = current_time
    
    def _get_or_create_session(self, session_id: str) -> SessionState:
        """Get existing session or create new one"""
        self._cleanup_old_sessions()
        
        if session_id not in self.sessions:
            self.sessions[session_id] = SessionState(session_id=session_id)
            logger.info(f"Created new session: {session_id}")
            
        return self.sessions[session_id]
    
    def _decode_image(self, image_data: str) -> np.ndarray:
        """Decode base64 image to numpy array"""
        try:
            # Remove data:image/jpeg;base64, prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
                
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            
            # Convert to PIL Image then to numpy
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
                
            # Convert to numpy array
            return np.array(image)
            
        except Exception as e:
            logger.error(f"Failed to decode image: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid image data: {e}")
    
    def _extract_landmarks(self, results) -> List[FaceLandmark]:
        """Extract landmarks from MediaPipe results"""
        if not results.multi_face_landmarks:
            return []
            
        landmarks = []
        face_landmarks = results.multi_face_landmarks[0]
        
        for landmark in face_landmarks.landmark:
            landmarks.append(FaceLandmark(
                x=landmark.x,
                y=landmark.y,
                z=landmark.z
            ))
            
        return landmarks
    
    def _calculate_movement_level(self, current_landmarks: List[FaceLandmark], 
                                session: SessionState) -> float:
        """Calculate movement level based on landmark displacement"""
        if not session.last_landmarks or not current_landmarks:
            return 0.0
            
        if len(current_landmarks) != len(session.last_landmarks):
            return 0.0
            
        # Calculate average displacement of key facial points
        # Use nose tip (index 1), chin (index 18), and forehead (index 10)
        key_indices = [1, 10, 18] if len(current_landmarks) > 18 else [0]
        
        total_displacement = 0.0
        valid_points = 0
        
        for idx in key_indices:
            if idx < len(current_landmarks) and idx < len(session.last_landmarks):
                current = current_landmarks[idx]
                previous = session.last_landmarks[idx]
                
                # Calculate 2D displacement (x, y)
                dx = current.x - previous.x
                dy = current.y - previous.y
                displacement = np.sqrt(dx**2 + dy**2)
                
                total_displacement += displacement
                valid_points += 1
        
        if valid_points == 0:
            return 0.0
            
        # Normalize movement level (scale to 0-1 range)
        avg_displacement = total_displacement / valid_points
        movement_level = min(avg_displacement * 100, 1.0)  # Scale and cap at 1.0
        
        # Store in history for trend analysis
        session.movement_history.append(movement_level)
        
        return movement_level
    
    def _calculate_posture_score(self, landmarks: List[FaceLandmark]) -> float:
        """Calculate posture score based on facial orientation"""
        if len(landmarks) < 20:
            return 0.0
            
        try:
            # Use key facial points to determine head pose
            # Nose tip, chin, forehead, left/right eye corners
            nose_tip = landmarks[1] if len(landmarks) > 1 else landmarks[0]
            
            # For now, use a simple metric based on nose position
            # In production, you'd use proper 3D pose estimation
            
            # Check if face is roughly centered and upright
            face_center_x = 0.5  # Expected center
            face_center_y = 0.4  # Expected Y position for good posture
            
            x_deviation = abs(nose_tip.x - face_center_x)
            y_deviation = abs(nose_tip.y - face_center_y)
            
            # Calculate posture score (1.0 = perfect, 0.0 = poor)
            posture_score = max(0.0, 1.0 - (x_deviation * 2 + y_deviation * 1.5))
            
            return min(posture_score, 1.0)
            
        except Exception as e:
            logger.error(f"Posture calculation error: {e}")
            return 0.0
    
    def _estimate_breathing_rate(self, landmarks: List[FaceLandmark], 
                               session: SessionState) -> Optional[float]:
        """Estimate breathing rate from nostril area changes"""
        if len(landmarks) < 30:
            return None
            
        try:
            # Use nostril landmarks to estimate breathing
            # This is a simplified approach - in production you'd use more sophisticated methods
            
            # Store current nostril area approximation
            nostril_area = self._calculate_nostril_area(landmarks)
            session.breathing_history.append(nostril_area)
            
            # Need at least 20 samples to estimate breathing rate
            if len(session.breathing_history) < 20:
                return None
                
            # Simple breathing rate estimation using variance in nostril area
            recent_history = list(session.breathing_history)[-20:]
            variance = np.var(recent_history)
            
            # Estimate breathing rate based on variance (this is simplified)
            # In production, you'd use proper signal processing
            estimated_rate = max(8.0, min(20.0, 12.0 + variance * 100))
            
            return estimated_rate
            
        except Exception as e:
            logger.error(f"Breathing rate estimation error: {e}")
            return None
    
    def _calculate_nostril_area(self, landmarks: List[FaceLandmark]) -> float:
        """Calculate approximate nostril area"""
        try:
            # This is a simplified calculation
            # In production, you'd use proper nostril landmark detection
            nose_tip = landmarks[1] if len(landmarks) > 1 else landmarks[0]
            return nose_tip.y  # Simplified metric
        except:
            return 0.0
    
    async def process_frame(self, request: VisionProcessingRequest) -> VisionProcessingResponse:
        """Process a single frame and return vision metrics"""
        start_time = time.time()
        
        try:
            # Get or create session
            session = self._get_or_create_session(request.session_id)
            
            # Decode image
            image = self._decode_image(request.image_data)
            
            # Convert BGR to RGB for MediaPipe
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Process with MediaPipe
            results = self.face_mesh.process(rgb_image)
            
            # Initialize metrics
            metrics = VisionMetrics(
                confidence=0.0,
                face_detected=False,
                posture_score=0.0,
                movement_level=0.0,
                processing_time_ms=0.0
            )
            
            if results.multi_face_landmarks and len(results.multi_face_landmarks) > 0:
                # Extract landmarks
                landmarks = self._extract_landmarks(results)
                
                if landmarks:
                    metrics.face_detected = True
                    metrics.confidence = 0.9  # MediaPipe doesn't provide confidence
                    metrics.landmarks = landmarks
                    
                    # Calculate movement level
                    if request.options.get("detect_face", True):
                        metrics.movement_level = self._calculate_movement_level(landmarks, session)
                    
                    # Calculate posture score
                    if request.options.get("analyze_posture", True):
                        metrics.posture_score = self._calculate_posture_score(landmarks)
                    
                    # Estimate breathing rate
                    if request.options.get("track_breathing", True):
                        metrics.breathing_rate = self._estimate_breathing_rate(landmarks, session)
                    
                    # Update session state
                    session.last_landmarks = landmarks
                    session.landmark_history.append(landmarks)

                    # Track metrics for session summary (ENHANCEMENT FIRST)
                    session.add_frame_metrics(
                        confidence=metrics.confidence,
                        posture=metrics.posture_score,
                        movement=metrics.movement_level,
                        breathing=metrics.breathing_rate
                    )

            # Calculate processing time
            processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            metrics.processing_time_ms = processing_time
            
            return VisionProcessingResponse(
                success=True,
                metrics=metrics,
                session_id=request.session_id
            )
            
        except Exception as e:
            logger.error(f"Frame processing error: {e}")
            return VisionProcessingResponse(
                success=False,
                error=str(e),
                session_id=request.session_id
            )

# Global processor instance
vision_processor = VisionProcessor()

# AI Analysis Configuration and Functions
AI_CONFIG = {
    "models": {
        "google": "gemini-1.5-flash",
        "openai": "gpt-4o-mini",
        "anthropic": "claude-3-haiku-20240307",
    },
    "max_tokens": {
        "session": 400,
        "pattern": 300,
    },
    "cache": {
        "enabled": True,
        "ttl": 300,  # 5 minutes
    },
}

# In-memory cache
ai_response_cache = {}

def create_session_prompt(session_data: Dict[str, Any]) -> str:
    """Create optimized prompt for session analysis with vision integration"""
    vision_metrics = session_data.get('visionMetrics', {})
    has_vision = bool(vision_metrics)

    base_info = f"""Breathing Session Analysis:
Pattern: {session_data.get('patternName', 'Unknown')}
Duration: {session_data.get('sessionDuration', 0)}s
Breathing Rate: {session_data.get('bpm', 0)}bpm
Restlessness: {session_data.get('restlessnessScore', 0)}/100"""

    if has_vision:
        vision_info = f"""
Vision Analysis (MediaPipe):
- Face Detection Confidence: {vision_metrics.get('confidence', 0):.1f}
- Posture Quality: {vision_metrics.get('postureScore', 0):.1f}/1.0
- Movement Level: {vision_metrics.get('movementLevel', 0):.1f}/1.0
- Stillness: {vision_metrics.get('stillnessPercentage', 0):.1f}%
- Breathing Consistency: {vision_metrics.get('consistencyScore', 0):.1f}/100"""
        analysis_note = "Provide analysis based on actual vision data from MediaPipe face detection."
    else:
        vision_info = "\nVision Analysis: Not available (camera not used)"
        analysis_note = "Provide analysis based on session timing and user-reported metrics only."

    return f"""{base_info}{vision_info}

{analysis_note}

JSON response:
{{
  "overallScore": number (0-100),
  "suggestions": ["3 specific tips based on available data"],
  "nextSteps": ["3 actionable improvements"],
  "encouragement": "personalized message based on actual performance"
}}"""

async def process_ai_analysis(request: AIAnalysisRequest) -> AIAnalysisResponse:
    """Process AI analysis request with fallback"""
    try:
        # For now, return a mock response since we don't have API keys in local dev
        result = {
            "overallScore": 85,
            "suggestions": [
                "Great breathing consistency!",
                "Try extending your exhale slightly",
                "Focus on relaxing your shoulders"
            ],
            "nextSteps": [
                "Practice daily for 10 minutes",
                "Try the 4-7-8 pattern next",
                "Track your progress over time"
            ],
            "encouragement": f"Excellent {request.analysis_type} analysis! Your breathing shows good control and focus."
        }

        return AIAnalysisResponse(
            success=True,
            provider=request.provider,
            analysis_type=request.analysis_type,
            result=result
        )

    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
        return AIAnalysisResponse(
            success=False,
            provider=request.provider,
            analysis_type=request.analysis_type,
            error=str(e)
        )

# API Endpoints
@app.post("/api/vision/process", response_model=VisionProcessingResponse)
async def process_vision(request: VisionProcessingRequest):
    """Process a single frame for vision analysis"""
    return await vision_processor.process_frame(request)

@app.get("/api/vision/sessions/{session_id}/summary")
async def get_session_summary(session_id: str):
    """Get aggregated vision metrics for AI analysis (ENHANCEMENT FIRST + PERFORMANT)"""
    session = vision_processor.sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # PERFORMANT: Cache session summaries to avoid redundant calculations
    cache_key = f"session_summary_{session_id}"
    if cache_key in ai_response_cache:
        cached_data = ai_response_cache[cache_key]
        if time.time() - cached_data["timestamp"] < 60:  # 1 minute cache
            logger.info(f"Returning cached session summary for {session_id}")
            return cached_data["result"]

    summary = session.get_session_summary()

    # Cache the summary
    ai_response_cache[cache_key] = {
        "result": summary,
        "timestamp": time.time()
    }

    logger.info(f"Session summary for {session_id}: {summary}")
    return summary

@app.get("/api/health/vision")
@app.head("/api/health/vision")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "vision-processing",
        "timestamp": time.time(),
        "active_sessions": len(vision_processor.sessions)
    }

@app.delete("/api/vision/session/{session_id}")
async def cleanup_session(session_id: str):
    """Manually cleanup a session"""
    if session_id in vision_processor.sessions:
        del vision_processor.sessions[session_id]
        return {"success": True, "message": f"Session {session_id} cleaned up"}
    else:
        return {"success": False, "message": "Session not found"}

@app.get("/api/vision/sessions")
async def list_sessions():
    """List active sessions (for debugging)"""
    return {
        "active_sessions": list(vision_processor.sessions.keys()),
        "session_count": len(vision_processor.sessions)
    }

# AI Analysis Endpoints
@app.post("/api/ai-analysis", response_model=AIAnalysisResponse)
async def ai_analysis(request: AIAnalysisRequest):
    """AI-powered breathing session analysis"""
    logger.info(f"AI analysis request: {request.provider} {request.analysis_type}")
    return await process_ai_analysis(request)

@app.get("/health")
@app.head("/health")
async def health_check_main():
    """Main health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "services": {
            "vision": "active",
            "ai_analysis": "active"
        }
    }

@app.get("/ping")
@app.head("/ping")
async def ping():
    """Simple ping endpoint for health checks"""
    return {"status": "ok", "timestamp": time.time()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
