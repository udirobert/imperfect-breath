/**
 * Session Mode Wrapper - Routes and configures sessions based on URL mode
 *
 * SINGLE RESPONSIBILITY: Parse URL mode and configure SessionOrchestrator
 * CLEAN: Separates routing logic from session logic
 * MODULAR: Easy to extend with new session modes
 */

import React, { useCallback, useMemo } from "react";
import {
  useParams,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useIsMobile } from "../../hooks/use-mobile";
import { BREATHING_PATTERNS } from "../../lib/breathingPatterns";
import { useEnhancedSession } from "../../hooks/useEnhancedSession";
import { useOfflineManager } from "../../lib/offline/OfflineManager";
import SessionOrchestrator from "./SessionOrchestrator";
import { SessionErrorBoundary } from "../../lib/errors/error-boundary";

/**
 * Session completion handler - extracted for reusability
 */
const useSessionCompletion = () => {
  const navigate = useNavigate();
  const { saveSession, syncStatus } = useOfflineManager();

  return useCallback(
    (sessionData: {
      pattern: any;
      cycleCount: number;
      breathHoldTime: number;
      restlessnessScore?: number;
      elapsedTime: number;
      phaseAccuracy?: number;
      rhythmConsistency?: number;
      sessionDuration?: number;
      patternName?: string;
      sessionType?: string;
      cameraUsed?: boolean;
      aiUsed?: boolean;
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
          cycleCount,
          phaseAccuracy,
          rhythmConsistency,
          targetCycles: 10,
          // Preserve session metadata
          sessionType: sessionData.sessionType,
          cameraUsed: sessionData.cameraUsed,
          aiUsed: sessionData.aiUsed,
        },
      });
    },
    [navigate, saveSession, syncStatus.isOnline]
  );
};

export const SessionModeWrapper: React.FC = () => {
  const { mode } = useParams<{ mode: "classic" | "enhanced" | "mobile" }>();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Validate mode
  if (!mode || !["classic", "enhanced", "mobile"].includes(mode)) {
    return <Navigate to="/session" replace />;
  }

  // Get pattern from location state or localStorage, fallback to box
  const initialPattern = useMemo(() => {
    // Try navigation state first
    if (location.state?.previewPattern) return location.state.previewPattern;

    // Try localStorage
    try {
      const stored = localStorage.getItem("selectedPattern");
      if (stored) return JSON.parse(stored);
    } catch {
      // Silent fail for localStorage issues
    }

    // Fallback to default
    return BREATHING_PATTERNS.box;
  }, [location.state?.previewPattern]);

  // Session completion handler
  const handleSessionComplete = useSessionCompletion();

  // Enhanced session management
  const {
    state: sessionState,
    isReady,
    isActive,
    initialize,
    start,
    complete,
  } = useEnhancedSession();

  // Determine session configuration based on mode
  const useEnhancedVision = mode === "enhanced";
  const useMobileInterface =
    mode === "mobile" || (isMobile && mode === "enhanced");

  // Build configuration for SessionOrchestrator
  const sessionConfig = useMemo(
    () => ({
      pattern: initialPattern,
      features: {
        enableCamera: useEnhancedVision,
        enableAI: useEnhancedVision,
        enableAudio: true,
      },
      displayMode: useEnhancedVision
        ? ("analysis" as const)
        : ("focus" as const),
    }),
    [initialPattern, useEnhancedVision]
  );

  const sessionFlow = useMemo(
    () => ({
      mode: mode as "classic" | "enhanced" | "mobile",
      shouldBypassSetup: false,
      useEnhancedVision,
      useMobileInterface,
      defaultPattern: undefined,
    }),
    [mode, useEnhancedVision, useMobileInterface]
  );

  // Session completion callback - pass through all metrics to avoid data loss
  const onSessionComplete = useCallback(
    (metrics: any) => {
      // Pass through all metrics and add pattern info
      handleSessionComplete({
        ...metrics, // Preserve all fields from the session
        pattern: sessionConfig.pattern,
        // Only override specific fields if they're missing
        cycleCount: metrics?.cycleCount ?? sessionState.sessionData.cycleCount,
        elapsedTime:
          metrics?.elapsedTime ?? sessionState.sessionData.duration * 1000,
        sessionDuration:
          metrics?.sessionDuration ?? sessionState.sessionData.duration,
        patternName: metrics?.patternName ?? sessionConfig.pattern.name,
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

export default SessionModeWrapper;
