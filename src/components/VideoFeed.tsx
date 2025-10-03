import React from "react";
import { useCamera } from "../contexts/CameraContext";
import { TrackingStatus, Keypoint } from "../hooks/visionTypes";

interface VideoFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  landmarks?: Keypoint[];
  trackingStatus?: TrackingStatus;
  className?: string;
  luxuryMode?: boolean; // ENHANCEMENT: Optional premium face mesh styling
}

const VideoFeed = ({
  videoRef,
  isActive,
  landmarks = [],
  trackingStatus = "IDLE",
  className = "",
  luxuryMode = true, // ENHANCEMENT: Default to premium styling
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

  // Premium landmark styles - subtle and sophisticated
  const getLandmarkStyle = (index: number, total: number): React.CSSProperties => {
    // Create subtle variation in opacity for depth
    const baseOpacity = 0.3;
    const variation = (Math.sin(index * 0.1) * 0.1) + baseOpacity;
    
    return {
      position: "absolute",
      width: "3px",
      height: "3px",
      borderRadius: "50%",
      background: `radial-gradient(circle, rgba(59, 130, 246, ${variation + 0.2}) 0%, rgba(59, 130, 246, ${variation}) 70%, transparent 100%)`,
      transform: "translate(-50%, -50%)",
      boxShadow: `0 0 4px rgba(59, 130, 246, ${variation * 0.5})`,
      transition: "all 0.3s ease-out",
    };
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

      {/* Face Mesh Overlay - Luxury vs Basic */}
      {isActive && hasVideoStream && landmarks.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {luxuryMode ? (
            // PREMIUM: Sophisticated face mesh with ambient effects
            <>
              {/* Subtle face outline glow */}
              <div 
                className="absolute inset-0 opacity-20 transition-opacity duration-1000"
                style={{
                  background: `radial-gradient(ellipse 40% 50% at 50% 45%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)`,
                  filter: 'blur(20px)',
                }}
              />
              
              {/* Premium landmark points with breathing animation */}
              {landmarks.map((point, index) => (
                <div
                  key={`landmark-${index}`}
                  className="animate-pulse"
                  style={{
                    ...getLandmarkStyle(index, landmarks.length),
                    left: `${point.x * 100}%`,
                    top: `${point.y * 100}%`,
                    animationDelay: `${index * 0.05}s`,
                    animationDuration: '3s',
                  }}
                />
              ))}
              
              {/* Elegant tracking indicator */}
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1.5 transition-all duration-500">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-white/80 text-xs font-light tracking-wide">Tracking</span>
              </div>
            </>
          ) : (
            // BASIC: Simple clean dots for performance/preference
            landmarks.map((point, index) => (
              <div
                key={`landmark-${index}`}
                className="absolute w-1 h-1 bg-blue-400/60 rounded-full"
                style={{
                  left: `${point.x * 100}%`,
                  top: `${point.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))
          )}
        </div>
      )}

      {/* AGGRESSIVE CONSOLIDATION: Removed old status indicator - using premium one above */}

      {/* AGGRESSIVE CONSOLIDATION: Removed duplicate restlessness score */}
      {/* DRY: Stillness score is already prominently displayed in SessionProgressDisplay */}
    </div>
  );
};

export default VideoFeed;
