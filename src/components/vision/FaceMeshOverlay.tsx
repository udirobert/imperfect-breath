/**
 * Face Mesh Overlay Component
 * Renders MediaPipe face landmarks over video feed
 */

import React, { useRef, useEffect, useState, useCallback } from "react";

// Define types locally since we removed the vision types file
interface MediaPipeLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

interface FaceMeshErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error boundary component for FaceMesh
class FaceMeshErrorBoundary extends React.Component<
  { children: React.ReactNode },
  FaceMeshErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): FaceMeshErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('FaceMesh error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-red-600 font-medium mb-2">FaceMesh Error</div>
            <div className="text-sm text-red-700 mb-3">
              {this.state.error?.message || "Face tracking unavailable"}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface FaceMeshOverlayProps {
  videoElement: HTMLVideoElement | null;
  landmarks: MediaPipeLandmark[] | null;
  isActive: boolean;
  confidence?: number; // Confidence score from vision system (0-1)
  breathPhase?: "inhale" | "exhale" | "hold" | "pause" | "transition";
  breathQuality?: number; // Overall session quality (0-100)
  postureScore?: number; // Posture quality (0-1)
  movementLevel?: number; // Movement/restlessness level (0-1)
  showDebugInfo?: boolean; // Show debug information
}

export const FaceMeshOverlay: React.FC<FaceMeshOverlayProps> = ({
  videoElement,
  landmarks,
  isActive,
  confidence = 0,
  breathPhase,
  breathQuality = 50,
  postureScore = 0.8,
  movementLevel = 0.1,
  showDebugInfo = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceCenter, setFaceCenter] = useState<{ x: number; y: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Error boundary for FaceMesh processing
  const [errorBoundary, setErrorBoundary] = useState<FaceMeshErrorBoundaryState>({
    hasError: false,
    error: null,
  });

  // Simplified and robust drawing function
  const drawFrame = useCallback(() => {
    if (!canvasRef.current || !videoElement || !isActive) {
      return;
    }

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError("Canvas context not available");
        return;
      }

      // Set canvas size to match video
      canvas.width = videoElement.videoWidth || videoElement.clientWidth || 640;
      canvas.height = videoElement.videoHeight || videoElement.clientHeight || 480;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Show immediate feedback even when processing
      setIsProcessing(confidence === 0 && isActive);

      // Basic camera frame indicator
      if (isActive) {
        ctx.strokeStyle = confidence > 0 ? "rgba(46, 204, 113, 0.5)" : "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        // Face detection area indicator
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const faceAreaSize = Math.min(canvas.width, canvas.height) * 0.4;

        // Simple face detection zone
        const pulseAlpha = confidence > 0 ? 0.6 : 0.3;
        ctx.strokeStyle = confidence > 0 ? `rgba(46, 204, 113, ${pulseAlpha})` : `rgba(255, 255, 255, ${pulseAlpha})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.strokeRect(
          centerX - faceAreaSize / 2,
          centerY - faceAreaSize / 2,
          faceAreaSize,
          faceAreaSize
        );
        ctx.setLineDash([]);

        // Text indicator
        if (confidence === 0) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          ctx.font = "14px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("Position face here", centerX, centerY + 5);
        }
      }

      // Simple landmark rendering with error handling
      if (landmarks && landmarks.length > 0 && confidence > 0) {
        try {
          const keypoints: MediaPipeLandmark[] =
            Array.isArray(landmarks) && (landmarks as any)[0]?.keypoints
              ? (landmarks as any)[0].keypoints
              : landmarks;

          if (keypoints && keypoints.length > 0) {
            // Calculate face center
            const avgX = keypoints.reduce((sum, point) => sum + point.x, 0) / keypoints.length;
            const avgY = keypoints.reduce((sum, point) => sum + point.y, 0) / keypoints.length;
            const actualCenterX = avgX * canvas.width;
            const actualCenterY = avgY * canvas.height;

            setFaceCenter({ x: actualCenterX, y: actualCenterY });

            // Draw landmarks with error handling
            ctx.fillStyle = "rgba(46, 204, 113, 0.8)";
            const landmarksToShow = Math.min(keypoints.length, 10); // Reduced for performance

            keypoints.slice(0, landmarksToShow).forEach((point, index) => {
              try {
                ctx.beginPath();
                const radius = index < 3 ? 3 : 2;
                ctx.arc(
                  point.x * canvas.width,
                  point.y * canvas.height,
                  radius,
                  0,
                  2 * Math.PI
                );
                ctx.fill();
              } catch (landmarkError) {
                // Skip problematic landmarks
                console.warn('Error drawing landmark:', landmarkError);
              }
            });

            // Simple breathing phase indicator
            if (breathPhase) {
              const baseRadius = 40;
              let breathingScale = 1;

              if (breathPhase === "inhale" || breathPhase === "exhale") {
                const time = Date.now() / 1000;
                breathingScale = 1 + Math.sin(time * 2) * 0.1;
              }

              ctx.strokeStyle = `rgba(46, 204, 113, ${confidence * 0.6})`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(actualCenterX, actualCenterY, baseRadius * breathingScale, 0, 2 * Math.PI);
              ctx.stroke();
            }
          }
        } catch (landmarksError) {
          console.warn('Error processing landmarks:', landmarksError);
          setError("Error processing face landmarks");
        }
      }

      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('FaceMesh drawing error:', error);
      setError("FaceMesh rendering failed");
    }
  }, [videoElement, landmarks, isActive, confidence, breathPhase]);

  // Simplified animation loop with proper cleanup
  useEffect(() => {
    if (!isActive) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      return;
    }

    const animate = () => {
      drawFrame();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [isActive, drawFrame]);

  // Error boundary fallback
  if (errorBoundary.hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-red-600 font-medium mb-2">FaceMesh Error</div>
          <div className="text-sm text-red-700 mb-3">
            {errorBoundary.error?.message || "Face tracking unavailable"}
          </div>
          <button
            onClick={() => setErrorBoundary({ hasError: false, error: null })}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <FaceMeshErrorBoundary>
      <div className="relative">
        {/* Canvas for minimal face presence indicator */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ mixBlendMode: "soft-light", opacity: 0.8 }}
        />

        {/* Error indicator */}
        {error && (
          <div className="absolute top-2 left-2 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 text-xs text-yellow-800">
            {error}
          </div>
        )}

        {/* Only show guidance when truly no face is detected */}
        {confidence === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-2xl text-sm font-light border border-white/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse"></div>
                <span>Gently position yourself in view</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </FaceMeshErrorBoundary>
  );
};
