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
    }) => {
      const {
        pattern,
        cycleCount,
        breathHoldTime,
        restlessnessScore,
        elapsedTime,
      } = sessionData;

      // Calculate session duration based on pattern properties
      const oneCycleDuration =
        (pattern.inhale + pattern.hold + pattern.exhale + pattern.rest) * 1000;
      const sessionDuration = (cycleCount * oneCycleDuration) / 1000;

      // Save session offline-first
      const sessionId = saveSession({
        patternId: pattern.id || "custom",
        patternName: pattern.name,
        startTime: new Date(Date.now() - elapsedTime),
        endTime: new Date(),
        duration: sessionDuration,
        cycleCount,
        breathHoldTime,
        restlessnessScore: restlessnessScore || 0,
        completed: true,
      });

      navigate("/results", {
        state: {
          breathHoldTime,
          restlessnessScore: restlessnessScore || 0,
          patternName: pattern.name,
          sessionDuration,
          sessionId,
          isOffline: !syncStatus.isOnline,
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
        cycleCount: sessionState.sessionData.cycleCount,
        breathHoldTime: metrics?.breathHoldTime || 0,
        restlessnessScore: metrics?.restlessnessScore,
        elapsedTime: sessionState.sessionData.duration * 1000,
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
