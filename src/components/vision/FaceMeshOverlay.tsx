/**
 * Face Mesh Overlay Component
 * Renders MediaPipe face landmarks over video feed
 */

import React, { useRef, useEffect, useState } from "react";

// Define types locally since we removed the vision types file
interface MediaPipeLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceCenter, setFaceCenter] = useState<{ x: number; y: number } | null>(
    null
  );

  useEffect(() => {
    if (!canvasRef.current || !videoElement || !isActive) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Animation frame for smooth rendering
    let animationFrameId: number;

    const drawFrame = () => {
      if (!canvas || !ctx || !videoElement) return;

      // Set canvas size to match video
      canvas.width = videoElement.videoWidth || videoElement.clientWidth || 640;
      canvas.height =
        videoElement.videoHeight || videoElement.clientHeight || 480;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Show immediate feedback even when processing
      setIsProcessing(confidence === 0 && isActive);

      // IMMEDIATE VISIBLE FEEDBACK - Always show something when camera is active
      if (isActive) {
        // Show camera frame border to indicate camera is working
        ctx.strokeStyle =
          confidence > 0
            ? "rgba(46, 204, 113, 0.5)"
            : "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 3; // Thicker border for better visibility
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        // Face detection area indicator
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const faceAreaSize = Math.min(canvas.width, canvas.height) * 0.4;

        // Draw face detection zone with pulsing effect
        const pulseAlpha =
          confidence > 0 ? 0.6 : 0.3 + Math.sin(Date.now() / 500) * 0.2;
        ctx.strokeStyle =
          confidence > 0
            ? `rgba(46, 204, 113, ${pulseAlpha})`
            : `rgba(255, 255, 255, ${pulseAlpha})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]); // Longer dashes for better visibility
        ctx.strokeRect(
          centerX - faceAreaSize / 2,
          centerY - faceAreaSize / 2,
          faceAreaSize,
          faceAreaSize
        );
        ctx.setLineDash([]); // Reset line dash

        // Add text indicator in center
        if (confidence === 0) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          ctx.font = "14px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("Position face here", centerX, centerY + 5);
        }
      }

      // Enhanced face tracking with visible landmarks
      if (landmarks && landmarks.length > 0 && confidence > 0) {
        // Silent operation for meditation

        const keypoints: MediaPipeLandmark[] =
          Array.isArray(landmarks) && (landmarks as any)[0]?.keypoints
            ? (landmarks as any)[0].keypoints
            : landmarks;

        if (keypoints && keypoints.length > 0) {
          // Calculate actual face center from landmarks
          const avgX =
            keypoints.reduce((sum, point) => sum + point.x, 0) /
            keypoints.length;
          const avgY =
            keypoints.reduce((sum, point) => sum + point.y, 0) /
            keypoints.length;
          const actualCenterX = avgX * canvas.width;
          const actualCenterY = avgY * canvas.height;

          setFaceCenter({ x: actualCenterX, y: actualCenterY });

          // Draw key facial landmarks for immediate feedback
          ctx.fillStyle = "rgba(46, 204, 113, 0.8)"; // More visible green

          // Draw more landmarks for better visibility (first 20 points)
          const landmarksToShow = Math.min(keypoints.length, 20);
          keypoints.slice(0, landmarksToShow).forEach((point, index) => {
            ctx.beginPath();
            const radius = index < 5 ? 4 : 3; // Larger dots for key points
            ctx.arc(
              point.x * canvas.width,
              point.y * canvas.height,
              radius,
              0,
              2 * Math.PI
            );
            ctx.fill();

            // Add a subtle glow effect
            ctx.shadowColor = "rgba(46, 204, 113, 0.5)";
            ctx.shadowBlur = 3;
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow
          });

          // Determine color based on overall session quality
          let glowColor: string;
          const overallQuality =
            (breathQuality + postureScore * 100 + (1 - movementLevel) * 100) /
            3;

          if (overallQuality >= 80) {
            glowColor = `rgba(46, 204, 113, ${
              0.1 + (overallQuality / 100) * 0.2
            })`;
          } else if (overallQuality >= 60) {
            glowColor = `rgba(241, 196, 15, ${
              0.1 + (overallQuality / 100) * 0.2
            })`;
          } else {
            glowColor = `rgba(231, 76, 60, ${
              0.1 + (overallQuality / 100) * 0.2
            })`;
          }

          // Breathing phase animation
          let baseRadius = 60;
          let breathingScale = 1;

          if (breathPhase === "inhale") {
            const time = Date.now() / 1000;
            breathingScale = 1 + Math.sin(time * 3) * 0.2; // More pronounced for visibility
          } else if (breathPhase === "exhale") {
            const time = Date.now() / 1000;
            breathingScale = 1 - Math.sin(time * 3) * 0.15;
          }

          // Create dynamic glow around actual face position
          const gradient = ctx.createRadialGradient(
            actualCenterX,
            actualCenterY,
            0,
            actualCenterX,
            actualCenterY,
            baseRadius * breathingScale
          );
          gradient.addColorStop(0, glowColor);
          gradient.addColorStop(0.7, glowColor.replace(/[^,]+(?=\))/, "0.05"));
          gradient.addColorStop(1, glowColor.replace(/[^,]+(?=\))/, "0"));

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(
            actualCenterX,
            actualCenterY,
            baseRadius * breathingScale,
            0,
            2 * Math.PI
          );
          ctx.fill();

          // Confidence and quality indicators
          if (confidence > 0.5) {
            // Draw face outline for high confidence
            ctx.strokeStyle = `rgba(46, 204, 113, ${confidence * 0.8})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(actualCenterX, actualCenterY, 40, 0, 2 * Math.PI);
            ctx.stroke();
          }

          // Movement level indicator
          if (movementLevel > 0.3) {
            ctx.fillStyle = `rgba(231, 76, 60, ${movementLevel * 0.5})`;
            ctx.beginPath();
            ctx.arc(actualCenterX, actualCenterY - 60, 5, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      }

      // Continue animation loop
      animationFrameId = requestAnimationFrame(drawFrame);
    };

    // Start animation loop immediately
    animationFrameId = requestAnimationFrame(drawFrame);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    videoElement,
    landmarks,
    isActive,
    confidence,
    breathPhase,
    breathQuality,
    postureScore,
    movementLevel,
  ]);

  if (!isActive) return null;

  return (
    <>
      {/* Canvas for minimal face presence indicator */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: "soft-light", opacity: 0.8 }}
      />

      {/* Only show guidance when truly no face is detected - use confidence instead of landmarks */}
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
    </>
  );
};
