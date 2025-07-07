import { useRef, useState, useCallback, useEffect } from "react";
import { TrackingStatus, Keypoint } from "./visionTypes";

// Props interface for the hook
export interface UseVisionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isTracking: boolean;
}

// Return type interface for the hook
export interface UseVisionReturn {
  landmarks: Keypoint[];
  restlessnessScore: number;
  trackingStatus: TrackingStatus;
  initializeCamera: () => Promise<boolean>;
  cleanup: () => void;
}

/**
 * Hook for vision-based tracking and analysis
 */
export const useVision = (props: UseVisionProps): UseVisionReturn => {
  const { videoRef, isTracking } = props;
  const [landmarks, setLandmarks] = useState<Keypoint[]>([]);
  const [restlessnessScore, setRestlessnessScore] = useState(0);
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>("IDLE");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const initializeCamera = useCallback(async () => {
    try {
      setTrackingStatus("INITIALIZING");

      // Request camera permissions and get stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      // Attach to video element if available
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Simulate initialization delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setTrackingStatus("TRACKING");
      return true;
    } catch (error) {
      console.error("Failed to initialize camera:", error);
      setTrackingStatus("ERROR");
      return false;
    }
  }, [videoRef]);

  const cleanup = useCallback(() => {
    // Stop tracking
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setTrackingStatus("IDLE");
  }, [videoRef]);

  // Start/stop tracking based on isTracking prop
  useEffect(() => {
    if (isTracking && trackingStatus === "TRACKING" && !intervalRef.current) {
      // Start tracking with simulated data
      intervalRef.current = setInterval(() => {
        // Simulate some movement and randomness in restlessness score
        const newScore = Math.max(
          0,
          Math.min(100, restlessnessScore + (Math.random() * 10 - 5))
        );
        setRestlessnessScore(newScore);

        // Simulate face landmarks (simplified)
        const newLandmarks: Keypoint[] = [
          {
            x: 0.5 + (Math.random() * 0.02 - 0.01),
            y: 0.4 + (Math.random() * 0.02 - 0.01),
            name: "nose",
          },
          {
            x: 0.4 + (Math.random() * 0.02 - 0.01),
            y: 0.4 + (Math.random() * 0.02 - 0.01),
            name: "leftEye",
          },
          {
            x: 0.6 + (Math.random() * 0.02 - 0.01),
            y: 0.4 + (Math.random() * 0.02 - 0.01),
            name: "rightEye",
          },
        ];
        setLandmarks(newLandmarks);
      }, 200);
    } else if (!isTracking && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isTracking, trackingStatus, restlessnessScore]);

  return {
    landmarks,
    restlessnessScore,
    trackingStatus,
    initializeCamera,
    cleanup,
  };
};
