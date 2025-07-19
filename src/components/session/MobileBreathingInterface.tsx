import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBreathingSession } from "@/hooks/useBreathingSession";
import BreathingAnimation from "@/components/BreathingAnimation";
import { BreathingPhaseName } from "@/lib/breathingPatterns";
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
  state: ReturnType<typeof useBreathingSession>["state"];
  controls: ReturnType<typeof useBreathingSession>["controls"];
  onEndSession: () => void;
  cameraEnabled?: boolean;
  onToggleCamera?: () => void;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
}

export const MobileBreathingInterface: React.FC<MobileBreathingInterfaceProps> = ({
  state,
  controls,
  onEndSession,
  cameraEnabled = false,
  onToggleCamera,
  voiceEnabled = true,
  onToggleVoice,
}) => {
  const isMobile = useIsMobile();

  // Only render on mobile
  if (!isMobile) {
    return null;
  }

  const progress = state.pattern.phases
    ? ((state.currentPhaseIndex + 1) / state.pattern.phases.length) * 100
    : 0;

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
      {/* Status Bar */}
      <div className="flex-shrink-0 px-4 py-3 bg-background/80 backdrop-blur">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{state.pattern.name}</span>
          <span className="text-muted-foreground">
            Cycle {state.cycleCount + 1}
          </span>
        </div>
        <Progress value={progress} className="mt-2 h-1" />
      </div>

      {/* Main Breathing Area */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Background Animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <BreathingAnimation
            phase={
              state.sessionPhase === "breath-hold"
                ? "hold"
                : (state.sessionPhase as BreathingPhaseName)
            }
            text={state.phaseText}
            className="scale-110" // Larger for mobile
          />
        </div>

        {/* Phase Text Overlay */}
        <div className="absolute top-1/4 left-0 right-0 text-center z-10">
          <h2 className="text-2xl font-light text-foreground/90 mb-2">
            {state.phaseText}
          </h2>
          {state.sessionPhase === "breath-hold" && (
            <p className="text-lg text-muted-foreground">
              {Math.floor(state.breathHoldTime / 1000)}s
            </p>
          )}
        </div>

        {/* Session Stats */}
        <div className="absolute bottom-1/4 left-0 right-0 px-8">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-background/60 backdrop-blur rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-lg font-semibold">
                {Math.floor(state.elapsedTime / 60000)}:
                {String(Math.floor((state.elapsedTime % 60000) / 1000)).padStart(2, "0")}
              </p>
            </div>
            <div className="bg-background/60 backdrop-blur rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Best Hold</p>
              <p className="text-lg font-semibold">
                {Math.floor(state.breathHoldTime / 1000)}s
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
            onClick={state.isRunning ? controls.pauseSession : controls.startSession}
            className={cn(
              "h-16 w-16 rounded-full",
              "touch-manipulation", // Optimize for touch
              state.isRunning
                ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            {state.isRunning ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={onEndSession}
            className="h-16 w-16 rounded-full touch-manipulation"
          >
            <Square className="h-6 w-6" />
          </Button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-center gap-6">
          {onToggleCamera && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCamera}
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-3",
                "touch-manipulation",
                cameraEnabled ? "text-primary" : "text-muted-foreground"
              )}
            >
              {cameraEnabled ? (
                <Camera className="h-5 w-5" />
              ) : (
                <CameraOff className="h-5 w-5" />
              )}
              <span className="text-xs">Camera</span>
            </Button>
          )}

          {onToggleVoice && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleVoice}
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-3",
                "touch-manipulation",
                voiceEnabled ? "text-primary" : "text-muted-foreground"
              )}
            >
              {voiceEnabled ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
              <span className="text-xs">Voice</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileBreathingInterface;