/**
 * Face Mesh Overlay Component
 * Renders MediaPipe face landmarks over video feed
 */

import React, { useRef, useEffect } from "react";

interface FaceMeshOverlayProps {
  videoElement: HTMLVideoElement | null;
  landmarks: any[] | null;
  isActive: boolean;
}

export const FaceMeshOverlay: React.FC<FaceMeshOverlayProps> = ({
  videoElement,
  landmarks,
  isActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !videoElement || !isActive || !landmarks) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw face mesh landmarks
    if (landmarks && landmarks.length > 0) {
      const face = landmarks[0];
      if (face.keypoints) {
        // Draw key facial landmarks
        ctx.fillStyle = "rgba(0, 255, 0, 0.8)";

        // Key landmarks to highlight
        const keyLandmarks = [
          1, // nose tip
          33, // left eye outer corner
          263, // right eye outer corner
          61, // left mouth corner
          291, // right mouth corner
          152, // chin
          10, // forehead center
        ];

        keyLandmarks.forEach((index) => {
          if (face.keypoints[index]) {
            const point = face.keypoints[index];
            const x = point.x * canvas.width;
            const y = point.y * canvas.height;

            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
          }
        });

        // Draw face outline (simplified)
        ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
        ctx.lineWidth = 1;

        const faceOutline = [
          10, 151, 9, 8, 168, 6, 148, 152, 175, 136, 150, 149, 176, 148, 152,
          377, 400, 378, 379, 365, 397, 288, 361, 323,
        ];

        ctx.beginPath();
        faceOutline.forEach((index, i) => {
          if (face.keypoints[index]) {
            const point = face.keypoints[index];
            const x = point.x * canvas.width;
            const y = point.y * canvas.height;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
        });
        ctx.closePath();
        ctx.stroke();

        // Draw eye regions
        const leftEye = [
          33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160,
          161, 246,
        ];
        const rightEye = [
          362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385,
          384, 398,
        ];

        [leftEye, rightEye].forEach((eyeIndices) => {
          ctx.strokeStyle = "rgba(255, 255, 0, 0.6)";
          ctx.beginPath();
          eyeIndices.forEach((index, i) => {
            if (face.keypoints[index]) {
              const point = face.keypoints[index];
              const x = point.x * canvas.width;
              const y = point.y * canvas.height;

              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
          });
          ctx.closePath();
          ctx.stroke();
        });
      }
    }
  }, [videoElement, landmarks, isActive]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: "screen" }}
    />
  );
};
