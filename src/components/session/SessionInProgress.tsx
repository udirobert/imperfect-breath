import React from "react";
import BreathingAnimation from "@/components/BreathingAnimation";
import { BreathingPhaseName } from "@/lib/breathingPatterns";
import { useBreathingSession } from "@/hooks/useBreathingSession";
import { SessionHeader } from "./SessionHeader";
import { SessionControls } from "./SessionControls";
import { Button } from "@/components/ui/button";
import type { TrackingStatus, Keypoint } from "@/hooks/useCameraTracking";
import { Loader2, Camera } from "lucide-react";
import VideoFeed from "@/components/VideoFeed";

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
  cameraInitialized: boolean;
  cameraRequested: boolean;
  onRequestCamera: () => Promise<void>;
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
  cameraInitialized,
  cameraRequested,
  onRequestCamera,
}: SessionInProgressProps) => {
  const needsCameraSetup = trackingStatus === "IDLE" && !cameraRequested;
  const cameraReady = trackingStatus === "TRACKING" || cameraInitialized;
  const showBreathingInterface = state.isRunning;

  // VideoFeed positioning: setup phase vs breathing phase
  const videoFeedContainerClass = showBreathingInterface
    ? "absolute bottom-4 right-4 w-32 h-24 md:w-48 md:h-36 rounded-lg overflow-hidden shadow-2xl border-4 border-green-400"
    : "w-64 h-48 md:w-96 md:h-72 relative rounded-lg overflow-hidden shadow-lg mb-8";

  const videoFeedClassName = showBreathingInterface
    ? ""
    : "!relative !inset-0 !w-full !h-full";

  // Unified interface - no more phase-based screens
  return (
    <div className="flex-grow flex flex-col items-center justify-center w-full relative animate-fade-in">
      {/* Breathing Animation - only show when session is running */}
      {showBreathingInterface && (
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
      )}

      {/* Setup Interface - show when not running */}
      {!showBreathingInterface && (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">
              {needsCameraSetup
                ? "Optional Camera Setup"
                : cameraRequested && !cameraReady
                ? "Setting Up Camera"
                : "Ready to Begin"}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {needsCameraSetup
                ? "Enable camera to track your stillness during breathing, or start without it."
                : cameraRequested && !cameraReady
                ? "Initializing face detection. Please wait..."
                : "Camera is ready. Start your breathing session when ready."}
            </p>
          </div>

          {/* Camera Feed placeholder during setup - actual feed renders at bottom */}

          {/* Control Buttons */}
          <div className="space-y-4">
            {needsCameraSetup ? (
              <>
                <Button onClick={onRequestCamera} size="lg" className="w-48">
                  <Camera className="mr-2 h-4 w-4" />
                  Enable Camera
                </Button>
                <div>
                  <Button
                    variant="outline"
                    onClick={() => controls.startSession()}
                    className="w-48"
                  >
                    Start Without Camera
                  </Button>
                </div>
              </>
            ) : cameraRequested && !cameraReady ? (
              <Button size="lg" disabled className="w-48">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </Button>
            ) : (
              <Button
                onClick={() => controls.startSession()}
                size="lg"
                className="w-48"
              >
                Start Breathing Session
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Session Header and Controls - only show when running */}
      {showBreathingInterface && (
        <>
          <SessionHeader state={state} />
          <SessionControls
            state={state}
            controls={controls}
            onEndSession={handleEndSession}
          />
        </>
      )}

      {/* Single VideoFeed that changes position/size based on phase */}
      {showVideoFeed && (
        <div className={videoFeedContainerClass}>
          <VideoFeed
            key="persistent-video-feed"
            videoRef={videoRef}
            isActive={showVideoFeed}
            landmarks={landmarks}
            trackingStatus={trackingStatus}
            className={videoFeedClassName}
          />
        </div>
      )}

      {/* Restlessness Score - only show when tracking during breathing */}
      {showBreathingInterface && isTracking && (
        <div className="absolute bottom-4 left-4 bg-gray-900/80 text-white p-2 rounded-lg text-xs z-30 font-mono animate-fade-in">
          <p>RESTLESSNESS: {Math.round(restlessnessScore)}</p>
        </div>
      )}
    </div>
  );
};
