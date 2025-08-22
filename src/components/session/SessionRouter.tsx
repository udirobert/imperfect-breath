/**
 * Session Router - Migration Component
 *
 * Routes sessions to the unified MeditationSession component.
 */

import React from "react";
import {
  MeditationSession,
  MeditationSessionConfig,
  SessionMetrics,
} from "./MeditationSession";

import { BREATHING_PATTERNS } from "../../lib/breathingPatterns";

interface SessionRouterProps {
  mode?: "basic" | "enhanced" | "legacy";
  patternName?: string;
  onSessionComplete?: (metrics: SessionMetrics) => void;
  onSessionExit?: () => void;

  // Legacy props for backward compatibility
  config?: any;
  sessionFlow?: any;
  sessionState?: any;
  isReady?: boolean;
  isActive?: boolean;
  onInitialize?: any;
  onStart?: any;
  onComplete?: any;
}

export const SessionRouter: React.FC<SessionRouterProps> = ({
  mode = "enhanced",
  patternName = "box",
  onSessionComplete,
  onSessionExit,
}) => {
  // Use new unified session component
  const pattern = BREATHING_PATTERNS[patternName] || BREATHING_PATTERNS.box;

  const sessionConfig: MeditationSessionConfig = {
    mode:
      mode === "legacy" ? "classic" : mode === "basic" ? "classic" : "enhanced",
    pattern: {
      name: pattern.name,
      phases: {
        inhale: pattern.inhale,
        hold: pattern.hold,
        exhale: pattern.exhale,
        pause: pattern.hold_after_exhale || 0,
      },
      difficulty: "intermediate",
      benefits: pattern.benefits,
    },
    autoStart: false,
  };

  return (
    <MeditationSession
      config={sessionConfig}
      onSessionComplete={onSessionComplete}
      onSessionExit={onSessionExit}
    />
  );
};

export default SessionRouter;
