import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import type { TrackingStatus, Keypoint } from "@/hooks/useVision";
import { Loader2 } from "lucide-react";

interface VideoFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  landmarks?: Keypoint[];
  trackingStatus: TrackingStatus;
  className?: string;
}

const VideoFeed = ({
  videoRef,
  isActive,
  landmarks,
  trackingStatus,
  className,
}: VideoFeedProps) => {
  // Camera initialization is now handled by the useVision hook

  // VideoFeed component for camera display

  const statusStyles: {
    [key in TrackingStatus]: {
      border: string;
      message: string;
      showIcon: boolean;
    };
  } = {
    IDLE: {
      border: "border-gray-400",
      message: "Click 'Enable Camera' to start",
      showIcon: false,
    },
    REQUESTING_CAMERA: {
      border: "border-blue-400",
      message: "Requesting camera access...",
      showIcon: true,
    },
    INITIALIZING: {
      border: "border-yellow-400",
      message: "Initializing face detection...",
      showIcon: true,
    },
    TRACKING: { border: "border-green-400", message: "", showIcon: false },
    NO_FACE: {
      border: "border-red-500",
      message: "Face not detected. Adjust lighting or position.",
      showIcon: false,
    },
    ERROR: {
      border: "border-red-600",
      message:
        "Camera access denied or error. Please allow camera access and refresh.",
      showIcon: false,
    },
  };

  const { border, message, showIcon } =
    statusStyles[trackingStatus] || statusStyles.IDLE;

  return (
    <div
      className={cn(
        "absolute bottom-4 right-4 w-32 h-24 md:w-48 md:h-36 rounded-lg overflow-hidden shadow-2xl border-4 transition-colors duration-500",
        border,
        className
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform -scale-x-100"
      />
      {message && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-2">
          {showIcon && <Loader2 className="animate-spin text-white mb-2" />}
          <p className="text-white text-xs font-semibold text-center">
            {message}
          </p>
        </div>
      )}
      <div
        className={cn("absolute inset-0 bg-black/20", { hidden: !!message })}
      />
      {isActive && landmarks && landmarks.length > 0 && (
        <>
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs p-1 rounded z-10">
            {landmarks.length} landmarks
          </div>
          <svg className="absolute inset-0 w-full h-full transform -scale-x-100">
            {landmarks.map((point, i) => {
              // Different colors for different facial features (68-point model)
              let color = "cyan";
              let radius = 1.5;

              // Jaw line (0-16)
              if (i >= 0 && i <= 16) {
                color = "#ff6b6b"; // Red
                radius = 1;
              }
              // Right eyebrow (17-21)
              else if (i >= 17 && i <= 21) {
                color = "#4ecdc4"; // Teal
                radius = 1.5;
              }
              // Left eyebrow (22-26)
              else if (i >= 22 && i <= 26) {
                color = "#4ecdc4"; // Teal
                radius = 1.5;
              }
              // Nose bridge (27-30)
              else if (i >= 27 && i <= 30) {
                color = "#45b7d1"; // Blue
                radius = 2;
              }
              // Lower nose (31-35)
              else if (i >= 31 && i <= 35) {
                color = "#96ceb4"; // Green
                radius = 1.5;
              }
              // Right eye (36-41)
              else if (i >= 36 && i <= 41) {
                color = "#feca57"; // Yellow
                radius = 2;
              }
              // Left eye (42-47)
              else if (i >= 42 && i <= 47) {
                color = "#feca57"; // Yellow
                radius = 2;
              }
              // Outer mouth (48-59)
              else if (i >= 48 && i <= 59) {
                color = "#ff9ff3"; // Pink
                radius = 2;
              }
              // Inner mouth (60-67)
              else if (i >= 60 && i <= 67) {
                color = "#ff6b9d"; // Light pink
                radius = 1.5;
              }

              return (
                <circle
                  key={`landmark-${i}`}
                  cx={point.x}
                  cy={point.y}
                  r={radius}
                  fill={color}
                  stroke="white"
                  strokeWidth="0.5"
                  opacity="0.8"
                />
              );
            })}

            {/* Add connecting lines for key features */}
            {landmarks.length >= 68 && (
              <g stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none">
                {/* Jaw line */}
                <path
                  d={`M ${landmarks[0]?.x},${landmarks[0]?.y} ${landmarks
                    .slice(0, 17)
                    .map((p) => `L ${p.x},${p.y}`)
                    .join(" ")}`}
                />

                {/* Right eyebrow */}
                <path
                  d={`M ${landmarks[17]?.x},${landmarks[17]?.y} ${landmarks
                    .slice(17, 22)
                    .map((p) => `L ${p.x},${p.y}`)
                    .join(" ")}`}
                />

                {/* Left eyebrow */}
                <path
                  d={`M ${landmarks[22]?.x},${landmarks[22]?.y} ${landmarks
                    .slice(22, 27)
                    .map((p) => `L ${p.x},${p.y}`)
                    .join(" ")}`}
                />

                {/* Nose */}
                <path
                  d={`M ${landmarks[27]?.x},${landmarks[27]?.y} ${landmarks
                    .slice(27, 36)
                    .map((p) => `L ${p.x},${p.y}`)
                    .join(" ")}`}
                />

                {/* Right eye */}
                <path
                  d={`M ${landmarks[36]?.x},${landmarks[36]?.y} ${landmarks
                    .slice(36, 42)
                    .map((p) => `L ${p.x},${p.y}`)
                    .join(" ")} L ${landmarks[36]?.x},${landmarks[36]?.y}`}
                />

                {/* Left eye */}
                <path
                  d={`M ${landmarks[42]?.x},${landmarks[42]?.y} ${landmarks
                    .slice(42, 48)
                    .map((p) => `L ${p.x},${p.y}`)
                    .join(" ")} L ${landmarks[42]?.x},${landmarks[42]?.y}`}
                />

                {/* Outer mouth */}
                <path
                  d={`M ${landmarks[48]?.x},${landmarks[48]?.y} ${landmarks
                    .slice(48, 60)
                    .map((p) => `L ${p.x},${p.y}`)
                    .join(" ")} L ${landmarks[48]?.x},${landmarks[48]?.y}`}
                />
              </g>
            )}
          </svg>
        </>
      )}
      {isActive && (!landmarks || landmarks.length === 0) && (
        <div className="absolute top-2 left-2 bg-red-500/60 text-white text-xs p-1 rounded z-10">
          No landmarks: {trackingStatus}
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
