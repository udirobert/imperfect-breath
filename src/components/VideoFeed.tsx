import React from "react";
import { TrackingStatus, Keypoint } from "../hooks/visionTypes";

interface VideoFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  landmarks?: Keypoint[];
  trackingStatus?: TrackingStatus;
  className?: string;
  showRestlessnessScore?: boolean;
  restlessnessScore?: number;
}

const VideoFeed = ({
  videoRef,
  isActive,
  landmarks = [],
  trackingStatus = "IDLE",
  className = "",
  showRestlessnessScore = false,
  restlessnessScore = 0,
}: VideoFeedProps) => {
  // PERFORMANT: Log only when stream connection changes
  const lastStreamState = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (videoRef.current) {
      const hasStream = !!videoRef.current.srcObject;

      if (hasStream !== lastStreamState.current) {
        console.log('📺 Video stream connection changed:', {
          hasStream,
          trackingStatus,
          videoSize: `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`
        });
        lastStreamState.current = hasStream;
      }
    }
  }, [videoRef.current?.srcObject, trackingStatus]);

  // Handle stream attachment when video element is ready
  React.useEffect(() => {
    const video = videoRef.current;
    if (video && !video.srcObject) {
      // Video element is ready but no stream - this might indicate the stream needs to be reattached
      console.log('📺 Video element ready but no stream detected');
    }
  }, [videoRef.current?.readyState]);
  // Style for the video element
  const videoStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scaleX(-1)", // Mirror the video (selfie mode)
  };

  // Style for each landmark point
  const landmarkStyle: React.CSSProperties = {
    position: "absolute",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "rgba(0, 255, 0, 0.8)",
    transform: "translate(-50%, -50%)",
  };

  // Status indicator style
  const statusIndicatorStyle: React.CSSProperties = {
    position: "absolute",
    top: "8px",
    right: "8px",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "bold",
  };

  // Determine status indicator color
  const getStatusStyle = () => {
    switch (trackingStatus) {
      case "TRACKING":
        return {
          ...statusIndicatorStyle,
          backgroundColor: "rgba(0, 255, 0, 0.7)",
          color: "white",
        };
      case "INITIALIZING":
        return {
          ...statusIndicatorStyle,
          backgroundColor: "rgba(255, 165, 0, 0.7)",
          color: "white",
        };
      case "ERROR":
        return {
          ...statusIndicatorStyle,
          backgroundColor: "rgba(255, 0, 0, 0.7)",
          color: "white",
        };
      default:
        return {
          ...statusIndicatorStyle,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          color: "white",
        };
    }
  };

  return (
    <div className={`relative ${className}`} style={{ overflow: "hidden" }}>
      {/* Video element */}
      <video ref={videoRef} style={videoStyle} autoPlay playsInline muted />

      {/* Overlay landmarks */}
      {isActive &&
        landmarks.map((point, index) => (
          <div
            key={`landmark-${index}`}
            style={{
              ...landmarkStyle,
              left: `${point.x * 100}%`,
              top: `${point.y * 100}%`,
            }}
          />
        ))}

      {/* Status indicator */}
      <div style={getStatusStyle()}>{trackingStatus}</div>

      {/* MODULAR: Restlessness score overlay */}
      {showRestlessnessScore && isActive && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
        }}>
          Restlessness: {restlessnessScore.toFixed(1)}
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
