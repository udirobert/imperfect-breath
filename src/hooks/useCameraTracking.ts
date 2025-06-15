
import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';

export type TrackingStatus = 'INITIALIZING' | 'TRACKING' | 'NO_FACE' | 'IDLE';

type UseCameraTrackingProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  isTracking: boolean;
};

// Re-defining Keypoint as we're removing the dependency that provided it.
export type Keypoint = {
  x: number;
  y: number;
  z?: number;
  name?: string;
};

interface Point2D {
  x: number;
  y: number;
}

const euclidianDistance = (p1: Point2D, p2: Point2D) => {
  if (!p1 || !p2) return 0;
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export const useCameraTracking = ({ videoRef, isTracking }: UseCameraTrackingProps) => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [restlessnessScore, setRestlessnessScore] =useState(0);
  const [landmarks, setLandmarks] = useState<Keypoint[]>([]);
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>('IDLE');

  const requestRef = useRef<number>();
  const lastPosition = useRef<Point2D | null>(null);
  const accumulatedJitter = useRef(0);
  const detectionCount = useRef(0);

  useEffect(() => {
    const loadModels = async () => {
      // NOTE: The models should be placed in the public/models directory.
      // You can get them from https://github.com/justadudewhohacks/face-api.js/tree/master/weights
      const MODEL_URL = '/models';
      setTrackingStatus('INITIALIZING');
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        console.log('Face detection models loaded via face-api.js.');
      } catch (error) {
        console.error('Error loading face-api.js models:', error);
      }
    };
    loadModels();
  }, []);

  const calculateRestlessness = useCallback((detection: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection; }> | undefined) => {
    if (!detection) {
      setTrackingStatus('NO_FACE');
      lastPosition.current = null;
      setLandmarks([]);
      return;
    }
    setTrackingStatus('TRACKING');

    const newLandmarks = detection.landmarks.positions.map(p => ({ x: p.x, y: p.y }));
    setLandmarks(newLandmarks);

    // Use nose landmarks for a stable center point (indices 27-35 for 68-point model)
    const noseLandmarks = newLandmarks.slice(27, 36);
    if (noseLandmarks.length === 0) return;

    const currentCenter: Point2D = noseLandmarks.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 }
    );
    currentCenter.x /= noseLandmarks.length;
    currentCenter.y /= noseLandmarks.length;
    
    if (lastPosition.current) {
      const jitter = euclidianDistance(currentCenter, lastPosition.current);
      accumulatedJitter.current += jitter;
      detectionCount.current += 1;
    }
    lastPosition.current = currentCenter;
    
    if (detectionCount.current > 0) {
      const averageJitter = accumulatedJitter.current / detectionCount.current;
      const score = Math.min(100, averageJitter * 100);
      setRestlessnessScore(score);
    }
  }, []);

  const detectionLoop = useCallback(async () => {
    if (videoRef.current && videoRef.current.readyState >= 3) {
      try {
        const detection = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })
        ).withFaceLandmarks();
        
        calculateRestlessness(detection);
      } catch (error) {
        // skip frame
      }
    }
    if (isTracking) {
      requestRef.current = window.setTimeout(detectionLoop, 100);
    }
  }, [videoRef, isTracking, calculateRestlessness]);

  useEffect(() => {
    if (isTracking && modelsLoaded) {
      // Reset stats for the new tracking session
      lastPosition.current = null;
      accumulatedJitter.current = 0;
      detectionCount.current = 0;
      setRestlessnessScore(0);
      setLandmarks([]);
      
      // Start detection loop
      setTrackingStatus('INITIALIZING');
      detectionLoop();
    } else {
      if (requestRef.current) {
        clearTimeout(requestRef.current);
      }
      if (!isTracking) {
        setTrackingStatus('IDLE');
        setLandmarks([]);
      }
    }

    return () => {
      if (requestRef.current) {
        clearTimeout(requestRef.current);
      }
    };
  }, [isTracking, modelsLoaded, detectionLoop]);


  return { restlessnessScore, landmarks, trackingStatus };
};
