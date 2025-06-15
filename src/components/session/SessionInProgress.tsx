import React, { Suspense, lazy, useState } from "react";
import BreathingAnimation from "@/components/BreathingAnimation";
import { BreathingPhaseName } from "@/lib/breathingPatterns";
import { useBreathingSession } from "@/hooks/useBreathingSession";
import { SessionHeader } from "./SessionHeader";
import { SessionControls } from "./SessionControls";
import { Button } from "@/components/ui/button";
import type { TrackingStatus, Keypoint } from "@/hooks/useCameraTracking";
import { Loader2, Camera } from "lucide-react";

const VideoFeed = lazy(() => import("@/components/VideoFeed"));

type SessionInProgressProps = {
  state: ReturnType<typeof useBreathingSession>["state"];
  controls: ReturnType<typeof useBreathingSession>["controls"];
  handleEndSession: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  showVideoFeed: boolean;
  isTracking: boolean;
  restlessnessScore: number;
  landmarks: Keypoint[];
  trackingStatus: TrackingStatus;
  initializeCamera: () => Promise<void>;
};

export const SessionInProgress = ({
  state,
  controls,
  handleEndSession,
  videoRef,
  showVideoFeed,
  isTracking,
  restlessnessScore,
  landmarks,
  trackingStatus,
  initializeCamera,
}: SessionInProgressProps) => {
  const [cameraRequested, setCameraRequested] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  const isReady = trackingStatus === "TRACKING";
  const needsCameraSetup = trackingStatus === "IDLE" && !cameraRequested;
  const showBreathingInterface = sessionStarted && state.isRunning;

  const handleRequestCamera = async () => {
    setCameraRequested(true);
    await initializeCamera();
  };

  const handleStartSession = () => {
    setSessionStarted(true);
    controls.startSession();
  };

  // Show camera setup screen if camera not set up yet
  if (!sessionStarted && needsCameraSetup) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center w-full relative animate-fade-in p-4 text-center">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Camera Setup</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Position your face in the center of the video feed. This allows us
            to measure your stillness and focus during the session.
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
          <Button onClick={handleRequestCamera} size="lg" className="w-48">
            <Camera className="mr-2 h-4 w-4" />
            Enable Camera
          </Button>
        </div>
      </div>
    );
  }

  // Show ready screen if camera is set up but session not started
  if (!sessionStarted && cameraRequested) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center w-full relative animate-fade-in p-4 text-center">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Ready to Begin</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Camera is active and face detection is working. Start your breathing
            session when ready.
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
          <Button
            onClick={handleStartSession}
            size="lg"
            disabled={!isReady}
            className="w-48"
          >
            {!isReady && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isReady ? "Start Session" : "Initializing..."}
          </Button>
          {!isReady && (
            <p className="text-sm text-muted-foreground mt-4">
              Having trouble? You can{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={handleStartSession}
              >
                skip the camera setup
              </Button>
              .
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show breathing session interface
  return (
    <div className="flex-grow flex flex-col items-center justify-center w-full relative animate-fade-in">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <BreathingAnimation
          phase={
            state.sessionPhase === "breath-hold"
              ? "hold"
              : (state.sessionPhase as BreathingPhaseName)
          }
          text={state.phaseText}
        />
      </div>

      <SessionHeader state={state} />

      <SessionControls
        state={state}
        controls={controls}
        onEndSession={handleEndSession}
      />

      {showVideoFeed && (
        <Suspense
          fallback={
            <div className="absolute bottom-4 right-4 w-32 h-24 md:w-48 md:h-36 rounded-lg bg-secondary animate-pulse" />
          }
        >
          <VideoFeed
            videoRef={videoRef}
            isActive={showVideoFeed}
            landmarks={landmarks}
            trackingStatus={trackingStatus}
          />
        </Suspense>
      )}

      {isTracking && (
        <div className="absolute bottom-4 left-4 bg-gray-900/80 text-white p-2 rounded-lg text-xs z-30 font-mono animate-fade-in">
          <p>RESTLESSNESS: {Math.round(restlessnessScore)}</p>
        </div>
      )}
    </div>
  );
};
