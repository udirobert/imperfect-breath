import React, { useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { useEnhancedSession } from "../hooks/useEnhancedSession";
import { BREATHING_PATTERNS, BreathingPattern } from "../lib/breathingPatterns";
import { useSessionFlow } from "../hooks/useSessionFlow";
import { useOfflineManager } from "../lib/offline/OfflineManager";

// Specialized components for different concerns
import { SessionOrchestrator } from "../components/session/SessionOrchestrator";
import { SessionErrorBoundary } from "../lib/errors/error-boundary";

/**
 * Modern BreathingSession Component
 *
 * CLEAN ARCHITECTURE PRINCIPLES:
 * - Single Responsibility: Only handles session coordination
 * - Dependency Injection: Services injected via hooks
 * - Interface Segregation: Uses focused, specific interfaces
 * - Open/Closed: Extensible without modification
 */

interface SessionConfig {
  pattern: BreathingPattern;
  features: {
    enableCamera: boolean;
    enableAI: boolean;
    enableAudio: boolean;
  };
  displayMode: "focus" | "awareness" | "analysis";
}

/**
 * Extract pattern initialization logic - DRY principle
 */
const usePatternInitialization = (location: ReturnType<typeof useLocation>) => {
  return useMemo(() => {
    // 1. Try navigation state (preview)
    if (location.state?.previewPattern) return location.state.previewPattern;

    // 2. Try localStorage
    try {
      const stored = localStorage.getItem("selectedPattern");
      if (stored) return JSON.parse(stored);
    } catch {
      // Silent fail for localStorage issues
    }

    // 3. Fallback to default free pattern
    return BREATHING_PATTERNS.box;
  }, [location.state?.previewPattern]);
};

/**
 * Session completion handler - extracted for reusability
 */
const useSessionCompletion = () => {
  const navigate = useNavigate();
  const { saveSession, syncStatus } = useOfflineManager();

  return useCallback(
    (sessionData: {
      pattern: BreathingPattern;
      cycleCount: number;
      breathHoldTime: number;
      restlessnessScore?: number;
      elapsedTime: number;
      phaseAccuracy?: number;
      rhythmConsistency?: number;
      sessionDuration?: number;
      patternName?: string;
    }) => {
      const {
        pattern,
        cycleCount,
        breathHoldTime,
        restlessnessScore,
        elapsedTime,
        phaseAccuracy,
        rhythmConsistency,
        sessionDuration,
        patternName,
      } = sessionData;

      // Use actual session duration if available, otherwise calculate from pattern
      const actualSessionDuration = sessionDuration || (elapsedTime / 1000);
      const calculatedDuration = (cycleCount * ((pattern.inhale + pattern.hold + pattern.exhale + pattern.rest))) / 1000;

      // Save session offline-first
      const sessionId = saveSession({
        patternId: pattern.id || "custom",
        patternName: pattern.name,
        startTime: new Date(Date.now() - elapsedTime),
        endTime: new Date(),
        duration: actualSessionDuration,
        cycleCount,
        breathHoldTime,
        restlessnessScore: restlessnessScore || 0,
        completed: true,
      });

      navigate("/results", {
        state: {
          breathHoldTime,
          restlessnessScore: restlessnessScore || 0,
          patternName: patternName || pattern.name,
          sessionDuration: actualSessionDuration,
          sessionId,
          isOffline: !syncStatus.isOnline,
          // Include the new performance metrics
          cycleCount,
          phaseAccuracy: sessionData.phaseAccuracy,
          rhythmConsistency: sessionData.rhythmConsistency,
          targetCycles: 10, // Default target, could be made configurable
        },
      });
    },
    [navigate, saveSession, syncStatus.isOnline]
  );
};

/**
 * Main BreathingSession Component
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Memoized pattern initialization
 * - Extracted completion handler
 * - Lazy component loading
 * - Minimal re-renders
 */
const BreathingSession: React.FC = () => {
  const location = useLocation();
  const sessionFlow = useSessionFlow();

  // Memoized pattern initialization - PERFORMANCE
  const initialPattern = usePatternInitialization(location);

  // Session completion handler - DRY
  const handleSessionComplete = useSessionCompletion();

  // Enhanced session management - MODERN
  const {
    state: sessionState,
    isReady,
    isActive,
    initialize,
    start,
    complete,
  } = useEnhancedSession();

  // Memoized session configuration - PERFORMANCE
  const sessionConfig = useMemo(
    (): SessionConfig => ({
      pattern: initialPattern,
      features: {
        enableCamera: sessionFlow.useEnhancedVision,
        enableAI: sessionFlow.useEnhancedVision,
        enableAudio: true, // Default to enabled
      },
      displayMode: sessionFlow.useEnhancedVision ? "analysis" : "focus",
    }),
    [initialPattern, sessionFlow.useEnhancedVision]
  );

  // Session completion callback - CLEAN
  const onSessionComplete = useCallback(
    (metrics: any) => {
      handleSessionComplete({
        pattern: sessionConfig.pattern,
        cycleCount: metrics?.cycleCount || sessionState.sessionData.cycleCount,
        breathHoldTime: metrics?.breathHoldTime || 0,
        restlessnessScore: metrics?.restlessnessScore || 0,
        elapsedTime: metrics?.elapsedTime || sessionState.sessionData.duration * 1000,
        // Include the new performance metrics
        phaseAccuracy: metrics?.phaseAccuracy || sessionState.sessionData.phaseAccuracy,
        rhythmConsistency: metrics?.rhythmConsistency || sessionState.sessionData.rhythmConsistency,
        sessionDuration: metrics?.sessionDuration || sessionState.sessionData.duration,
        patternName: metrics?.patternName || sessionConfig.pattern.name,
      });

      complete();
    },
    [
      handleSessionComplete,
      sessionConfig.pattern,
      sessionState.sessionData,
      complete,
    ]
  );

  return (
    <SessionErrorBoundary>
      <SessionOrchestrator
        config={sessionConfig}
        sessionFlow={sessionFlow}
        sessionState={sessionState}
        isReady={isReady}
        isActive={isActive}
        onInitialize={initialize}
        onStart={start}
        onComplete={onSessionComplete}
      />
    </SessionErrorBoundary>
  );
};

export default BreathingSession;
