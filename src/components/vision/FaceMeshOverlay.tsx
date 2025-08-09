/**
 * Face Mesh Overlay Component
 * Renders MediaPipe face landmarks over video feed
 */

import React, { useRef, useEffect } from "react";

import type { MediaPipeLandmark } from '../../lib/vision/types';

interface FaceMeshOverlayProps {
  videoElement: HTMLVideoElement | null;
  landmarks: MediaPipeLandmark[] | null;
  isActive: boolean;
  confidence?: number; // Add confidence to properly detect face presence
  breathPhase?: 'inhale' | 'exhale' | 'hold' | 'transition'; // Add breathing phase for visualization
  breathQuality?: number; // Add breath quality for color feedback (0-100)
}

export const FaceMeshOverlay: React.FC<FaceMeshOverlayProps> = ({
  videoElement,
  landmarks,
  isActive,
  confidence = 0,
  breathPhase,
  breathQuality = 50,
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
      canvas.width = videoElement.videoWidth || videoElement.clientWidth || 640;
      canvas.height = videoElement.videoHeight || videoElement.clientHeight || 480;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Enhanced face presence indicator with breathing phase visualization
      if (landmarks && landmarks.length > 0 && confidence > 0) {
        // Handle both formats: array of keypoints or direct landmarks array
        const keypoints: MediaPipeLandmark[] =
          Array.isArray(landmarks) && (landmarks as any)[0]?.keypoints
            ? (landmarks as any)[0].keypoints
            : landmarks;

        if (keypoints && keypoints.length > 0) {
          // Calculate face center from landmarks
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          
          // Determine color based on breath quality (0-100)
          let glowColor: string;
          if (breathQuality >= 80) {
            // Green for good quality
            glowColor = `rgba(46, 204, 113, ${0.1 + (breathQuality / 100) * 0.2})`;
          } else if (breathQuality >= 60) {
            // Yellow for moderate quality
            glowColor = `rgba(241, 196, 15, ${0.1 + (breathQuality / 100) * 0.2})`;
          } else {
            // Red for poor quality
            glowColor = `rgba(231, 76, 60, ${0.1 + (breathQuality / 100) * 0.2})`;
          }

          // Adjust glow size based on breathing phase
          let baseRadius = 80;
          let breathingScale = 1;
          
          if (breathPhase === 'inhale') {
            // Expand during inhale
            const time = Date.now() / 1000;
            breathingScale = 1 + Math.sin(time * 2) * 0.15;
          } else if (breathPhase === 'exhale') {
            // Contract during exhale
            const time = Date.now() / 1000;
            breathingScale = 1 - Math.sin(time * 2) * 0.15;
          }

          // Create dynamic glow based on breathing phase and quality
          const gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            0,
            centerX,
            centerY,
            baseRadius * breathingScale
          );
          gradient.addColorStop(0, glowColor);
          gradient.addColorStop(0.7, glowColor.replace(/[^,]+(?=\))/, '0.05'));
          gradient.addColorStop(1, glowColor.replace(/[^,]+(?=\))/, '0'));

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, baseRadius * breathingScale, 0, 2 * Math.PI);
          ctx.fill();

          // Draw confidence indicator
          if (confidence > 0) {
            const confidenceSize = 4 + (confidence * 4);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + confidence * 0.4})`;
            ctx.beginPath();
            ctx.arc(centerX, centerY, confidenceSize, 0, 2 * Math.PI);
            ctx.fill();
          }
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
  }, [videoElement, landmarks, isActive, confidence, breathPhase, breathQuality]);

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
