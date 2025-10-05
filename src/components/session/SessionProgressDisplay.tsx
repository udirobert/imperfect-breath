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
import { useStableMetrics, useSmoothValue } from "../../hooks/useStableMetrics";
import { getQualityLabel, getQualityColor } from "../../utils/quality";

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
      
      // LUXURY: Balanced, minimal layout with relaxing proportions
      return (
        <div className={`text-center ${className}`}>
          {/* Session Header - Elegant */}
          <div className="space-y-2 mb-6">
            <p className="text-lg font-medium text-muted-foreground">{patternName}</p>
            <p className="text-3xl font-mono font-bold text-primary tracking-wide">
              {duration}
            </p>
          </div>
          
          {/* Stillness Card - Balanced & Relaxing */}
          {showQualityMetrics && stableMetrics.hasValidData && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-6 mb-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="space-y-4">
                {/* Stillness Label - Minimal */}
                <p className="text-sm font-medium text-muted-foreground tracking-wide">
                  Stillness
                </p>
                
                {/* Stillness Score - Balanced size */}
                <div className={`text-4xl font-bold tracking-tight transition-all duration-1500 ease-out ${
                  getQualityColor(smoothStillness)
                }`}>
                  {smoothStillness}%
                </div>
                
                {/* Secondary Metrics - Clean when stable */}
                {stableMetrics.isStable && (
                  <div className="flex justify-center gap-6 text-sm text-muted-foreground pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span>Presence {smoothPresence}%</span>
                    <span>Confidence {Math.round(stableMetrics.confidence * 100)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Cycle & Progress - Relaxed spacing */}
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <span>Cycle {smoothCycle}</span>
            <span>{Math.round(progressPercentage || 0)}% complete</span>
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
