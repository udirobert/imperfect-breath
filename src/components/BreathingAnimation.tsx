import React, { useMemo } from "react";
import { cn } from "../lib/utils";
import {
  getPhaseConfig,
  isExpandedPhase,
  shouldShowRhythmIndicator,
} from "../lib/breathing-phase-config";

interface BreathingAnimationProps {
  phase:
    | "inhale"
    | "hold"
    | "exhale"
    | "hold_after_exhale"
    | "prepare"
    | "countdown";
  text?: string;
  pattern?: {
    name: string;
    phases: {
      inhale: number;
      hold?: number;
      exhale: number;
      hold_after_exhale?: number;
    };
  };
  isActive?: boolean;
  countdownValue?: number;
  phaseProgress?: number;
}

const BreathingAnimation = React.memo<BreathingAnimationProps>(
  ({ phase, text, pattern, isActive = false, countdownValue, phaseProgress = 0 }) => {
    const phaseConfig = useMemo(() => getPhaseConfig(phase), [phase]);

    const instruction = useMemo(() => {
      if (phase === "countdown" && countdownValue !== undefined) {
        return countdownValue > 0 ? countdownValue.toString() : "Begin";
      }
      if (text && text !== "prepare" && text !== phase) {
        return text;
      }
      return phaseConfig.instruction;
    }, [phase, text, countdownValue, phaseConfig.instruction]);

    const circleSize = useMemo(() => {
      return !isActive || phase === "countdown" ? "80%" : phaseConfig.size;
    }, [isActive, phase, phaseConfig.size]);

    const BackgroundCircle = () => (
      <div
        className="absolute rounded-full bg-blue-50/30 transition-all duration-1000 ease-in-out"
        style={{
          width: `${Math.min(120, parseInt(circleSize) + 20)}%`,
          height: `${Math.min(120, parseInt(circleSize) + 20)}%`,
        }}
      />
    );

    const MainCircle = () => (
      <div
        className="absolute rounded-full bg-blue-50/20 border border-blue-200/40 transition-all duration-1000 ease-in-out"
        style={{
          width: circleSize,
          height: circleSize,
        }}
      />
    );

    const RhythmIndicator = () => (
      <div className="w-40 h-2 bg-blue-100/40 rounded-full mx-auto">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-100 ease-linear bg-gradient-to-r",
            phaseConfig.rhythmGradient
          )}
          style={{
            width: `${Math.max(5, phaseProgress)}%`,
          }}
        />
      </div>
    );

    const CenterContent = () => (
      <div className="z-10 text-center space-y-3">
        <p
          className={cn(
            "text-3xl md:text-4xl font-light transition-all duration-500",
            phaseConfig.color
          )}
        >
          {instruction}
        </p>

        {shouldShowRhythmIndicator(isActive, pattern, phase) && (
          <RhythmIndicator />
        )}

        {!isActive && pattern && phase !== "countdown" && (
          <p className="text-sm text-muted-foreground opacity-80 font-medium">
            {pattern.name}
          </p>
        )}
      </div>
    );

    return (
      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
        <BackgroundCircle />
        <MainCircle />
        <CenterContent />
      </div>
    );
  }
);

BreathingAnimation.displayName = "BreathingAnimation";

export default BreathingAnimation;
