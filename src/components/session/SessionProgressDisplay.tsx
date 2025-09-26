/**
 * Session Progress Display Component
 *
 * ENHANCED: Persistent overlay with luxury UX and stable metrics.
 * Eliminates flashing through always-visible structure with smooth transitions.
 * 
 * Core Principles Applied:
 * - ENHANCEMENT FIRST: Enhanced existing component instead of creating new
 * - AGGRESSIVE CONSOLIDATION: Removed conditional rendering causing flashing
 * - DRY: Uses single source of truth from useStableMetrics
 * - PERFORMANT: Memoized with custom comparison to prevent unnecessary re-renders
 * - LUXURY: Smooth transitions with persistent display
 */

import React, { useMemo } from "react";
import { Progress } from "../ui/progress";
import { useStableMetrics, useSmoothValue, getQualityLabel, getQualityColor } from "../../hooks/useStableMetrics";

interface SessionProgressDisplayProps {
  patternName: string;
  duration: string;
  cycleCount: number;
  progressPercentage: number;
  className?: string;
  // ENHANCEMENT: Simplified props - metrics come from stable hook
  showQualityMetrics?: boolean;
  // LUXURY: Display mode options
  displayMode?: 'overlay' | 'inline';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
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
      displayMode = 'overlay',
      position = 'top-right',
    }) => {
      // DRY: Single source of truth for stable metrics
      const stableMetrics = useStableMetrics();
      
      // LUXURY: Smooth value transitions for ultra-smooth UX
      const smoothStillness = useSmoothValue(stableMetrics.stillnessScore, 1500);
      const smoothPresence = useSmoothValue(stableMetrics.presenceScore, 1200);
      const smoothCycle = useSmoothValue(cycleCount, 800);
      
      // PERFORMANT: Memoized position classes
      const positionClasses = useMemo(() => {
        const positions = {
          'top-right': 'top-4 right-4',
          'top-left': 'top-4 left-4',
          'bottom-right': 'bottom-4 right-4',
          'bottom-left': 'bottom-4 left-4',
        };
        return positions[position];
      }, [position]);
      
      // CLEAN: Memoized display state classes
      const displayClasses = useMemo(() => {
        const baseClasses = "transition-all duration-1000 ease-out";
        
        switch (stableMetrics.displayState) {
          case 'appearing':
            return `${baseClasses} opacity-70 scale-95 translate-y-2`;
          case 'visible':
            return `${baseClasses} opacity-100 scale-100 translate-y-0`;
          case 'fading':
            return `${baseClasses} opacity-40 scale-95 translate-y-1`;
          case 'hidden':
          default:
            return `${baseClasses} opacity-0 scale-90 translate-y-4 pointer-events-none`;
        }
      }, [stableMetrics.displayState]);
      
      // LUXURY: Overlay mode with persistent display
      if (displayMode === 'overlay') {
        return (
          <div className={`fixed ${positionClasses} z-50 ${displayClasses}`}>
            <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 text-white shadow-2xl border border-white/10">
              <div className="space-y-3 min-w-[200px]">
                {/* Session Header */}
                <div className="text-center">
                  <div className="text-lg font-medium text-white/90">{patternName}</div>
                  <div className="text-3xl font-mono font-bold text-white transition-all duration-500">
                    {duration}
                  </div>
                </div>
                
                {/* LUXURY: Always-visible stillness score with smooth transitions */}
                {showQualityMetrics && (
                  <div className="border-t border-white/20 pt-3">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                        stableMetrics.isStable ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
                      }`}></div>
                      <span className="text-sm font-medium text-white/70">Live Stillness Score</span>
                    </div>
                    
                    <div className={`text-4xl font-bold transition-all duration-1500 ease-out ${
                      getQualityColor(smoothStillness).replace('text-', 'text-')
                    }`}>
                      {smoothStillness}%
                    </div>
                    
                    <div className="text-sm text-white/60 mt-2 transition-all duration-800 ease-out">
                      {getQualityLabel(smoothStillness)} stillness • {getQualityLabel(smoothStillness)} focus
                    </div>
                    
                    {/* ENHANCEMENT: Additional metrics when stable */}
                    {stableMetrics.isStable && stableMetrics.hasValidData && (
                      <div className="mt-3 pt-2 border-t border-white/10">
                        <div className="flex justify-between text-xs text-white/50">
                          <span>Presence: {smoothPresence}%</span>
                          <span>Confidence: {Math.round(stableMetrics.confidence * 100)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Cycle Information */}
                <div className="border-t border-white/20 pt-3">
                  <div className="text-sm text-white/70 transition-all duration-500">
                    Cycle {smoothCycle}
                  </div>
                  
                  {/* ENHANCEMENT: Progress indicator in overlay */}
                  <div className="mt-2">
                    <div className="w-full bg-white/20 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-green-400 h-1.5 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-white/50 mt-1 text-right">
                      {Math.round(progressPercentage)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      
      // CLEAN: Inline mode (enhanced existing layout)
      return (
        <div className={`space-y-4 ${className}`}>
          {/* Session Header */}
          <div className="text-center">
            <p className="text-lg text-muted-foreground">{patternName}</p>
            <p className="text-3xl font-mono font-bold text-primary transition-all duration-500">
              {duration}
            </p>

            {/* ENHANCEMENT: Always-visible metrics with smooth transitions */}
            {showQualityMetrics && (
              <div className={`mt-3 p-4 rounded-xl border transition-all duration-1000 ease-out ${
                stableMetrics.isStable 
                  ? 'bg-gradient-to-r from-blue-50 to-green-50 border-blue-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    stableMetrics.isStable ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-sm font-medium text-blue-700">Live Stillness Score</span>
                </div>
                
                <div className={`text-4xl font-bold transition-all duration-1500 ease-out ${
                  getQualityColor(smoothStillness)
                }`}>
                  {smoothStillness}%
                </div>
                
                <p className="text-xs text-blue-600 mt-2 transition-all duration-800 ease-out">
                  {getQualityLabel(smoothStillness)} stillness • {getQualityLabel(smoothStillness)} focus
                </p>
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="w-full max-w-md space-y-2 mx-auto">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Cycle {smoothCycle}</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
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
        prevProps.showQualityMetrics === nextProps.showQualityMetrics &&
        prevProps.displayMode === nextProps.displayMode &&
        prevProps.position === nextProps.position
      );
    }
  );

SessionProgressDisplay.displayName = "SessionProgressDisplay";

// ============================================================================
// EXPORT - Enhanced component with stable metrics
// ============================================================================

export default SessionProgressDisplay;
