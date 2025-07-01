import { useState, useEffect, useRef, useCallback } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl"; // Import WebGL backend

export type TrackingStatus =
  | "INITIALIZING"
  | "REQUESTING_CAMERA"
  | "LOADING_MODELS"
  | "TRACKING"
  | "NO_PERSON"
  | "IDLE"
  | "ERROR";

type UseCameraTrackingProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  isTracking: boolean;
};

interface Point2D {
  x: number;
  y: number;
}

interface PoseData {
  timestamp: number;
  noseY: number; // Y-coordinate of the nose for head movement
  leftShoulderY: number; // Y-coordinate of left shoulder
  rightShoulderY: number; // Y-coordinate of right shoulder
}

const SMOOTHING_FACTOR = 0.2; // For smoothing BPM and restlessness
const BPM_WINDOW_SIZE = 10; // Number of data points for BPM calculation

export const useCameraTracking = ({
  videoRef,
  isTracking,
}: UseCameraTrackingProps) => {
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>("IDLE");
  const [restlessnessScore, setRestlessnessScore] = useState(0);
  const [bpm, setBpm] = useState(0);
  const [landmarks, setLandmarks] = useState<Point2D[]>([]); // For visualization

  const requestRef = useRef<number>();
  const poseDataHistory = useRef<PoseData[]>([]);
  const lastPoseTime = useRef<number>(0);
  const noPersonCount = useRef(0);

  // 1. Load Models
  const loadModels = useCallback(async () => {
    setTrackingStatus("LOADING_MODELS");
    try {
      await tf.setBackend("webgl");
      await tf.ready();

      const detectorConfig: poseDetection.MediaPipePoseMediaPipeEstimationConfig = {
        runtime: "mediapipe",
        solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675466868`, // Use a specific version
        modelType: "full",
      };
      const poseDetector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MediaPipePose,
        detectorConfig
      );
      setDetector(poseDetector);
      setTrackingStatus("IDLE"); // Ready to track
    } catch (error) {
      console.error("Failed to load pose detection models:", error);
      setTrackingStatus("ERROR");
    }
  }, []);

  // 2. Initialize Camera
  const initializeCamera = useCallback(async () => {
    if (!videoRef.current) {
      throw new Error("Video element not available");
    }

    if (videoRef.current.srcObject) {
      return; // Camera already initialized
    }

    setTrackingStatus("REQUESTING_CAMERA");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play().catch(console.error);
          setTrackingStatus("INITIALIZING"); // Camera ready, waiting for models
        };
      }
    } catch (error) {
      console.error("Camera access error:", error);
      setTrackingStatus("ERROR");
    }
  }, [videoRef]);

  // 3. Pose Detection Loop
  const detectPose = useCallback(async () => {
    if (!detector || !videoRef.current || !isTracking) {
      requestRef.current = requestAnimationFrame(detectPose);
      return;
    }

    const video = videoRef.current;
    if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      requestRef.current = requestAnimationFrame(detectPose);
      return;
    }

    const now = performance.now();
    if (now - lastPoseTime.current < 100) { // Limit detection to ~10 FPS
      requestRef.current = requestAnimationFrame(detectPose);
      return;
    }
    lastPoseTime.current = now;

    try {
      const poses = await detector.estimatePoses(video);

      if (poses && poses.length > 0) {
        noPersonCount.current = 0;
        setTrackingStatus("TRACKING");

        const mainPose = poses[0]; // Assuming one main person
        const keypoints = mainPose.keypoints.map(kp => ({ x: kp.x, y: kp.y }));
        setLandmarks(keypoints);

        const nose = mainPose.keypoints.find(kp => kp.name === 'nose');
        const leftShoulder = mainPose.keypoints.find(kp => kp.name === 'left_shoulder');
        const rightShoulder = mainPose.keypoints.find(kp => kp.name === 'right_shoulder');

        if (nose && leftShoulder && rightShoulder) {
          const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
          poseDataHistory.current.push({
            timestamp: now,
            noseY: nose.y,
            leftShoulderY: leftShoulder.y,
            rightShoulderY: rightShoulder.y,
          });

          // Keep history windowed
          if (poseDataHistory.current.length > 60) { // ~6 seconds of data at 10 FPS
            poseDataHistory.current = poseDataHistory.current.slice(-60);
          }

          // Calculate Restlessness (head movement)
          if (poseDataHistory.current.length > 1) {
            const recentNoseYs = poseDataHistory.current.slice(-30).map(data => data.noseY);
            const maxNoseY = Math.max(...recentNoseYs);
            const minNoseY = Math.min(...recentNoseYs);
            const currentRestlessness = (maxNoseY - minNoseY) * 0.5; // Scale as needed
            setRestlessnessScore(prev => prev * (1 - SMOOTHING_FACTOR) + currentRestlessness * SMOOTHING_FACTOR);
          }

          // Calculate BPM (shoulder movement)
          if (poseDataHistory.current.length >= BPM_WINDOW_SIZE) {
            const shoulderYs = poseDataHistory.current.map(data => (data.leftShoulderY + data.rightShoulderY) / 2);
            let breathCycles = 0;
            for (let i = 1; i < shoulderYs.length - 1; i++) {
              // Detect peaks (inhalation) and troughs (exhalation)
              if (shoulderYs[i] < shoulderYs[i - 1] && shoulderYs[i] < shoulderYs[i + 1]) { // Trough
                breathCycles += 0.5;
              } else if (shoulderYs[i] > shoulderYs[i - 1] && shoulderYs[i] > shoulderYs[i + 1]) { // Peak
                breathCycles += 0.5;
              }
            }
            const timeWindowSeconds = (poseDataHistory.current[poseDataHistory.current.length - 1].timestamp - poseDataHistory.current[0].timestamp) / 1000;
            if (timeWindowSeconds > 0) {
              const currentBPM = (breathCycles / timeWindowSeconds) * 60;
              setBpm(prev => prev * (1 - SMOOTHING_FACTOR) + currentBPM * SMOOTHING_FACTOR);
            }
          }
        }
      } else {
        noPersonCount.current++;
        if (noPersonCount.current > 30) { // If no person for ~3 seconds
          setTrackingStatus("NO_PERSON");
          setLandmarks([]);
          setRestlessnessScore(0);
          setBpm(0);
          poseDataHistory.current = [];
        }
      }
    } catch (error) {
      console.error("Pose estimation error:", error);
      setTrackingStatus("ERROR");
    }

    requestRef.current = requestAnimationFrame(detectPose);
  }, [detector, videoRef, isTracking]);

  // Initial model load
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Start/Stop detection loop based on isTracking and detector readiness
  useEffect(() => {
    if (isTracking && detector && videoRef.current?.srcObject) {
      requestRef.current = requestAnimationFrame(detectPose);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = undefined;
      if (!isTracking) {
        setTrackingStatus("IDLE");
      }
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isTracking, detector, videoRef, detectPose]);

  // Cleanup camera stream on unmount
  const cleanup = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setTrackingStatus("IDLE");
    setLandmarks([]);
    setRestlessnessScore(0);
    setBpm(0);
    poseDataHistory.current = [];
    noPersonCount.current = 0;
  }, [videoRef]);

  return {
    restlessnessScore,
    bpm,
    landmarks,
    trackingStatus,
    isModelsLoaded: detector !== null,
    initializeCamera,
    cleanup,
  };
};