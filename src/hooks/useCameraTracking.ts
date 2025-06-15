
import { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { Face, Keypoint, FaceLandmarksDetector } from '@tensorflow-models/face-landmarks-detection';

type UseCameraTrackingProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  isTracking: boolean;
};

const euclidianDistance = (p1: Keypoint, p2: Keypoint) => {
  if (!p1 || !p2) return 0;
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export const useCameraTracking = ({ videoRef, isTracking }: UseCameraTrackingProps) => {
  const [detector, setDetector] = useState<FaceLandmarksDetector | null>(null);
  const [smoothedScore, setSmoothedScore] = useState(0);

  const requestRef = useRef<number>();
  const lastPosition = useRef<Keypoint | null>(null);
  const scoreHistory = useRef<number[]>([]);

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.setBackend('webgl');
        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig = {
          runtime: 'tfjs',
          maxFaces: 1,
          refineLandmarks: true,
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
      return 0;
    }
    const landmarks = faces[0].keypoints;
    const noseTip = landmarks.find(p => p.name === 'noseTip');

    if (!noseTip) return 0;

    let jitter = 0;
    if (lastPosition.current) {
      jitter = euclidianDistance(noseTip, lastPosition.current);
    }
    lastPosition.current = noseTip;
    
    // Normalize jitter to a 0-100 scale. A movement of 5px is considered high.
    const rawScore = Math.min(100, (jitter / 5) * 100);
    return rawScore;
  }, []);

  const detectionLoop = useCallback(async () => {
    if (detector && videoRef.current && videoRef.current.readyState >= 3) {
      try {
        const faces = await detector.estimateFaces(videoRef.current, {
          flipHorizontal: false,
        });

        const score = calculateRestlessness(faces);

        scoreHistory.current.push(score);
        if (scoreHistory.current.length > 15) { // Smoothing over ~0.25s
          scoreHistory.current.shift();
        }
        const avgScore = scoreHistory.current.reduce((a, b) => a + b, 0) / scoreHistory.current.length;
        setSmoothedScore(avgScore);

      } catch (error) {
        // This can happen if the video stream is not ready, we'll just skip the frame.
      }
    }
    if (isTracking) {
      requestRef.current = requestAnimationFrame(detectionLoop);
    }
  }, [detector, videoRef, isTracking, calculateRestlessness]);

  useEffect(() => {
    if (isTracking && detector) {
      lastPosition.current = null;
      scoreHistory.current = [];
      setSmoothedScore(0);
      requestRef.current = requestAnimationFrame(detectionLoop);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isTracking, detector, detectionLoop]);

  return { restlessnessScore: smoothedScore };
};

