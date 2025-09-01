import React, { Suspense, lazy, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { TrackingStatus, Keypoint } from "@/hooks/visionTypes";
import { Loader2, Camera, AlertCircle } from "lucide-react";

const VideoFeed = lazy(() => import("@/components/VideoFeed"));

type CameraSetupProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  landmarks: Keypoint[];
  trackingStatus: TrackingStatus;
  initializeCamera: () => Promise<void>;
};

export const CameraSetup = ({
  videoRef,
  landmarks,
  trackingStatus,
  initializeCamera,
}: CameraSetupProps) => {
  const { start, cameraPermissionGranted, phase, config, cameraStream } = useSession();
  const [cameraRequested, setCameraRequested] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  
  // Simplified logic: camera is ready if we have a stream and no errors
  const isCameraReady = !!cameraStream && !cameraError && cameraInitialized;
  const isReady = trackingStatus === "TRACKING" || isCameraReady;
  const needsCameraSetup = trackingStatus === "IDLE" && !cameraRequested;
  const isInitializing = cameraRequested && !isCameraReady && !cameraError;
  
  // Session is ready if we have a config and either camera is ready or we can skip camera
  const sessionReady = !!config && (isCameraReady || cameraError || phase === 'ready');

  // Timeout for initialization to prevent infinite loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isInitializing) {
      timeoutId = setTimeout(() => {
        setCameraError("Camera initialization is taking longer than expected. You can skip camera setup to continue.");
      }, 10000); // 10 second timeout
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isInitializing]);

  const handleRequestCamera = async () => {
    try {
      setCameraRequested(true);
      setCameraError(null);
      setCameraInitialized(false);
      await initializeCamera();
      // If we get here without error, camera is initialized
      setCameraInitialized(true);
    } catch (error) {
      console.error("Camera initialization failed:", error);
      setCameraError(
        error instanceof Error 
          ? error.message 
          : "Failed to initialize camera. Please check permissions and try again."
      );
      setCameraInitialized(false);
    }
  };

  const handleStartSession = async () => {
    try {
      // Only start if session is ready
      if (!sessionReady) {
        console.warn("Session not ready to start");
        return;
      }
      await start();
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center w-full relative animate-fade-in p-4 text-center">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Camera Setup</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Position your face in the center of the video feed. This allows us to
          measure your stillness and focus during the session.
        </p>
      </div>

      <div className="w-64 h-48 md:w-96 md:h-72 relative rounded-lg overflow-hidden shadow-lg">
        <Suspense
          fallback={
            <div className="w-full h-full rounded-lg bg-secondary animate-pulse" />
          }
        >
          <VideoFeed
            videoRef={videoRef}
            isActive={true}
            landmarks={landmarks}
            trackingStatus={trackingStatus}
            className="!relative !inset-0 !w-full !h-full"
          />
        </Suspense>
      </div>

      {cameraError && (
        <div className="mt-4 p-3 bg-destructive/20 text-destructive rounded-md max-w-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{cameraError}</span>
        </div>
      )}

      <div className="mt-8 text-center">
        {needsCameraSetup ? (
          <Button onClick={handleRequestCamera} size="lg" className="w-48">
            <Camera className="mr-2 h-4 w-4" />
            Enable Camera
          </Button>
        ) : (
          <Button
            onClick={handleStartSession}
            size="lg"
            disabled={!isReady && !cameraError && isInitializing}
            className="w-48"
          >
            {(isInitializing && !cameraError) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isReady && sessionReady ? "Start Session" : 
             cameraError ? "Continue Without Camera" : "Initializing..."}
          </Button>
        )}
        {(!isReady && cameraRequested) && (
          <p className="text-sm text-muted-foreground mt-4">
            Having trouble? You can{" "}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={handleStartSession}
              disabled={!sessionReady}
            >
              skip the camera setup
            </Button>
            .
          </p>
        )}
      </div>
    </div>
  );
};
