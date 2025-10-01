/**
 * Stable Metrics Hook
 * 
 * SINGLE SOURCE OF TRUTH for UI-stable metrics that prevent flashing.
 * Consolidates existing smoothing logic with persistence for luxury UX.
 * 
 * Core Principles Applied:
 * - DRY: Single source for stable metrics across all components
 * - PERFORMANT: Memoized calculations with minimal re-renders
 * - CLEAN: Clear separation of display vs. processing metrics
 * - LUXURY: Smooth transitions with minimum display time
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useVisionStore } from '../stores/visionStore';
import type { MeditationMetrics, StableMetricsResult, DisplayState, MetricsConfig } from '../types/metrics';

// ============================================================================
// CONSTANTS - Persistence configuration for luxury UX
// ============================================================================

const PERSISTENCE_CONFIG: MetricsConfig = {
  minDisplayTime: 2000,        // Minimum 2s display for readability
  fadeOutDelay: 1000,          // 1s delay before fade starts
  stabilityThreshold: 0.7,     // Confidence threshold for showing metrics
  confidenceHysteresis: 0.2,   // Prevent rapid on/off switching
  smoothingAlpha: 0.05,        // Ultra-smooth value transitions
};

// ============================================================================
// CUSTOM HOOK - Stable metrics with persistence
// ============================================================================

export const useStableMetrics = (): StableMetricsResult => {
  // CLEAN: Subscribe to smoothed metrics only (single source of truth)
  const smoothedMetrics = useVisionStore(state => state.smoothedMetrics);
  const detectionHistory = useVisionStore(state => state.detectionHistory);
  const isActive = useVisionStore(state => state.isActive);
  
  // PERFORMANT: Local state for persistence logic
  const [persistentMetrics, setPersistentMetrics] = useState<MeditationMetrics | null>(null);
  const [displayStartTime, setDisplayStartTime] = useState<number | null>(null);
  const [lastValidTime, setLastValidTime] = useState<number | null>(null);
  const [displayState, setDisplayState] = useState<DisplayState>('hidden');

  // CLEAN: Memoized stability calculation
  const isStable = useMemo(() => {
    if (!smoothedMetrics || !isActive) return false;
    
    // Check confidence and recent detection history
    const hasGoodConfidence = smoothedMetrics.confidence >= PERSISTENCE_CONFIG.stabilityThreshold;
    const recentDetections = detectionHistory.slice(-3); // Last 3 frames
    const stableDetection = recentDetections.length >= 2 && 
                           recentDetections.filter(Boolean).length >= 2;
    
    return hasGoodConfidence && stableDetection && smoothedMetrics.faceDetected;
  }, [smoothedMetrics, detectionHistory, isActive]);

  // LUXURY: Smooth value interpolation for ultra-smooth transitions
  const useSmoothValue = useCallback((
    targetValue: number, 
    currentValue: number, 
    alpha: number = PERSISTENCE_CONFIG.smoothingAlpha
  ): number => {
    if (currentValue === 0) return targetValue; // First value
    return currentValue + alpha * (targetValue - currentValue);
  }, []);

  // HONEST SMOOTHING: Prevent flashing while reflecting real data
  useEffect(() => {
    const now = Date.now();
    
    if (isStable && smoothedMetrics && smoothedMetrics.faceDetected) {
      // HONEST: Apply gentle smoothing only to real data to prevent flashing
      setPersistentMetrics(prev => {
        if (!prev) return smoothedMetrics;
        
        // HONEST SMOOTHING: Only smooth when we have real data from both frames
        if (prev.faceDetected && smoothedMetrics.faceDetected) {
          return {
            ...smoothedMetrics,
            // Gentle smoothing to prevent UI flashing, but still reflects real changes
            stillness: prev.stillness + (smoothedMetrics.stillness - prev.stillness) * 0.3,
            presence: prev.presence + (smoothedMetrics.presence - prev.presence) * 0.4,
            posture: prev.posture + (smoothedMetrics.posture - prev.posture) * 0.3,
            restlessnessScore: smoothedMetrics.restlessnessScore ? 
              prev.restlessnessScore + (smoothedMetrics.restlessnessScore - (prev.restlessnessScore || 0)) * 0.3 :
              prev.restlessnessScore,
          };
        }
        
        // If face detection state changed, use new data directly
        return smoothedMetrics;
      });
      
      setLastValidTime(now);
      
      // Start display timer if not already started
      if (!displayStartTime) {
        setDisplayStartTime(now);
        setDisplayState('appearing');
      } else if (displayState === 'appearing') {
        setDisplayState('visible');
      }
    } else if (!smoothedMetrics || !smoothedMetrics.faceDetected) {
      // HONEST: Graceful fade when face lost, but don't show fake data
      if (persistentMetrics && displayState === 'visible') {
        setDisplayState('fading');
        // Clear after fade delay
        setTimeout(() => {
          setPersistentMetrics(null);
          setDisplayState('hidden');
          setDisplayStartTime(null);
        }, 1000);
      } else {
        setPersistentMetrics(null);
        setDisplayState('hidden');
        setDisplayStartTime(null);
      }
    }
  }, [isStable, smoothedMetrics, displayStartTime, displayState, persistentMetrics]);

  // CLEAN: Display state management with minimum display time
  useEffect(() => {
    if (!isActive) {
      setDisplayState('hidden');
      setDisplayStartTime(null);
      setLastValidTime(null);
      return;
    }

    const now = Date.now();
    
    // Handle fade out logic
    if (displayState === 'visible' && !isStable && lastValidTime) {
      const timeSinceLastValid = now - lastValidTime;
      const timeSinceDisplayStart = displayStartTime ? now - displayStartTime : 0;
      
      // Only fade if we've shown for minimum time and grace period has passed
      if (timeSinceDisplayStart >= PERSISTENCE_CONFIG.minDisplayTime && 
          timeSinceLastValid >= PERSISTENCE_CONFIG.fadeOutDelay) {
        setDisplayState('fading');
        
        // Hide after fade duration
        setTimeout(() => {
          setDisplayState('hidden');
          setDisplayStartTime(null);
        }, 1000); // 1s fade duration
      }
    }
  }, [isStable, displayState, lastValidTime, displayStartTime, isActive]);

  // HONEST: Memoized result with real data only
  const result = useMemo((): StableMetricsResult => {
    // HONEST: Only use metrics when we actually have face detection
    const metricsToUse = persistentMetrics && persistentMetrics.faceDetected ? persistentMetrics : null;
    
    return {
      // HONEST: Show 0 when no real data available
      stillnessScore: Math.round(metricsToUse?.stillness || 0),
      presenceScore: Math.round(metricsToUse?.presence || 0),
      postureScore: Math.round(metricsToUse?.posture || 0),
      
      // Display state
      displayState: metricsToUse ? displayState : 'hidden',
      isStable: isStable && !!metricsToUse,
      confidence: metricsToUse?.confidence || 0,
      
      // Debug info
      rawMetrics: smoothedMetrics,
      hasValidData: !!metricsToUse,
    };
  }, [persistentMetrics, smoothedMetrics, displayState, isStable]);

  return result;
};

// ============================================================================
// UTILITY HOOKS - Additional stable metric utilities
// ============================================================================

/**
 * Hook for smooth number transitions in UI
 * LUXURY: Provides smooth animated value changes
 */
export const useSmoothValue = (targetValue: number, duration: number = 1500) => {
  const [displayValue, setDisplayValue] = useState(targetValue);
  
  useEffect(() => {
    if (targetValue === displayValue) return;
    
    const startValue = displayValue;
    const difference = targetValue - startValue;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // PERFORMANT: Smooth easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (difference * easeOut);
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [targetValue, duration, displayValue]);
  
  return Math.round(displayValue);
};

// ============================================================================
// QUALITY UTILITIES - Re-exported from utils for backward compatibility
// ============================================================================

// ORGANIZED: Quality utilities moved to src/utils/quality.ts
// Re-export for backward compatibility during transition
export { getQualityLabel, getQualityColor } from '../utils/quality';

export default useStableMetrics;