import React, { useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { useSession } from "../hooks/useSession";
import { BREATHING_PATTERNS, BreathingPattern } from "../lib/breathingPatterns";
import { useOfflineManager } from "../lib/offline/OfflineManager";

// Specialized components for different concerns
import {
  MeditationSession,
  MeditationSessionConfig,
} from "../components/session/MeditationSession";
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
      const actualSessionDuration = sessionDuration || elapsedTime / 1000;
      const calculatedDuration =
        (cycleCount *
          (pattern.inhale +
            pattern.hold +
            pattern.exhale +
            (pattern.hold_after_exhale || 0))) /
        1000;

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
 */
const BreathingSession: React.FC = () => {
  const location = useLocation();

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
  } = useSession();

  // Simple mode detection - determine if enhanced vision should be used
  const useEnhancedVision =
    location.pathname.includes("/enhanced") ||
    location.search.includes("enhanced=true");

  // Memoized session configuration - PERFORMANCE
  const sessionConfig: MeditationSessionConfig = useMemo(
    () => ({
      mode: useEnhancedVision ? "enhanced" : "classic",
      pattern: {
        name: initialPattern.name,
        phases: {
          inhale: initialPattern.inhale,
          hold: initialPattern.hold,
          exhale: initialPattern.exhale,
          pause: initialPattern.hold_after_exhale || 0,
        },
        difficulty: "intermediate",
        benefits: initialPattern.benefits,
      },
      autoStart: false,
    }),
    [initialPattern, useEnhancedVision]
  );

  // Session completion callback - CLEAN
  const onSessionComplete = useCallback(
    (metrics: any) => {
      handleSessionComplete({
        pattern: {
          id: initialPattern.id || "custom",
          name: initialPattern.name,
          ...initialPattern,
        },
        cycleCount: metrics?.cycleCount || 0,
        breathHoldTime: metrics?.breathHoldTime || 0,
        restlessnessScore: metrics?.restlessnessScore || 0,
        elapsedTime: metrics?.elapsedTime || metrics?.duration * 1000 || 0,
        phaseAccuracy: metrics?.phaseAccuracy || 0,
        rhythmConsistency: metrics?.rhythmConsistency || 0,
        sessionDuration: metrics?.sessionDuration || metrics?.duration || 0,
        patternName: metrics?.patternName || initialPattern.name,
      });
    },
    [handleSessionComplete, initialPattern]
  );

  return (
    <SessionErrorBoundary>
      <MeditationSession
        config={sessionConfig}
        onSessionComplete={onSessionComplete}
        onSessionExit={() => window.history.back()}
      />
    </SessionErrorBoundary>
  );
};

export default BreathingSession;
