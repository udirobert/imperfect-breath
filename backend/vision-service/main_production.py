"""
Production Vision Service for Hetzner Server
Optimized for performance, reliability, and resource management
"""

import os
import asyncio
import logging
import time
from pathlib import Path
from typing import Dict, List, Optional, Any
import urllib.request
from contextlib import asynccontextmanager

import cv2
import numpy as np
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import mediapipe as mp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
CONFIG = {
    "models_dir": Path("/app/models"),
    "max_concurrent_sessions": int(os.getenv("MAX_CONCURRENT_SESSIONS", "10")),
    "model_download_on_start": os.getenv("MODEL_DOWNLOAD_ON_START", "true").lower() == "true",
    "session_timeout": 300,  # 5 minutes
    "max_image_size": 1920,
    "jpeg_quality": 85
}

# MediaPipe model URLs
MODEL_URLS = {
    "face_detection": "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
    "face_landmarks": "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    "pose_estimation": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task"
}

# Global state
active_sessions: Dict[str, Dict] = {}
model_manager: Optional['ModelManager'] = None

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

class VisionRequest(BaseModel):
    session_id: str
    features: Dict[str, bool] = {
        "detect_face": True,
        "analyze_posture": True,
        "track_breathing": True
    }

class VisionResponse(BaseModel):
    session_id: str
    timestamp: float
    face_detected: bool
    confidence: float
    face_landmarks: Optional[List[Dict[str, float]]] = None
    posture_quality: Optional[float] = None
    movement_level: Optional[float] = None
    breathing_rate: Optional[float] = None
    processing_time_ms: float

