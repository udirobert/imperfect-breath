import React, { useEffect } from "react";
import { Progress } from "../ui/progress";
import { cn } from "../../lib/utils";
import { useBreathingPhase } from "../../hooks/useBreathingPhase";

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

export const BreathingVisualizer: React.FC<BreathingVisualizerProps> = ({
  pattern,
  isActive,
}) => {
  const {
    phaseState,
    startCycle,
    stop,
    getPhaseInstruction,
    getPhaseColor,
    getCircleSize,
  } = useBreathingPhase();

  // Start/stop breathing cycle based on isActive prop
  useEffect(() => {
    if (isActive && !phaseState.isActive) {
      startCycle(pattern);
    } else if (!isActive && phaseState.isActive) {
      stop();
    }
  }, [isActive, phaseState.isActive, pattern, startCycle, stop]);

  // Calculate remaining time for countdown
  const getRemainingTime = (): number => {
    const remainingMs =
      phaseState.phaseDuration * 1000 * (1 - phaseState.phaseProgress / 100);
    return Math.ceil(remainingMs / 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Phase indicator */}
      <div className="text-center">
        <div className={cn("text-lg font-medium", getPhaseColor())}>
          {getPhaseInstruction()}
        </div>
        <div className="text-sm text-gray-500">
          Cycle: {phaseState.cycleCount}
        </div>
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
          <div className="text-4xl font-light">{getRemainingTime()}</div>
        </div>
      </div>

      {/* Progress bar - always visible for consistency */}
      <div className="w-full">
        <Progress
          value={phaseState.phaseProgress}
          className={cn(
            "h-2 transition-colors",
            phaseState.currentPhase === "inhale"
              ? "bg-blue-100"
              : phaseState.currentPhase === "hold"
              ? "bg-purple-100"
              : phaseState.currentPhase === "exhale"
              ? "bg-teal-100"
              : "bg-gray-100"
          )}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span className="capitalize">{phaseState.currentPhase}</span>
          <span>
            {pattern.phases.inhale}s
            {pattern.phases.hold ? `-${pattern.phases.hold}s` : ""}-
            {pattern.phases.exhale}s
            {pattern.phases.pause ? `-${pattern.phases.pause}s` : ""}
          </span>
        </div>
      </div>
    </div>
  );
};
