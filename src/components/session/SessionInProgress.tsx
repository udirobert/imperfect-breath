import React, { useEffect, useState } from "react";
import BreathingAnimation from "../../components/BreathingAnimation";
import {
  BreathingPhaseName,
  BREATHING_PATTERNS,
} from "../../lib/breathingPatterns";
import { useEnhancedSession } from "../../hooks/useEnhancedSession";
import { SessionHeader } from "./SessionHeader";
import { SessionControls } from "./SessionControls";
import { Button } from "../../components/ui/button";
import { TrackingStatus, Keypoint } from "../../hooks/visionTypes";
import {
  Loader2,
  Camera,
  Volume2,
  VolumeX,
  Pause,
  Play,
  StopCircle,
} from "lucide-react";
import VideoFeed from "../../components/VideoFeed";

type SessionInProgressProps = {
  handleEndSession?: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  showVideoFeed: boolean;
  isTracking: boolean;
  restlessnessScore: number;
  landmarks: Keypoint[];
  trackingStatus: TrackingStatus;
  cameraInitialized: boolean;
  cameraRequested: boolean;
  onRequestCamera: () => Promise<void>;
  patternName?: string;
};

export const SessionInProgress = ({
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
  patternName = "Breathing Session",
}: SessionInProgressProps) => {
  const {
    state,
    isActive,
    isReady,
    isPaused,
    isAudioEnabled,
    initialize,
    start,
    pause,
    resume,
    stop,
    toggleAudio,
    getSessionDuration,
  } = useEnhancedSession();

  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );

  // Initialize session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      // Only initialize if we're in setup phase and not already initializing
      if (state.phase !== "setup" || isInitializing) return;

      try {
        setIsInitializing(true);
        setInitializationError(null);

        // Use default breathing pattern (box breathing) for desktop interface
        const defaultPattern = BREATHING_PATTERNS.box;

        const sessionConfig = {
          pattern: {
            name: defaultPattern.name,
            phases: {
              inhale: defaultPattern.inhale,
              hold: defaultPattern.hold,
              exhale: defaultPattern.exhale,
              pause: defaultPattern.rest,
            },
            difficulty: "medium",
            benefits: defaultPattern.benefits || [],
          },
          features: {
            enableCamera: false, // Disable camera by default for desktop
            enableAI: false, // Disable AI since camera is off
            enableAudio: true, // Enable audio guidance
          },
          cameraSettings: {
            displayMode: "focus" as const,
            quality: "medium" as const,
          },
        };

        await initialize(sessionConfig);
      } catch (error) {
        const errorMessage = (error as Error).message;
        // Don't show error if session is already initialized
        if (!errorMessage.includes("already initialized")) {
          console.error("Session initialization failed:", error);
          setInitializationError(errorMessage);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSession();
  }, [state.phase]); // Only depend on state.phase, not initialize function

  const needsCameraSetup = trackingStatus === "IDLE" && !cameraRequested;
  const cameraReady = trackingStatus === "TRACKING" || cameraInitialized;
  const showBreathingInterface = isActive;

  // VideoFeed positioning: setup phase vs breathing phase
  const videoFeedContainerClass = showBreathingInterface
    ? "absolute bottom-4 right-4 w-32 h-24 md:w-48 md:h-36 rounded-lg overflow-hidden shadow-2xl border-4 border-green-400"
    : "w-64 h-48 md:w-96 md:h-72 relative rounded-lg overflow-hidden shadow-lg mb-8";

  const videoFeedClassName = showBreathingInterface
    ? ""
    : "!relative !inset-0 !w-full !h-full";

  const handleStartSession = async () => {
    try {
      // Only start if session is ready
      if (!isReady) {
        console.warn("Session not ready to start");
        return;
      }
      await start();
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  // Unified interface - no more phase-based screens
  return (
    <div className="flex-grow flex flex-col w-full relative animate-fade-in">
      {/* Setup Interface - show when not running */}
      {!showBreathingInterface && (
        <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
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
                    onClick={handleStartSession}
                    disabled={!isReady || isInitializing}
                    className="w-48"
                  >
                    {isInitializing
                      ? "Preparing..."
                      : !isReady
                      ? "Preparing..."
                      : "Start Without Camera"}
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
                onClick={handleStartSession}
                size="lg"
                disabled={!isReady || isInitializing}
                className="w-48"
              >
                {isInitializing
                  ? "Preparing..."
                  : !isReady
                  ? "Preparing..."
                  : "Start Breathing Session"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Active Session Interface - show when running */}
      {showBreathingInterface && (
        <div className="flex-grow flex flex-col items-center justify-center py-4 px-4 space-y-8">
          {/* Session Header - compact */}
          <div className="text-center">
            <p className="text-lg text-muted-foreground">{patternName}</p>
            <p className="text-3xl font-mono font-bold text-primary">
              {getSessionDuration()}
            </p>
          </div>

          {/* Breathing Animation - centered, no duplicate text */}
          <div className="flex items-center justify-center">
            <BreathingAnimation
              phase={state.sessionData.currentPhase as BreathingPhaseName}
              text={state.sessionData.currentPhase}
            />
          </div>

          {/* Session Controls - compact */}
          <div className="flex items-center justify-center space-x-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudio}
              className="rounded-full w-12 h-12"
            >
              {isAudioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (isActive) {
                  pause();
                } else if (isPaused) {
                  resume();
                }
              }}
              className="rounded-full w-14 h-14"
              disabled={!isActive && !isPaused}
            >
              {isActive ? <Pause size={28} /> : <Play size={28} />}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                stop();
                handleEndSession?.();
              }}
              className="rounded-full w-12 h-12 bg-red-400 hover:bg-red-500"
            >
              <StopCircle size={24} />
            </Button>
          </div>
        </div>
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
