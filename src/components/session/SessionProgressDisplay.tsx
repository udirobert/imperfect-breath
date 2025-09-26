/**
 * Session Progress Display Component
 *
 * MEDITATION-FOCUSED: Clean inline display with stillness score as hero.
 * Positioned above video feed without blocking user's view of themselves.
 * 
 * Core Principles Applied:
 * - ENHANCEMENT FIRST: Enhanced existing component with stable metrics
 * - DRY: Uses single source of truth from useStableMetrics
 * - CLEAN: Simple, focused layout matching app theme
 * - PERFORMANT: Smooth transitions without flashing
 * - MEDITATION UX: Stillness score as hero, minimal distraction
 */

import React from "react";
import { useStableMetrics, useSmoothValue, getQualityLabel, getQualityColor } from "../../hooks/useStableMetrics";

interface SessionProgressDisplayProps {
  patternName: string;
  duration: string;
  cycleCount: number;
  progressPercentage: number;
  className?: string;
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
      showQualityMetrics = true,
    }) => {
      // DRY: Single source of truth for stable metrics
      const stableMetrics = useStableMetrics();
      
      // LUXURY: Smooth value transitions for ultra-smooth UX
      const smoothStillness = useSmoothValue(stableMetrics.stillnessScore, 1500);
      const smoothPresence = useSmoothValue(stableMetrics.presenceScore, 1200);
      const smoothCycle = useSmoothValue(cycleCount, 800);
      
      // MEDITATION-FOCUSED: Clean inline layout matching your preferred structure
      return (
        <div className={`space-y-2 text-center ${className}`}>
          {/* Pattern Name */}
          <p className="text-lg text-muted-foreground">{patternName}</p>
          
          {/* Duration - Prominent */}
          <p className="text-3xl font-mono font-bold text-primary transition-all duration-500">
            {duration}
          </p>
          
          {/* HERO: Live Stillness Score */}
          {showQualityMetrics && (
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Live Stillness Score
              </p>
              
              {/* HERO: Large Stillness Percentage */}
              <div className={`text-6xl font-bold transition-all duration-1500 ease-out ${
                getQualityColor(smoothStillness)
              }`}>
                {smoothStillness}%
              </div>
              
              {/* Quality Labels */}
              <p className="text-sm text-muted-foreground mt-2">
                {getQualityLabel(smoothStillness)} stillness • {getQualityLabel(smoothStillness)} focus
              </p>
              
              {/* Secondary Metrics - Only when stable */}
              {stableMetrics.isStable && stableMetrics.hasValidData && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Presence: {smoothPresence}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {Math.round(stableMetrics.confidence * 100)}%
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Cycle Information */}
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Cycle {smoothCycle}
            </p>
            
            {/* Progress Percentage - Secondary */}
            <p className="text-sm text-muted-foreground mt-1">
              {Math.round(progressPercentage)}%
            </p>
          </div>
        </div>
      );
    },
    // PERFORMANT: Custom comparison to prevent unnecessary re-renders
    (prevProps, nextProps) => {
      return (
        prevProps.patternName === nextProps.patternName &&
        prevProps.duration === nextProps.duration &&
        Math.abs(prevProps.cycleCount - nextProps.cycleCount) < 1 &&
        Math.abs(prevProps.progressPercentage - nextProps.progressPercentage) < 2 &&
        prevProps.showQualityMetrics === nextProps.showQualityMetrics
      );
    }
  );

SessionProgressDisplay.displayName = "SessionProgressDisplay";

// ============================================================================
// EXPORT - Clean meditation-focused component with stable metrics
// ============================================================================

export default SessionProgressDisplay;
