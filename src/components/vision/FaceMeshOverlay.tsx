/**
 * Face Mesh Overlay Component
 * Renders MediaPipe face landmarks over video feed
 */

import React, { useRef, useEffect } from "react";

interface FaceMeshOverlayProps {
  videoElement: HTMLVideoElement | null;
  landmarks: any[] | null;
  isActive: boolean;
  confidence?: number; // Add confidence to properly detect face presence
}

export const FaceMeshOverlay: React.FC<FaceMeshOverlayProps> = ({
  videoElement,
  landmarks,
  isActive,
  confidence = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Minimal, calming face presence indicator
      if (landmarks && landmarks.length > 0) {
        // Handle both formats: array of keypoints or direct landmarks array
        const keypoints =
          Array.isArray(landmarks) && landmarks[0]?.keypoints
            ? landmarks[0].keypoints
            : landmarks;

        if (keypoints && keypoints.length > 0) {
          // Create a gentle, breathing-like glow around the face center
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;

          // Subtle breathing animation
          const time = Date.now() / 1000;
          const breathingScale = 1 + Math.sin(time * 0.5) * 0.1; // Slow, gentle pulse

          // Soft gradient circle to indicate face presence
          const gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            0,
            centerX,
            centerY,
            80 * breathingScale
          );
          gradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
          gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.05)");
          gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 80 * breathingScale, 0, 2 * Math.PI);
          ctx.fill();

          // Optional: Very subtle center dot for focus
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
          ctx.beginPath();
          ctx.arc(centerX, centerY, 2, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // Continue animation loop
      animationFrameId = requestAnimationFrame(drawFrame);
    };

    // Start animation loop
    animationFrameId = requestAnimationFrame(drawFrame);

    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [videoElement, landmarks, isActive]);

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
