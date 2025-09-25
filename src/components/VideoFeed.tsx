import React from "react";
import { useCamera } from "../contexts/CameraContext";
import { TrackingStatus, Keypoint } from "../hooks/visionTypes";

interface VideoFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  landmarks?: Keypoint[];
  trackingStatus?: TrackingStatus;
  className?: string;
  // AGGRESSIVE CONSOLIDATION: Removed duplicate restlessness props
}

const VideoFeed = ({
  videoRef,
  isActive,
  landmarks = [],
  trackingStatus = "IDLE",
  className = "",
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
  }, [videoRef, videoRef.current?.srcObject, trackingStatus]);

  // Handle stream attachment when video element is ready
  React.useEffect(() => {
    const video = videoRef.current;
    if (video) {
      console.log('📺 VideoFeed: Video element state check:', {
        hasVideo: !!video,
        hasSrcObject: !!video.srcObject,
        readyState: video.readyState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        paused: video.paused
      });
      
      if (!video.srcObject) {
        console.log('📺 Video element ready but no stream detected');
      }
    }
  }, [videoRef, videoRef.current?.readyState, videoRef.current?.srcObject]);
  
  // Style for the video element
  const videoStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scaleX(-1)", // Mirror the video (selfie mode)
    backgroundColor: "transparent", // Ensure no white background
    display: "block",
    visibility: "visible",
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

 // Stream presence derived from CameraContext
 const { stream } = useCamera();
 const hasVideoStream = !!stream;

 // Attach stream to video element when available
 React.useEffect(() => {
   if (videoRef.current && stream) {
     videoRef.current.srcObject = stream;
     // Attempt to play the video; ignore errors (e.g., autoplay restrictions)
     videoRef.current.play().catch(() => {});
   }
 }, [videoRef, videoRef.current, stream]);

  return (
    <div className={`relative ${className}`} style={{ overflow: "hidden", backgroundColor: "black" }}>
      {/* Video element */}
      <video 
        ref={videoRef} 
        style={videoStyle} 
        autoPlay 
        playsInline 
        muted 
        className={hasVideoStream ? "" : "hidden"}
      />

      {/* Debug overlay to show video element state */}
      {!hasVideoStream && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '14px',
          textAlign: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 10,
        }}>
          No camera stream detected
          <br />
          <small>Video element: {videoRef.current ? 'Ready' : 'Not ready'}</small>
        </div>
      )}

      {/* Overlay landmarks */}
      {isActive && hasVideoStream &&
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

      {/* AGGRESSIVE CONSOLIDATION: Removed duplicate restlessness score */}
      {/* DRY: Stillness score is already prominently displayed in SessionProgressDisplay */}
    </div>
  );
};

export default VideoFeed;
