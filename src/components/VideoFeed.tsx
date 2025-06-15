import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import type { TrackingStatus, Keypoint } from "@/hooks/useCameraTracking";
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
  // Camera initialization is now handled by the useCameraTracking hook

  const statusStyles: {
    [key in TrackingStatus]: {
      border: string;
      message: string;
      showIcon: boolean;
    };
  } = {
    IDLE: { border: "border-white", message: "", showIcon: false },
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
        className,
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
        <svg className="absolute inset-0 w-full h-full transform -scale-x-100">
          {landmarks.map((point, i) => (
            <circle
              key={`landmark-${i}`}
              cx={point.x}
              cy={point.y}
              r="1"
              fill="cyan"
            />
          ))}
        </svg>
      )}
    </div>
  );
};

export default VideoFeed;
