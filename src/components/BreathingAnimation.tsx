import React from "react";
import { cn } from "../lib/utils";

interface BreathingAnimationProps {
  phase: "inhale" | "hold" | "exhale" | "rest" | "prepare" | "countdown";
  text?: string;
  pattern?: {
    name: string;
    phases: {
      inhale: number;
      hold?: number;
      exhale: number;
      pause?: number;
    };
  };
  isActive?: boolean;
  countdownValue?: number;
}

const BreathingAnimation = React.memo<BreathingAnimationProps>(
  ({ phase, text, pattern, isActive = false, countdownValue }) => {
    // Use the phase from session state - no internal timer needed
    const currentPhase = isActive ? phase : phase;

    // Get proper breathing instruction based on phase
    const getPhaseInstruction = (): string => {
      if (phase === "countdown" && countdownValue !== undefined) {
        return countdownValue > 0 ? countdownValue.toString() : "Begin";
      }

      if (text && text !== "prepare" && text !== phase) {
        return text;
      }

      const activePhase = currentPhase;

      switch (activePhase) {
        case "inhale":
          return "Breathe In";
        case "hold":
          return "Hold";
        case "exhale":
          return "Breathe Out";
        case "rest":
          return "Rest";
        case "prepare":
          return "Get Ready";
        case "countdown":
          return "Prepare";
        default:
          return "Breathe";
      }
    };

    // Get phase-specific styling
    const getPhaseColor = (): string => {
      if (phase === "countdown") {
        return "text-orange-500";
      }

      const activePhase = currentPhase;

      switch (activePhase) {
        case "inhale":
          return "text-blue-500";
        case "hold":
          return "text-purple-500";
        case "exhale":
          return "text-teal-500";
        case "rest":
          return "text-gray-500";
        case "prepare":
          return "text-orange-500";
        default:
          return "text-primary";
      }
    };

    // Get circle size based on phase
    const getCircleSize = (): string => {
      if (phase === "countdown") {
        return "80%";
      }

      if (!isActive) {
        return "80%";
      }

      const activePhase = currentPhase;

      switch (activePhase) {
        case "inhale":
          return "100%";
        case "hold":
          return "100%";
        case "exhale":
          return "60%";
        case "rest":
          return "60%";
        default:
          return "80%";
      }
    };

    return (
      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
        {/* Breathing circles with smooth transitions */}
        <div
          className={cn(
            "absolute rounded-full border-4 transition-all duration-300 ease-in-out",
            getPhaseColor().replace("text-", "border-"),
            "bg-gradient-to-r from-transparent to-primary/10"
          )}
          style={{
            width: getCircleSize(),
            height: getCircleSize(),
          }}
        />
        <div
          className={cn(
            "absolute rounded-full transition-all duration-500 ease-in-out",
            phase === "countdown" ? "bg-orange-100" : "bg-primary/5"
          )}
          style={{
            width: `${Math.max(20, parseInt(getCircleSize()) - 20)}%`,
            height: `${Math.max(20, parseInt(getCircleSize()) - 20)}%`,
          }}
        />

        {/* Center content */}
        <div className="z-10 text-center space-y-2">
          <p
            className={cn(
              "text-3xl md:text-4xl font-light transition-all duration-300",
              getPhaseColor()
            )}
          >
            {getPhaseInstruction()}
          </p>

          {/* Breathing rhythm indicator */}
          {isActive && pattern && phase !== "countdown" && (
            <div className="w-32 h-1 bg-gray-200 rounded-full mx-auto">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-in-out",
                  getPhaseColor().replace("text-", "bg-"),
                  currentPhase === "inhale" && "animate-pulse",
                  currentPhase === "exhale" && "animate-pulse"
                )}
                style={{
                  width:
                    currentPhase === "inhale" || currentPhase === "hold"
                      ? "100%"
                      : "20%",
                }}
              />
            </div>
          )}

          {/* Pattern info - only show when not active */}
          {!isActive && pattern && phase !== "countdown" && (
            <p className="text-xs text-muted-foreground opacity-70">
              {pattern.name}
            </p>
          )}
        </div>
      </div>
    );
  }
);

BreathingAnimation.displayName = "BreathingAnimation";

export default BreathingAnimation;
