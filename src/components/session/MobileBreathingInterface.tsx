import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEnhancedSession } from "@/hooks/useEnhancedSession";
import { useMobileSessionInitialization } from "@/hooks/useSessionInitialization";
import { mapPatternForAnimation } from "@/lib/session/pattern-mapper";
import BreathingAnimation from "@/components/BreathingAnimation";
import { PreparationPhase } from "./PreparationPhase";
import { useTouchGestures } from "@/hooks/useTouchGestures";
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

  // Use shared session initialization hook
  const { isInitializing, initializationError, isReady } =
    useMobileSessionInitialization(BREATHING_PATTERNS.box);

  const {
    state,
    isActive,
    isPaused,
    isAudioEnabled,
    canUseCamera,
    cameraStream,
    start,
    pause,
    resume,
    stop,
    complete,
    toggleAudio,
    getSessionDuration,
  } = useEnhancedSession();

  const [showPreparation, setShowPreparation] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

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
        setShowPreparation(false);
        await start();
      }
    } catch (error) {
      console.error("Session control failed:", error);
      // Error handling is now managed by the shared initialization hook
    }
  };

  const handleCancelPreparation = () => {
    setShowPreparation(false);
    onEndSession?.();
  };

  const handleStop = () => {
    complete(); // Complete the session to capture final data
    onEndSession?.();
  };

  // Show preparation phase first
  if (showPreparation && isReady) {
    return (
      <div className="w-full flex flex-col bg-gradient-to-b from-background to-muted/20 relative overflow-hidden min-h-[calc(100vh-4rem)] pb-safe">
        <PreparationPhase
          patternName={patternName}
          pattern={mapPatternForAnimation(BREATHING_PATTERNS.box)}
          onStart={handlePlayPause}
          onCancel={handleCancelPreparation}
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full flex flex-col bg-gradient-to-b from-background to-muted/20 relative overflow-hidden min-h-[calc(100vh-4rem)] pb-safe touch-manipulation"
    >
      {/* Compact Header */}
      <div className="flex-shrink-0 px-4 py-2 bg-background/80 backdrop-blur">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{patternName}</span>
          <span className="text-muted-foreground text-lg font-mono">
            {getSessionDuration()}
          </span>
        </div>
      </div>

      {/* Compact Main Area */}
      <div className="flex-grow flex flex-col items-center justify-center py-4 space-y-6">
        {/* Breathing Animation - with pattern info */}
        <div className="flex items-center justify-center">
          <BreathingAnimation
            phase={state.sessionData.currentPhase as BreathingPhaseName}
            pattern={mapPatternForAnimation(BREATHING_PATTERNS.box)}
            isActive={isActive}
            phaseProgress={state.sessionData.phaseProgress}
          />
        </div>

        {/* Compact Session Stats */}
        <div className="flex items-center justify-center gap-6 text-center">
          <div className="bg-background/60 backdrop-blur rounded-lg px-3 py-2">
            <p className="text-xs text-muted-foreground">Cycles</p>
            <p className="text-sm font-semibold">
              {state.sessionData.cycleCount}
            </p>
          </div>
          <div className="bg-background/60 backdrop-blur rounded-lg px-3 py-2">
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="text-sm font-semibold">{Math.round(progress)}%</p>
          </div>
        </div>
      </div>

      {/* Compact Touch Controls */}
      <div className="flex-shrink-0 px-4 py-3 bg-background/80 backdrop-blur">
        {/* Primary Controls */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePlayPause}
            disabled={isInitializing || (!isReady && !isActive && !isPaused)}
            className={cn(
              "h-14 w-14 rounded-full",
              "touch-manipulation",
              isActive
                ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            {isInitializing ? (
              <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
            ) : isActive ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={handleStop}
            disabled={isInitializing}
            className="h-14 w-14 rounded-full touch-manipulation"
          >
            <Square className="h-5 w-5" />
          </Button>
        </div>

        {/* Initialization Status */}
        {(isInitializing || initializationError) && (
          <div className="mb-2 text-center">
            {isInitializing && (
              <p className="text-xs text-muted-foreground">Preparing...</p>
            )}
            {initializationError && (
              <p className="text-xs text-red-600">{initializationError}</p>
            )}
          </div>
        )}

        {/* Compact Secondary Controls */}
        <div className="flex items-center justify-center gap-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAudio}
            className={cn(
              "flex flex-col items-center gap-1 h-auto py-1 px-2",
              "touch-manipulation",
              isAudioEnabled ? "text-primary" : "text-muted-foreground"
            )}
          >
            {isAudioEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            <span className="text-xs">Audio</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {}} // Camera toggle would be handled by parent
            className={cn(
              "flex flex-col items-center gap-1 h-auto py-1 px-2",
              "touch-manipulation",
              canUseCamera ? "text-primary" : "text-muted-foreground"
            )}
          >
            {canUseCamera ? (
              <Camera className="h-4 w-4" />
            ) : (
              <CameraOff className="h-4 w-4" />
            )}
            <span className="text-xs">Camera</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileBreathingInterface;