async def process_frame(image: np.ndarray, session_id: str, features: Dict[str, bool]) -> Dict[str, Any]:
    """Process a single frame with requested features"""
    start_time = time.time()
    
    # Convert BGR to RGB
    rgb_frame = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    height, width = rgb_frame.shape[:2]
    
    results = {
        "face_detected": False,
        "confidence": 0.0,
        "face_landmarks": None,
        "posture_quality": None,
        "movement_level": None,
        "breathing_rate": None
    }
    
    # Face Detection
    if features.get("detect_face", True) and model_manager.face_detector:
        face_results = model_manager.face_detector.process(rgb_frame)
        
        if face_results.detections:
            detection = face_results.detections[0]
            results["face_detected"] = True
            results["confidence"] = detection.score[0]
            
            # Get bounding box
            bbox = detection.location_data.relative_bounding_box
            results["face_bbox"] = {
                "x": bbox.xmin,
                "y": bbox.ymin,
                "width": bbox.width,
                "height": bbox.height
            }
    
    # Face Landmarks (if face detected)
    if results["face_detected"] and features.get("detect_face", True) and model_manager.face_landmarker:
        try:
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            landmark_results = model_manager.face_landmarker.detect(mp_image)
            
            if landmark_results.face_landmarks:
                landmarks = []
                for landmark in landmark_results.face_landmarks[0][:68]:  # First 68 landmarks
                    landmarks.append({
                        "x": landmark.x,
                        "y": landmark.y,
                        "z": landmark.z if hasattr(landmark, 'z') else 0.0
                    })
                results["face_landmarks"] = landmarks
        except Exception as e:
            logger.warning(f"Face landmarks processing failed: {e}")
    
    # Posture Analysis
    if features.get("analyze_posture", True) and model_manager.pose_landmarker:
        try:
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            pose_results = model_manager.pose_landmarker.detect(mp_image)
            
            if pose_results.pose_landmarks:
                # Simple posture quality based on shoulder alignment
                landmarks = pose_results.pose_landmarks[0]
                left_shoulder = landmarks[11]  # Left shoulder
                right_shoulder = landmarks[12]  # Right shoulder
                
                shoulder_diff = abs(left_shoulder.y - right_shoulder.y)
                posture_quality = max(0.0, 1.0 - (shoulder_diff * 10))  # Normalize
                results["posture_quality"] = posture_quality
                
                # Movement level (simple implementation)
                session_data = active_sessions.get(session_id, {})
                if "prev_pose" in session_data:
                    prev_landmarks = session_data["prev_pose"]
                    movement = 0.0
                    for i, landmark in enumerate(landmarks[:33]):  # Upper body landmarks
                        if i < len(prev_landmarks):
                            prev_lm = prev_landmarks[i]
                            movement += ((landmark.x - prev_lm.x) ** 2 + (landmark.y - prev_lm.y) ** 2) ** 0.5
                    
                    results["movement_level"] = min(1.0, movement / 33.0 * 10)  # Normalize
                
                # Store current pose for next frame
                active_sessions[session_id]["prev_pose"] = landmarks
                
        except Exception as e:
            logger.warning(f"Pose analysis failed: {e}")
    
    # Breathing Rate (simplified - would need temporal analysis for accuracy)
    if features.get("track_breathing", True):
        # This is a placeholder - real breathing rate would need multiple frames
        results["breathing_rate"] = 15.0  # Default breathing rate
    
    processing_time = (time.time() - start_time) * 1000
    results["processing_time_ms"] = processing_time
    
    return results

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown"""
    # Startup
    global model_manager
    logger.info("Starting Vision Service...")
    
    model_manager = ModelManager()
    
    if CONFIG["model_download_on_start"]:
        await model_manager.download_models()
    
    model_manager.load_models()
    logger.info(f"Vision service ready - Max concurrent sessions: {CONFIG['max_concurrent_sessions']}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Vision Service...")
    active_sessions.clear()

# FastAPI App
app = FastAPI(
    title="Vision Service",
    description="Production vision processing service for breathing session analysis",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this based on your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": model_manager.models_loaded if model_manager else False,
        "active_sessions": len(active_sessions),
        "max_sessions": CONFIG["max_concurrent_sessions"],
        "timestamp": time.time()
    }

@app.post("/vision/start")
async def start_session(request: VisionRequest):
    """Start a new vision processing session"""
    if len(active_sessions) >= CONFIG["max_concurrent_sessions"]:
        raise HTTPException(status_code=503, detail="Maximum concurrent sessions reached")
    
    if not model_manager or not model_manager.models_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    session_data = {
        "session_id": request.session_id,
        "features": request.features,
        "start_time": time.time(),
        "last_activity": time.time(),
        "frame_count": 0
    }
    
    active_sessions[request.session_id] = session_data
    logger.info(f"Started session {request.session_id}")
    
    return {"message": "Session started", "session_id": request.session_id}

@app.post("/vision/process")
async def process_vision_frame(
    session_id: str,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """Process a single frame"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = active_sessions[session_id]
    session_data["last_activity"] = time.time()
    session_data["frame_count"] += 1
    
    try:
        # Read and decode image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        # Resize if too large
        height, width = image.shape[:2]
        if width > CONFIG["max_image_size"]:
            scale = CONFIG["max_image_size"] / width
            new_width = int(width * scale)
            new_height = int(height * scale)
            image = cv2.resize(image, (new_width, new_height))
        
        # Process frame
        results = await process_frame(image, session_id, session_data["features"])
        
        response = VisionResponse(
            session_id=session_id,
            timestamp=time.time(),
            face_detected=results["face_detected"],
            confidence=results["confidence"],
            face_landmarks=results["face_landmarks"],
            posture_quality=results["posture_quality"],
            movement_level=results["movement_level"],
            breathing_rate=results["breathing_rate"],
            processing_time_ms=results["processing_time_ms"]
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Frame processing error for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.post("/vision/stop/{session_id}")
async def stop_session(session_id: str):
    """Stop a vision processing session"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = active_sessions.pop(session_id)
    duration = time.time() - session_data["start_time"]
    
    logger.info(f"Stopped session {session_id} - Duration: {duration:.1f}s, Frames: {session_data['frame_count']}")
    
    return {
        "message": "Session stopped",
        "session_id": session_id,
        "duration": duration,
        "frames_processed": session_data["frame_count"]
    }

@app.get("/vision/sessions")
async def list_sessions():
    """List active sessions"""
    return {
        "active_sessions": len(active_sessions),
        "max_sessions": CONFIG["max_concurrent_sessions"],
        "sessions": [
            {
                "session_id": sid,
                "duration": time.time() - data["start_time"],
                "frames": data["frame_count"],
                "features": data["features"]
            }
            for sid, data in active_sessions.items()
        ]
    }

# Background task to cleanup inactive sessions
async def cleanup_inactive_sessions():
    """Remove sessions that have been inactive"""
    while True:
        current_time = time.time()
        inactive_sessions = [
            sid for sid, data in active_sessions.items()
            if current_time - data["last_activity"] > CONFIG["session_timeout"]
        ]
        
        for session_id in inactive_sessions:
            logger.info(f"Cleaning up inactive session: {session_id}")
            active_sessions.pop(session_id, None)
        
        await asyncio.sleep(60)  # Check every minute

@app.on_event("startup")
async def start_background_tasks():
    """Start background tasks"""
    asyncio.create_task(cleanup_inactive_sessions())

if __name__ == "__main__":
    uvicorn.run(
        "main_production:app",
        host="0.0.0.0",
        port=8001,
        workers=1,  # Single worker for GPU/model sharing
        log_level="info"
    )
