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
import { useVisionStore, MeditationMetrics } from '../stores/visionStore';

// ============================================================================
// CONSTANTS - Persistence configuration for luxury UX
// ============================================================================

const PERSISTENCE_CONFIG = {
  minDisplayTime: 2000,        // Minimum 2s display for readability
  fadeOutDelay: 1000,          // 1s delay before fade starts
  stabilityThreshold: 0.7,     // Confidence threshold for showing metrics
  confidenceHysteresis: 0.2,   // Prevent rapid on/off switching
  smoothingAlpha: 0.05,        // Ultra-smooth value transitions
};

// ============================================================================
// TYPES - Clean display state management
// ============================================================================

export type DisplayState = 'hidden' | 'appearing' | 'visible' | 'fading';

export interface StableMetricsResult {
  // Core metrics (always available, smoothed)
  stillnessScore: number;
  presenceScore: number;
  postureScore: number;
  restlessnessScore: number;
  
  // Display state
  displayState: DisplayState;
  isStable: boolean;
  confidence: number;
  
  // Raw metrics (for debugging)
  rawMetrics: MeditationMetrics | null;
  hasValidData: boolean;
}

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

  // PERFORMANT: Update persistent metrics with hysteresis
  useEffect(() => {
    const now = Date.now();
    
    if (isStable && smoothedMetrics) {
      // ENHANCEMENT: Update persistent metrics when stable
      setPersistentMetrics(prev => {
        if (!prev) return smoothedMetrics;
        
        // LUXURY: Smooth interpolation of values
        return {
          ...smoothedMetrics,
          stillness: useSmoothValue(smoothedMetrics.stillness, prev.stillness),
          presence: useSmoothValue(smoothedMetrics.presence, prev.presence),
          posture: useSmoothValue(smoothedMetrics.posture, prev.posture),
          restlessnessScore: smoothedMetrics.restlessnessScore ? 
            useSmoothValue(smoothedMetrics.restlessnessScore, prev.restlessnessScore || 0) : 
            prev.restlessnessScore,
        };
      });
      
      setLastValidTime(now);
      
      // Start display timer if not already started
      if (!displayStartTime) {
        setDisplayStartTime(now);
        setDisplayState('appearing');
      } else if (displayState === 'appearing') {
        setDisplayState('visible');
      }
    }
  }, [isStable, smoothedMetrics, displayStartTime, displayState, useSmoothValue]);

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

  // PERFORMANT: Memoized result to prevent unnecessary re-renders
  const result = useMemo((): StableMetricsResult => {
    // Use persistent metrics if available, otherwise fall back to current
    const metricsToUse = persistentMetrics || smoothedMetrics;
    
    return {
      // CLEAN: Always provide stable values (0 if no data)
      stillnessScore: Math.round(metricsToUse?.stillness || 0),
      presenceScore: Math.round(metricsToUse?.presence || 0),
      postureScore: Math.round(metricsToUse?.posture || 0),
      restlessnessScore: Math.round(metricsToUse?.restlessnessScore || 0),
      
      // Display state
      displayState,
      isStable,
      confidence: metricsToUse?.confidence || 0,
      
      // Debug info
      rawMetrics: smoothedMetrics,
      hasValidData: !!persistentMetrics,
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

/**
 * Quality label helper
 * DRY: Single source for quality descriptions
 */
export const getQualityLabel = (score: number): string => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Needs Focus';
  return 'Getting Started';
};

/**
 * Quality color helper
 * DRY: Single source for quality colors
 */
export const getQualityColor = (score: number): string => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 40) return 'text-yellow-400';
  if (score >= 20) return 'text-orange-400';
  return 'text-red-400';
};

export default useStableMetrics;