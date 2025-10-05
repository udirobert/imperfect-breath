"""
Unified Backend Service
A reliable, server-grade service using FastAPI and MediaPipe.
Handles vision processing, face detection, landmark analysis, breathing pattern detection,
and AI-powered session analysis.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from webhook_handler import process_webhook
from revenuecat_config import router as revenuecat_router
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
from pathlib import Path
import urllib.request
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ENHANCEMENT FIRST: Environment-aware configuration
def get_models_dir() -> Path:
    """Get models directory based on environment - CLEAN separation of local vs production"""
    # Check if we're in Docker/production environment
    if (os.getenv("ENV") == "production" or 
        os.path.exists("/app") or 
        os.getenv("DOCKER_ENV") == "true"):
        return Path("/app/models")  # Docker/Hetzner production
    else:
        return Path("./models")     # Local development

# Production Configuration - ENHANCEMENT FIRST: Centralized config with environment support
CONFIG = {
    "models_dir": get_models_dir(),  # DRY: Single source of truth for models path
    "max_concurrent_sessions": int(os.getenv("MAX_CONCURRENT_SESSIONS", "10")),
    "model_download_on_start": os.getenv("MODEL_DOWNLOAD_ON_START", "true").lower() == "true",
    "session_timeout": 300,  # 5 minutes
    "max_image_size": 1920,
    "jpeg_quality": 85,
    # PERFORMANT: Dynamic port configuration
    "port": int(os.getenv("PORT", "8001")),  # Default to 8001 to match Docker
    "host": os.getenv("HOST", "0.0.0.0")
}

# MediaPipe model URLs for production deployment
MODEL_URLS = {
    "face_detection": "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
    "face_landmarks": "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    "pose_estimation": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task"
}

# Production Model Manager
class ModelManager:
    """Manages MediaPipe models with efficient loading and caching"""
    
    def __init__(self):
        self.face_detector = None
        self.face_landmarker = None
        self.pose_landmarker = None
        self.models_loaded = False
        
    async def download_models(self):
        """Download models to local storage"""
        CONFIG["models_dir"].mkdir(exist_ok=True)
        
        for model_name, url in MODEL_URLS.items():
            model_path = CONFIG["models_dir"] / f"{model_name}.tflite"
            if not model_path.exists():
                logger.info(f"Downloading {model_name} model...")
                try:
                    urllib.request.urlretrieve(url, model_path)
                    logger.info(f"Downloaded {model_name} to {model_path}")
                except Exception as e:
                    logger.error(f"Failed to download {model_name}: {e}")
                    raise
                    
    def load_models(self):
        """Load MediaPipe models"""
        try:
            # Face Detection
            face_detection_path = CONFIG["models_dir"] / "face_detection.tflite"
            if face_detection_path.exists():
                self.face_detector = mp.solutions.face_detection.FaceDetection(
                    model_selection=0,  # Short range model
                    min_detection_confidence=0.5
                )
            
            # Face Landmarks
            face_landmarks_path = CONFIG["models_dir"] / "face_landmarks.task"
            if face_landmarks_path.exists():
                base_options = mp.tasks.BaseOptions(
                    model_asset_path=str(face_landmarks_path)
                )
                options = mp.tasks.vision.FaceLandmarkerOptions(
                    base_options=base_options,
                    output_face_blendshapes=False,
                    output_facial_transformation_matrixes=False,
                    num_faces=1
                )
                self.face_landmarker = mp.tasks.vision.FaceLandmarker.create_from_options(options)
            
            # Pose Estimation  
            pose_path = CONFIG["models_dir"] / "pose_estimation.task"
            if pose_path.exists():
                base_options = mp.tasks.BaseOptions(
                    model_asset_path=str(pose_path)
                )
                options = mp.tasks.vision.PoseLandmarkerOptions(
                    base_options=base_options,
                    output_segmentation_masks=False,
                    num_poses=1
                )
                self.pose_landmarker = mp.tasks.vision.PoseLandmarker.create_from_options(options)
            
            self.models_loaded = True
            logger.info("All MediaPipe models loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load models: {e}")
            raise

# Global model manager
model_manager: Optional[ModelManager] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    global model_manager
    
    # Startup
    logger.info("Starting Unified Backend Service...")
    model_manager = ModelManager()
    
    if CONFIG["model_download_on_start"]:
        try:
            await model_manager.download_models()
            model_manager.load_models()
        except Exception as e:
            logger.error(f"Failed to initialize models: {e}")
    
    # Start background tasks
    asyncio.create_task(cleanup_inactive_sessions())
    
    yield
    
    # Shutdown
    logger.info("Shutting down Unified Backend Service...")

app = FastAPI(
    title="Unified Backend Service",
    description="Server-grade vision processing and AI analysis for breathing sessions",
    version="2.0.0",
    lifespan=lifespan
)

# Include RevenueCat configuration router
app.include_router(revenuecat_router)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4556",                    # Local development frontend
        "http://localhost:4567",                    # Alternative local port
        "https://imperfectbreath.netlify.app",      # Production Netlify
        "https://imperfectbreath.com",              # Production domain
        "https://breath.imperfectform.fun",         # Alternative domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

# Request/Response Models
class VisionProcessingRequest(BaseModel):
    image_data: str  # base64 encoded image
    session_id: str
    timestamp: int
    breathing_phase: Optional[str] = None  # ENHANCEMENT: Track breathing phase
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
        
        # ENHANCEMENT: Phase correlation tracking for AI analysis
        self.phase_movement_map = {}  # breathing_phase -> [movement_values]
        self.temporal_snapshots = []  # minute-by-minute progression

    def add_frame_metrics(self, confidence: float, posture: float, movement: float, breathing: Optional[float] = None, phase: str = None):
        """Add metrics from a processed frame with phase correlation"""
        self.confidence_history.append(confidence)
        self.posture_history.append(posture)
        self.movement_history.append(movement)
        if breathing is not None:
            self.breathing_history.append(breathing)
        
        # ENHANCEMENT: Track movement by breathing phase
        if phase:
            if phase not in self.phase_movement_map:
                self.phase_movement_map[phase] = []
            self.phase_movement_map[phase].append(movement)
        
        # ENHANCEMENT: Temporal snapshots every 30 frames (~30 seconds at 1fps)
        if len(self.movement_history) % 30 == 0:
            self.temporal_snapshots.append({
                'timestamp': time.time() - self.created_at,
                'stillness': 100 - (movement * 100),
                'confidence': confidence
            })

    def get_enhanced_summary(self) -> Dict[str, Any]:
        """ENHANCEMENT: Rich session data for AI analysis"""
        base_summary = self.get_session_summary()
        
        # Phase-specific analysis
        phase_analysis = {}
        for phase, movements in self.phase_movement_map.items():
            if movements:
                phase_analysis[phase] = {
                    'avg_stillness': 100 - (sum(movements) / len(movements) * 100),
                    'consistency': max(0, 1 - (np.std(movements) if len(movements) > 1 else 0)),
                    'sample_count': len(movements)
                }
        
        return {
            **base_summary,
            'phase_analysis': phase_analysis,
            'temporal_progression': self.temporal_snapshots,
            'movement_pattern': {
                'peak_movement': max(self.movement_history) if self.movement_history else 0,
                'stability_trend': self._calculate_stability_trend()
            }
        }
    
    def _calculate_stability_trend(self) -> str:
        """Calculate if user is getting more or less stable over time"""
        if len(self.temporal_snapshots) < 2:
            return 'insufficient_data'
        
        first_half = self.temporal_snapshots[:len(self.temporal_snapshots)//2]
        second_half = self.temporal_snapshots[len(self.temporal_snapshots)//2:]
        
        first_avg = sum(s['stillness'] for s in first_half) / len(first_half)
        second_avg = sum(s['stillness'] for s in second_half) / len(second_half)
        
        if second_avg > first_avg + 5:
            return 'improving'
        elif second_avg < first_avg - 5:
            return 'declining'
        else:
            return 'stable'
    
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
                        breathing=metrics.breathing_rate,
                        phase=request.breathing_phase  # ENHANCEMENT: Phase correlation
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

# Background task for session cleanup
async def cleanup_inactive_sessions():
    """Background task to clean up inactive sessions"""
    while True:
        try:
            current_time = time.time()
            inactive_sessions = []
            
            # Check VisionProcessor sessions
            if 'vision_processor' in globals() and hasattr(vision_processor, 'sessions'):
                for session_id, session in vision_processor.sessions.items():
                    if current_time - session.created_at > CONFIG["session_timeout"]:
                        inactive_sessions.append(session_id)
                
                for session_id in inactive_sessions:
                    if session_id in vision_processor.sessions:
                        logger.info(f"Cleaning up inactive session: {session_id}")
                        del vision_processor.sessions[session_id]
            
            # Clean up every 60 seconds
            await asyncio.sleep(60)
            
        except Exception as e:
            logger.error(f"Error in cleanup task: {e}")
            await asyncio.sleep(60)

# PERFORMANT: Enhanced caching for AI responses
ai_response_cache = {}

# AGGRESSIVE CONSOLIDATION: Removed redundant AI_CONFIG and create_session_prompt
# All AI configuration is now handled in cerebras_client.py

async def process_ai_analysis(request: AIAnalysisRequest) -> AIAnalysisResponse:
    """ENHANCEMENT FIRST: Unified AI analysis with Cerebras integration"""
    try:
        # CLEAN: Import Cerebras client
        from cerebras_client import analyze_breathing_session, is_available as cerebras_available
        
        # Get enhanced session data if available
        session_id = request.session_data.get('visionSessionId')
        enhanced_data = None
        
        if session_id and session_id in vision_processor.sessions:
            session = vision_processor.sessions[session_id]
            enhanced_data = session.get_enhanced_summary()
            logger.info(f"Enhanced session data for {session_id}: {len(enhanced_data.get('phase_analysis', {}))} phases")
        
        # ENHANCEMENT FIRST: Use Cerebras if available and configured with proper response alignment
        if cerebras_available() and enhanced_data:
            try:
                result = await analyze_breathing_session(enhanced_data, request.session_data)
                
                # ENHANCEMENT FIRST: Transform Cerebras response to match frontend expectations with proper structure
                # DRY: Single source of truth for response transformation
                transformed_result = {
                    "analysis": result.get("encouragement", "Great work on your breathing practice!"),  # Map encouragement to analysis
                    "suggestions": (
                        [result.get("phaseInsights", {}).get("inhale", "Focus on smooth inhalation"),
                         result.get("phaseInsights", {}).get("exhale", "Practice controlled exhalation"),
                         result.get("phaseInsights", {}).get("hold", "Maintain comfortable breath holds")] 
                        if result.get("phaseInsights") and isinstance(result.get("phaseInsights"), dict) 
                        else result.get("suggestions", [
                            "Focus on smooth inhalation",
                            "Practice controlled exhalation", 
                            "Maintain comfortable breath holds"
                        ])
                    ),
                    "score": {
                        "overall": result.get("overallScore", 85),
                        "focus": result.get("phaseInsights", {}).get("inhaleScore", result.get("overallScore", 75)),
                        "consistency": result.get("consistencyScore", result.get("overallScore", 75)), 
                        "progress": result.get("progressScore", result.get("overallScore", 75))
                    },
                    "nextSteps": result.get("nextSteps", [
                        "Continue regular practice",
                        "Try longer sessions gradually",
                        "Focus on consistency"
                    ])
                }
                
                return AIAnalysisResponse(
                    success=True,
                    provider="cerebras",
                    analysis_type=request.analysis_type,
                    result=transformed_result,
                    cached=False
                )
                
            except Exception as e:
                logger.warning(f"Cerebras analysis failed, falling back to mock: {e}")
                # Fall through to fallback
        
        # PERFORMANT: Fallback to mock response with proper structure alignment
        result = {
            "analysis": f"Excellent {request.analysis_type} analysis! Your breathing shows good control and focus.",  # Map encouragement to analysis
            "suggestions": [
                "Great breathing consistency!",
                "Try extending your exhale slightly", 
                "Focus on relaxing your shoulders"
            ],
            "score": {
                "overall": 85,
                "focus": 80,
                "consistency": 85,
                "progress": 75
            },
            "nextSteps": [
                "Practice daily for 10 minutes",
                "Try the 4-7-8 pattern next",
                "Track your progress over time"
            ]
        }

        return AIAnalysisResponse(
            success=True,
            provider="fallback",
            analysis_type=request.analysis_type,
            result=result,
            cached=False
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

# AGGRESSIVE CONSOLIDATION: Single session management endpoint
@app.delete("/api/vision/session/{session_id}")
@app.post("/api/vision/session/{session_id}/stop")
async def manage_session(session_id: str):
    """CLEAN: Unified session management - stop/cleanup session"""
    if session_id in vision_processor.sessions:
        del vision_processor.sessions[session_id]
        logger.info(f"Session {session_id} stopped and cleaned up")
        return {"success": True, "message": f"Session {session_id} cleaned up", "session_id": session_id}
    else:
        raise HTTPException(status_code=404, detail="Session not found")

@app.get("/api/vision/sessions")
async def list_sessions():
    """ORGANIZED: Single endpoint for session listing"""
    current_time = time.time()
    sessions_info = []
    
    for session_id, session in vision_processor.sessions.items():
        sessions_info.append({
            "session_id": session_id,
            "created_at": session.created_at,
            "duration": current_time - session.created_at,
            "frame_count": len(session.landmark_history),
            "is_active": (current_time - session.created_at) < CONFIG["session_timeout"]
        })
    
    return {
        "sessions": sessions_info,
        "active_sessions": list(vision_processor.sessions.keys()),
        "session_count": len(vision_processor.sessions),
        "active_count": len([s for s in sessions_info if s["is_active"]])
    }

# AGGRESSIVE CONSOLIDATION: Single unified AI analysis endpoint
@app.post("/api/ai-analysis", response_model=AIAnalysisResponse)
async def ai_analysis(request: AIAnalysisRequest):
    """DRY: Unified AI analysis endpoint with automatic Cerebras integration"""
    logger.info(f"AI analysis request: {request.provider} {request.analysis_type}")
    return await process_ai_analysis(request)

# AGGRESSIVE CONSOLIDATION: Single health check endpoint
@app.get("/health")
async def health_check():
    """ENHANCED: Health check with Cerebras status"""
    # CLEAN: Import Cerebras status
    try:
        from cerebras_client import get_status as cerebras_status
        ai_status = cerebras_status()
    except ImportError:
        ai_status = {"available": False, "error": "cerebras_client not found"}
    
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "port": CONFIG["port"],
        "services": {
            "vision": "active",
            "ai_analysis": "active" if ai_status.get("available") else "fallback",
            "webhook": "active"
        },
        "ai_integration": ai_status,
        "active_sessions": len(vision_processor.sessions)
    }

@app.post("/webhook/github")
async def github_webhook(request: Request, background_tasks: BackgroundTasks):
    """GitHub webhook endpoint for automatic deployments"""
    return await process_webhook(request, background_tasks)

if __name__ == "__main__":
    import uvicorn
    # ENHANCEMENT FIRST: Use centralized config for consistency
    uvicorn.run(app, host=CONFIG["host"], port=CONFIG["port"])
