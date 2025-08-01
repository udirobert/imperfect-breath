/**
 * Session Progress Display Component
 *
 * Focused component for displaying session progress, duration, and cycle count
 * Extracted from SessionInProgress for better organization and reusability.
 */

import React from "react";
import { Progress } from "../ui/progress";

interface SessionProgressDisplayProps {
  patternName: string;
  duration: string;
  cycleCount: number;
  progressPercentage: number;
  className?: string;
}

export const SessionProgressDisplay: React.FC<SessionProgressDisplayProps> =
  React.memo(
    ({
      patternName,
      duration,
      cycleCount,
      progressPercentage,
      className = "",
    }) => {
      return (
        <div className={`space-y-4 ${className}`}>
          {/* Session Header - compact */}
          <div className="text-center">
            <p className="text-lg text-muted-foreground">{patternName}</p>
            <p className="text-3xl font-mono font-bold text-primary">
              {duration}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="w-full max-w-md space-y-2 mx-auto">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Cycle {cycleCount}</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
          </div>
        </div>
      );
    }
  );

SessionProgressDisplay.displayName = "SessionProgressDisplay";
