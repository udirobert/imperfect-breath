import React, { useEffect, useCallback, useMemo } from "react";
import { BreathingPattern } from "../../lib/breathingPatterns";
import { useIsMobile } from "../../hooks/use-mobile";

// Import specialized session components
import { SessionSetup } from "./SessionSetup";
import { SessionInProgress } from "./SessionInProgress";
import { MobileBreathingInterface } from "./MobileBreathingInterface";
import { EnhancedDualViewBreathingSession } from "../vision/EnhancedDualViewBreathingSession";

/**
 * SessionOrchestrator - Centralized Session Flow Management
 *
 * SINGLE RESPONSIBILITY: Orchestrates different session UI flows
 * OPEN/CLOSED: Easy to extend with new session types
 * DEPENDENCY INVERSION: Depends on abstractions, not concrete implementations
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

interface SessionFlow {
  mode: "quick" | "enhanced" | "classic" | "mobile";
  shouldBypassSetup: boolean;
  useEnhancedVision: boolean;
  useMobileInterface: boolean;
  defaultPattern?: string;
}

interface SessionState {
  phase: string;
  sessionData: {
    cycleCount: number;
    duration: number;
    currentPhase: string;
  };
  features: {
    camera: string;
    ai: string;
    audio: string;
  };
  warnings: string[];
  error: string | null;
}

interface SessionOrchestratorProps {
  config: SessionConfig;
  sessionFlow: SessionFlow;
  sessionState: SessionState;
  isReady: boolean;
  isActive: boolean;
  onInitialize: (config: any) => Promise<void>;
  onStart: () => Promise<void>;
  onComplete: (metrics: any) => void;
}

/**
 * Enhanced pattern mapping for vision components
 */
const mapPatternForVision = (pattern: BreathingPattern) => ({
  name: pattern.name,
  phases: {
    inhale: pattern.inhale,
    hold: pattern.hold,
    exhale: pattern.exhale,
    pause: pattern.rest,
  },
  difficulty: "intermediate", // Could be derived from pattern complexity
  benefits: pattern.benefits,
});

/**
 * Session initialization logic - extracted for reusability
 */
const useSessionInitialization = (
  config: SessionConfig,
  sessionFlow: SessionFlow,
  onInitialize: (config: any) => Promise<void>
) => {
  const initializeSession = useCallback(async () => {
    const sessionConfig = {
      pattern: mapPatternForVision(config.pattern),
      features: {
        enableCamera: config.features.enableCamera,
        enableAI: config.features.enableAI && config.features.enableCamera, // AI requires camera
        enableAudio: config.features.enableAudio,
      },
      cameraSettings: {
        displayMode: config.displayMode,
        quality: "medium" as const,
      },
    };

    await onInitialize(sessionConfig);
  }, [config, onInitialize]);

  // Auto-initialize for quick start
  useEffect(() => {
    if (sessionFlow.shouldBypassSetup) {
      initializeSession().catch(console.error);
    }
  }, [sessionFlow.shouldBypassSetup, initializeSession]);

  return { initializeSession };
};

/**
 * Main SessionOrchestrator Component
 */
export const SessionOrchestrator: React.FC<SessionOrchestratorProps> = ({
  config,
  sessionFlow,
  sessionState,
  isReady,
  isActive,
  onInitialize,
  onStart,
  onComplete,
}) => {
  const isMobile = useIsMobile();

  // Session initialization logic
  const { initializeSession } = useSessionInitialization(
    config,
    sessionFlow,
    onInitialize
  );

  // Memoized session controls - PERFORMANCE
  const sessionControls = useMemo(
    () => ({
      startSession: onStart,
      initializeSession,
    }),
    [onStart, initializeSession]
  );

  // Determine which UI to render based on session state and flow
  const renderSessionUI = () => {
    // Enhanced Vision Session (takes precedence when explicitly requested)
    if (sessionFlow.useEnhancedVision) {
      return (
        <EnhancedDualViewBreathingSession
          pattern={mapPatternForVision(config.pattern)}
          onSessionComplete={onComplete}
        />
      );
    }

    // Mobile-optimized interface
    if (sessionFlow.useMobileInterface && isMobile) {
      return (
        <MobileBreathingInterface
          onEndSession={() => onComplete({})}
          patternName={config.pattern.name}
        />
      );
    }

    // Default desktop breathing interface - simplified for now
    // This provides the core breathing experience without complex camera setup
    return (
      <SessionInProgress
        handleEndSession={() => onComplete({})}
        videoRef={{ current: null }}
        showVideoFeed={false} // Disable video feed for now to avoid complexity
        isTracking={false}
        restlessnessScore={0}
        landmarks={[]}
        trackingStatus="IDLE"
        cameraInitialized={false}
        cameraRequested={false}
        onRequestCamera={async () => {
          console.log(
            "Camera functionality will be implemented in future iteration"
          );
        }}
        patternName={config.pattern.name}
      />
    );
  };

  return <div className="w-full h-full">{renderSessionUI()}</div>;
};

export default SessionOrchestrator;
