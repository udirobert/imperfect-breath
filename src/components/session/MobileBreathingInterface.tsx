import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEnhancedSession } from "@/hooks/useEnhancedSession";
import BreathingAnimation from "@/components/BreathingAnimation";
import {
  BreathingPhaseName,
  BREATHING_PATTERNS,
} from "@/lib/breathingPatterns";
import {
  Play,
  Pause,
  Square,
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBreathingInterfaceProps {
  onEndSession?: () => void;
  patternName?: string;
}

export const MobileBreathingInterface: React.FC<
  MobileBreathingInterfaceProps
> = ({ onEndSession, patternName = "Breathing Session" }) => {
  const isMobile = useIsMobile();
  const {
    state,
    isReady,
    isActive,
    isPaused,
    isAudioEnabled,
    canUseCamera,
    cameraStream,
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
      if (state.phase !== "setup" || isInitializing) return;

      try {
        setIsInitializing(true);
        setInitializationError(null);

        // Use default breathing pattern (box breathing) for mobile interface
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
            enableCamera: false, // Disable camera by default for mobile
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
        console.error("Session initialization failed:", error);
        setInitializationError((error as Error).message);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSession();
  }, [initialize, state.phase, isInitializing]);

  // Only render on mobile
  if (!isMobile) {
    return null;
  }

  // Calculate progress based on session duration (simplified)
  const progress =
    state.sessionData.duration > 0
      ? Math.min((state.sessionData.duration / 300) * 100, 100)
      : 0; // 5 min max

  const handlePlayPause = async () => {
    try {
      if (isActive) {
        pause();
      } else if (isPaused) {
        resume();
      } else {
        // Only start if session is ready
        if (!isReady) {
          console.warn("Session not ready to start");
          return;
        }
        await start();
      }
    } catch (error) {
      console.error("Session control failed:", error);
      setInitializationError((error as Error).message);
    }
  };

  const handleStop = () => {
    stop();
    onEndSession?.();
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
      {/* Status Bar */}
      <div className="flex-shrink-0 px-4 py-3 bg-background/80 backdrop-blur">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{patternName}</span>
          <span className="text-muted-foreground">
            Cycle {state.sessionData.cycleCount + 1}
          </span>
        </div>
        <Progress value={progress} className="mt-2 h-1" />
      </div>

      {/* Main Breathing Area */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Background Animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <BreathingAnimation
            phase={state.sessionData.currentPhase as BreathingPhaseName}
            text={state.sessionData.currentPhase}
          />
        </div>

        {/* Phase Text Overlay */}
        <div className="absolute top-1/4 left-0 right-0 text-center z-10">
          <h2 className="text-2xl font-light text-foreground/90 mb-2">
            {state.sessionData.currentPhase}
          </h2>
        </div>

        {/* Session Stats */}
        <div className="absolute bottom-1/4 left-0 right-0 px-8">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-background/60 backdrop-blur rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-lg font-semibold">{getSessionDuration()}</p>
            </div>
            <div className="bg-background/60 backdrop-blur rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Cycles</p>
              <p className="text-lg font-semibold">
                {state.sessionData.cycleCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Touch Controls */}
      <div className="flex-shrink-0 p-4 bg-background/80 backdrop-blur">
        {/* Primary Controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePlayPause}
            disabled={isInitializing || (!isReady && !isActive && !isPaused)}
            className={cn(
              "h-16 w-16 rounded-full",
              "touch-manipulation", // Optimize for touch
              isActive
                ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            {isInitializing ? (
              <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full" />
            ) : isActive ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={handleStop}
            disabled={isInitializing}
            className="h-16 w-16 rounded-full touch-manipulation"
          >
            <Square className="h-6 w-6" />
          </Button>
        </div>

        {/* Initialization Status */}
        {(isInitializing || initializationError) && (
          <div className="mb-4 text-center">
            {isInitializing && (
              <p className="text-sm text-muted-foreground">
                Preparing session...
              </p>
            )}
            {initializationError && (
              <p className="text-sm text-red-600">{initializationError}</p>
            )}
          </div>
        )}

        {/* Secondary Controls */}
        <div className="flex items-center justify-center gap-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {}} // Camera toggle would be handled by parent
            className={cn(
              "flex flex-col items-center gap-1 h-auto py-2 px-3",
              "touch-manipulation",
              canUseCamera ? "text-primary" : "text-muted-foreground"
            )}
          >
            {canUseCamera ? (
              <Camera className="h-5 w-5" />
            ) : (
              <CameraOff className="h-5 w-5" />
            )}
            <span className="text-xs">Camera</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAudio}
            className={cn(
              "flex flex-col items-center gap-1 h-auto py-2 px-3",
              "touch-manipulation",
              isAudioEnabled ? "text-primary" : "text-muted-foreground"
            )}
          >
            {isAudioEnabled ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
            <span className="text-xs">Voice</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileBreathingInterface;
