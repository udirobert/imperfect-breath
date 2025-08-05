import React, { useState, useEffect, useRef } from "react";
import { Progress } from "../ui/progress";
import { cn } from "../../lib/utils";

interface BreathingVisualizerProps {
  pattern: {
    name: string;
    phases: {
      inhale: number;
      hold?: number;
      exhale: number;
      pause?: number;
    };
    difficulty: string;
    benefits: string[];
  };
  isActive: boolean;
}

type BreathPhase = "inhale" | "hold" | "exhale" | "pause";

export const BreathingVisualizer: React.FC<BreathingVisualizerProps> = ({
  pattern,
  isActive,
}) => {
  const [currentPhase, setCurrentPhase] = useState<BreathPhase>("inhale");
  const [progress, setProgress] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Calculate total cycle duration in ms
  const totalCycleDuration =
    (pattern.phases.inhale +
      (pattern.phases.hold || 0) +
      pattern.phases.exhale +
      (pattern.phases.pause || 0)) *
    1000;

  // Determine the current phase duration in ms
  const getCurrentPhaseDuration = (phase: BreathPhase): number => {
    switch (phase) {
      case "inhale":
        return pattern.phases.inhale * 1000;
      case "hold":
        return (pattern.phases.hold || 0) * 1000;
      case "exhale":
        return pattern.phases.exhale * 1000;
      case "pause":
        return (pattern.phases.pause || 0) * 1000;
      default:
        return 0;
    }
  };

  // Get the next phase in the breathing cycle
  const getNextPhase = (currentPhase: BreathPhase): BreathPhase => {
    switch (currentPhase) {
      case "inhale":
        return pattern.phases.hold && pattern.phases.hold > 0
          ? "hold"
          : "exhale";
      case "hold":
        return "exhale";
      case "exhale":
        return pattern.phases.pause && pattern.phases.pause > 0
          ? "pause"
          : "inhale";
      case "pause":
        return "inhale";
      default:
        return "inhale";
    }
  };

  // Animate the breathing cycle
  const animateBreathingCycle = (timestamp: number) => {
    if (!lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;
    }

    const elapsed = timestamp - lastTimestampRef.current;
    const currentPhaseDuration = getCurrentPhaseDuration(currentPhase);

    // Update progress within the current phase
    let newProgress = (elapsed / currentPhaseDuration) * 100;
    if (newProgress >= 100) {
      // Move to next phase
      const nextPhase = getNextPhase(currentPhase);
      setCurrentPhase(nextPhase);

      // Reset timestamp for new phase
      lastTimestampRef.current = timestamp;
      newProgress = 0;

      // If we've completed a full cycle
      if (
        (nextPhase === "inhale" && currentPhase === "pause") ||
        (nextPhase === "inhale" &&
          currentPhase === "exhale" &&
          !pattern.phases.pause)
      ) {
        setCycleCount((prev) => prev + 1);
      }
    }

    setProgress(newProgress);

    // Continue animation if active
    if (isActive) {
      animationRef.current = requestAnimationFrame(animateBreathingCycle);
    }
  };

  // Start/stop animation based on isActive prop
  useEffect(() => {
    if (isActive) {
      // Reset state when starting
      setCurrentPhase("inhale");
      setProgress(0);
      lastTimestampRef.current = null;
      animationRef.current = requestAnimationFrame(animateBreathingCycle);
    } else if (animationRef.current) {
      // Cancel animation when stopping
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  // Phase instruction text
  const getPhaseInstruction = (): string => {
    if (!isActive) {
      return "Get Ready";
    }

    switch (currentPhase) {
      case "inhale":
        return "Breathe In";
      case "hold":
        return "Hold";
      case "exhale":
        return "Breathe Out";
      case "pause":
        return "Rest";
      default:
        return "Breathe";
    }
  };

  // Visual size for the breathing circle
  const getCircleSize = (): string => {
    switch (currentPhase) {
      case "inhale":
        return `${60 + progress * 0.4}%`;
      case "hold":
        return "100%";
      case "exhale":
        return `${100 - progress * 0.4}%`;
      case "pause":
        return "60%";
      default:
        return "80%";
    }
  };

  // Color based on current phase
  const getPhaseColor = (): string => {
    switch (currentPhase) {
      case "inhale":
        return "text-blue-500 border-blue-400";
      case "hold":
        return "text-purple-500 border-purple-400";
      case "exhale":
        return "text-teal-500 border-teal-400";
      case "pause":
        return "text-gray-500 border-gray-400";
      default:
        return "text-blue-500 border-blue-400";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Phase indicator */}
      <div className="text-center">
        <div className={cn("text-lg font-medium", getPhaseColor())}>
          {getPhaseInstruction()}
        </div>
        <div className="text-sm text-gray-500">Cycle: {cycleCount}</div>
      </div>

      {/* Breathing circle visualization */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        <div
          className={cn(
            "rounded-full border-4 transition-all duration-300 flex items-center justify-center",
            getPhaseColor()
          )}
          style={{
            width: getCircleSize(),
            height: getCircleSize(),
          }}
        >
          <div className="text-4xl font-light">
            {Math.round(
              getCurrentPhaseDuration(currentPhase) / 1000 -
                (progress * getCurrentPhaseDuration(currentPhase)) / 100000
            )}
          </div>
        </div>
      </div>

      {/* Progress bar - always visible for consistency */}
      <div className="w-full">
        <Progress
          value={progress}
          className={cn(
            "h-2 transition-colors",
            currentPhase === "inhale"
              ? "bg-blue-100"
              : currentPhase === "hold"
              ? "bg-purple-100"
              : currentPhase === "exhale"
              ? "bg-teal-100"
              : "bg-gray-100"
          )}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span className="capitalize">{currentPhase}</span>
          <span>
            {pattern.phases.inhale}s
            {pattern.phases.hold ? `-${pattern.phases.hold}s` : ""}
            -{pattern.phases.exhale}s
            {pattern.phases.pause ? `-${pattern.phases.pause}s` : ""}
          </span>
        </div>
      </div>
    </div>
  );
};
