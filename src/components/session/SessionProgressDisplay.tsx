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
          {/* Session Header - enhanced with prominent stillness score */}
          <div className="text-center">
            <p className="text-lg text-muted-foreground">{patternName}</p>
            <p className="text-3xl font-mono font-bold text-primary">
              {duration}
            </p>

            {/* LUXURY: Ultra-smooth stillness score display with stability */}
            {showQualityMetrics && stillnessScore && stillnessScore > 5 && ( // Only show when meaningful
              <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200 transition-all duration-1000 ease-out">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-700">Live Stillness Score</span>
                </div>
                <div className={`text-4xl font-bold transition-all duration-1500 ease-out ${getQualityColor(stillnessScore)}`}>
                  {Math.round(stillnessScore)}%
                </div>
                <p className="text-xs text-blue-600 mt-2 transition-all duration-800 ease-out">
                  {getQualityLabel(stillnessScore)} stillness • {getQualityLabel(stillnessScore)} focus
                </p>
              </div>
            )}

            {/* ENHANCEMENT: Overall quality indicator (when no stillness score) */}
            {showQualityMetrics && overallQuality && !stillnessScore && (
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

          {/* AGGRESSIVE CONSOLIDATION: Removed duplicate stillness display */}
          {/* DRY: Only show consistency score if available and different from stillness */}
          {showQualityMetrics && consistencyScore && !stillnessScore && (
            <div className="text-center max-w-md mx-auto">
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
            </div>
          )}
        </div>
      );
    }
  );

SessionProgressDisplay.displayName = "SessionProgressDisplay";
