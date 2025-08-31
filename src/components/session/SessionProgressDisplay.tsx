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
  // ENHANCEMENT: Quality scoring props
  qualityScore?: number;
  stillnessScore?: number;
  consistencyScore?: number;
  showQualityMetrics?: boolean;
}

export const SessionProgressDisplay: React.FC<SessionProgressDisplayProps> =
  React.memo(
    ({
      patternName,
      duration,
      cycleCount,
      progressPercentage,
      className = "",
      qualityScore,
      stillnessScore,
      consistencyScore,
      showQualityMetrics = false,
    }) => {
      // ENHANCEMENT: Quality scoring calculations (PERFORMANT)
      const getQualityColor = (score?: number) => {
        if (!score) return "text-muted-foreground";
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-blue-600";
        if (score >= 40) return "text-yellow-600";
        return "text-red-600";
      };

      const getQualityLabel = (score?: number) => {
        if (!score) return "Calculating...";
        if (score >= 80) return "Excellent";
        if (score >= 60) return "Good";
        if (score >= 40) return "Fair";
        return "Needs Focus";
      };

      const overallQuality =
        qualityScore ||
        (stillnessScore && consistencyScore
          ? Math.round((stillnessScore + consistencyScore) / 2)
          : undefined);

      return (
        <div className={`space-y-4 ${className}`}>
          {/* Session Header - compact */}
          <div className="text-center">
            <p className="text-lg text-muted-foreground">{patternName}</p>
            <p className="text-3xl font-mono font-bold text-primary">
              {duration}
            </p>
            {/* ENHANCEMENT: Overall quality indicator */}
            {showQualityMetrics && overallQuality && (
              <div className="mt-2">
                <p
                  className={`text-sm font-medium ${getQualityColor(
                    overallQuality
                  )}`}
                >
                  {getQualityLabel(overallQuality)} Session
                </p>
                <p className="text-xs text-muted-foreground">
                  Quality Score: {overallQuality}/100
                </p>
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="w-full max-w-md space-y-2 mx-auto">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Cycle {cycleCount}</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
          </div>

          {/* ENHANCEMENT: Quality metrics display (MODULAR) */}
          {showQualityMetrics && (stillnessScore || consistencyScore) && (
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {stillnessScore && (
                <div className="text-center">
                  <div
                    className={`text-lg font-bold ${getQualityColor(
                      stillnessScore
                    )}`}
                  >
                    {Math.round(stillnessScore)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Stillness</div>
                </div>
              )}
              {consistencyScore && (
                <div className="text-center">
                  <div
                    className={`text-lg font-bold ${getQualityColor(
                      consistencyScore
                    )}`}
                  >
                    {Math.round(consistencyScore)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Consistency
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
  );

SessionProgressDisplay.displayName = "SessionProgressDisplay";
