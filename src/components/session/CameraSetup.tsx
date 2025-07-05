import React, { Suspense, lazy, useState } from "react";
import { Button } from "@/components/ui/button";
import { useBreathingSession } from "@/hooks/useBreathingSession";
import { TrackingStatus, Keypoint } from "@/hooks/useVision";
import { Loader2, Camera } from "lucide-react";

const VideoFeed = lazy(() => import("@/components/VideoFeed"));

type CameraSetupProps = {
  controls: ReturnType<typeof useBreathingSession>["controls"];
  videoRef: React.RefObject<HTMLVideoElement>;
  landmarks: Keypoint[];
  trackingStatus: TrackingStatus;
  initializeCamera: () => Promise<void>;
};

export const CameraSetup = ({
  controls,
  videoRef,
  landmarks,
  trackingStatus,
  initializeCamera,
}: CameraSetupProps) => {
  const [cameraRequested, setCameraRequested] = useState(false);
  const isReady = trackingStatus === "TRACKING";
  const needsCameraSetup = trackingStatus === "IDLE" && !cameraRequested;

  const handleRequestCamera = async () => {
    setCameraRequested(true);
    await initializeCamera();
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
            onClick={controls.startSession}
            size="lg"
            disabled={!isReady}
            className="w-48"
          >
            {!isReady && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isReady ? "Start Session" : "Initializing..."}
          </Button>
        )}
        {!isReady && cameraRequested && (
          <p className="text-sm text-muted-foreground mt-4">
            Having trouble? You can{" "}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={controls.startSession}
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
