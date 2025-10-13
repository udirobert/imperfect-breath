/**
 * Session Mode Wrapper - Routes and configures sessions based on URL mode
 *
 * SINGLE RESPONSIBILITY: Parse URL mode and configure MeditationSession
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
import { BREATHING_PATTERNS } from "../../lib/breathingPatterns";
import { useSession } from "../../hooks/useSession";
import { isTouchDevice } from "../../utils/mobile-detection";
import { useOfflineManager } from "../../lib/offline/OfflineManager";
import {
  MeditationSession,
  MeditationSessionConfig,
} from "./MeditationSession";
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
      visionSessionId?: string;
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
          // UNIFIED: Include vision session ID for AI integration (DRY)
          visionSessionId: sessionData.visionSessionId,
        },
      });
    },
    [navigate, saveSession, syncStatus.isOnline]
  );
};

export const SessionModeWrapper: React.FC = () => {
  const { mode } = useParams<{ mode: "classic" | "enhanced" | "mobile" }>();
  const location = useLocation();
  const isMobile = isTouchDevice();

  // Validate mode
  if (!mode || !["classic", "enhanced", "mobile"].includes(mode)) {
    return <Navigate to="/session" replace />;
  }

  // CLEAN: Get pattern from URL search params, location state, or localStorage
  const initialPattern = useMemo(() => {
    console.log('🔍 Pattern resolution debug:', {
      fullURL: window.location.href,
      search: location.search,
      availablePatterns: Object.keys(BREATHING_PATTERNS)
    });

    // 1. Try URL search params first (e.g., ?pattern=wim_hof)
    const searchParams = new URLSearchParams(location.search);
    const patternParam = searchParams.get('pattern');
    console.log('🔍 Pattern param from URL:', patternParam);

    if (patternParam && BREATHING_PATTERNS[patternParam]) {
      console.log('📋 Using pattern from URL:', patternParam);
      return BREATHING_PATTERNS[patternParam];
    }

    // 2. Try navigation state
    if (location.state?.previewPattern) {
      console.log('📋 Using pattern from navigation state');
      return location.state.previewPattern;
    }

    // 3. Try localStorage
    try {
      const stored = localStorage.getItem("selectedPattern");
      if (stored) {
        console.log('📋 Using pattern from localStorage');
        return JSON.parse(stored);
      }
    } catch {
      // Silent fail for localStorage issues
    }

    // 4. Fallback to default
    console.log('📋 Using default box pattern');
    return BREATHING_PATTERNS.box;
  }, [location.search, location.state?.previewPattern]);

  // Session completion handler
  const handleSessionComplete = useSessionCompletion();

  // Session management using unified hook
  const {
    phase: sessionState,
    isActive,
    start,
    complete,
  } = useSession();

  // Determine session configuration based on mode
  // FIXED: Default to enhanced vision unless explicitly classic
  const useEnhancedVision = mode !== "classic";
  const useMobileInterface =
    mode === "mobile" || (isMobile && mode !== "classic");

  // Build configuration for MeditationSession
  const sessionConfig: MeditationSessionConfig = useMemo(
    () => ({
      mode:
        mode === "enhanced"
          ? "enhanced"
          : mode === "mobile"
          ? "mobile"
          : "classic",
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
        description: initialPattern.description,
      },
      autoStart: false,
      // CLEAN: Default session durations based on mode
      maxCycles: mode === "enhanced" ? 15 : mode === "mobile" ? 8 : 10,
    }),
    [initialPattern, mode]
  );

  // Session completion callback
  const onSessionComplete = useCallback(
    (metrics: any) => {
      handleSessionComplete({
        ...metrics,
        pattern: {
          id: initialPattern.id || "custom",
          name: initialPattern.name,
        },
        patternName: metrics?.patternName ?? initialPattern.name,
      });
      complete();
    },
    [handleSessionComplete, initialPattern, complete]
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

export default SessionModeWrapper;