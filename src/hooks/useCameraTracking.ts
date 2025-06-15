
import { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { Face, Keypoint, FaceLandmarksDetector } from '@tensorflow-models/face-landmarks-detection';

type UseCameraTrackingProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  isTracking: boolean;
};

// Define a simple 2D point for our calculations, making the logic cleaner.
interface Point2D {
  x: number;
  y: number;
}

const euclidianDistance = (p1: Point2D, p2: Point2D) => {
  if (!p1 || !p2) return 0;
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export const useCameraTracking = ({ videoRef, isTracking }: UseCameraTrackingProps) => {
  const [detector, setDetector] = useState<FaceLandmarksDetector | null>(null);
  const [restlessnessScore, setRestlessnessScore] = useState(0);
  const [landmarks, setLandmarks] = useState<Keypoint[]>([]);

  const requestRef = useRef<number>();
  const lastPosition = useRef<Point2D | null>(null);
  const accumulatedJitter = useRef(0);
  const detectionCount = useRef(0);

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.setBackend('webgl');
        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig = {
          runtime: 'tfjs',
          maxFaces: 1,
          refineLandmarks: false, // Performance: disabled landmark refinement
        };
        const loadedDetector = await faceLandmarksDetection.createDetector(model, detectorConfig);
        setDetector(loadedDetector);
        console.log('Face detection model loaded.');
      } catch (error) {
        console.error('Error loading face detection model:', error);
      }
    };
    loadModel();
  }, []);

  const calculateRestlessness = useCallback((faces: Face[]) => {
    if (faces.length === 0) {
      lastPosition.current = null;
      return;
    }
    const newLandmarks = faces[0].keypoints;
    setLandmarks(newLandmarks || []);

    // Use a composite central point for more robust tracking
    const noseTip = newLandmarks.find(p => p.name === 'noseTip');
    const leftEye = newLandmarks.find(p => p.name === 'leftEye');
    const rightEye = newLandmarks.find(p => p.name === 'rightEye');
    
    if (!noseTip || !leftEye || !rightEye) return;

    const currentCenter: Point2D = {
      x: (noseTip.x + leftEye.x + rightEye.x) / 3,
      y: (noseTip.y + leftEye.y + rightEye.y) / 3,
    };

    // The first frame with a face sets the baseline position. Subsequent frames measure jitter.
    if (lastPosition.current) {
      const jitter = euclidianDistance(currentCenter, lastPosition.current);
      accumulatedJitter.current += jitter;
      detectionCount.current += 1;
    }
    lastPosition.current = currentCenter;
    
    if (detectionCount.current > 0) {
      // The score is based on the average pixel movement per frame during the session.
      const averageJitter = accumulatedJitter.current / detectionCount.current;
      
      // Normalize the score. An average movement of 1px per frame is considered high restlessness (100).
      // This makes the score sensitive to small, persistent movements.
      const score = Math.min(100, averageJitter * 100);
      setRestlessnessScore(score);
    }
  }, []);

  const detectionLoop = useCallback(async () => {
    if (detector && videoRef.current && videoRef.current.readyState >= 3) {
      try {
        const faces = await detector.estimateFaces(videoRef.current, {
          flipHorizontal: false,
        });
        calculateRestlessness(faces);
      } catch (error) {
        // This can happen if the video stream is not ready, we'll just skip the frame.
      }
    }
    if (isTracking) {
      // Performance: Throttle the loop to run at ~10 FPS
      requestRef.current = window.setTimeout(detectionLoop, 100);
    }
  }, [detector, videoRef, isTracking, calculateRestlessness]);

  useEffect(() => {
    if (isTracking && detector) {
      // Reset stats for the new tracking session
      lastPosition.current = null;
      accumulatedJitter.current = 0;
      detectionCount.current = 0;
      setRestlessnessScore(0);
      setLandmarks([]);
      detectionLoop(); // Start the loop
    } else {
      if (requestRef.current) {
        clearTimeout(requestRef.current);
      }
    }

    return () => {
      if (requestRef.current) {
        clearTimeout(requestRef.current);
      }
    };
  }, [isTracking, detector, detectionLoop]);

  return { restlessnessScore, landmarks };
};
