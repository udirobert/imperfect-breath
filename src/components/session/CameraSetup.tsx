import React, { Suspense, lazy, useState } from "react";
import { Button } from "@/components/ui/button";
import { useEnhancedSession } from "@/hooks/useEnhancedSession";
import { TrackingStatus, Keypoint } from "@/hooks/visionTypes";
import { Loader2, Camera } from "lucide-react";

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
  const { start, isReady: sessionReady, state } = useEnhancedSession();
  const [cameraRequested, setCameraRequested] = useState(false);
  const isReady = trackingStatus === "TRACKING";
  const needsCameraSetup = trackingStatus === "IDLE" && !cameraRequested;

  const handleRequestCamera = async () => {
    setCameraRequested(true);
    await initializeCamera();
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
            disabled={!isReady || !sessionReady}
            className="w-48"
          >
            {(!isReady || !sessionReady) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isReady && sessionReady ? "Start Session" : "Initializing..."}
          </Button>
        )}
        {!isReady && cameraRequested && (
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
