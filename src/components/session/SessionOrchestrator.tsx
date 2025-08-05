import React, { useEffect, useCallback, useMemo } from "react";
import { BreathingPattern } from "../../lib/breathingPatterns";
import { mapPatternForAnimation } from "../../lib/session/pattern-mapper";
import { useIsMobile } from "../../hooks/use-mobile";

// Import specialized session components
import { SessionSetup } from "./SessionSetup";
import { SessionInProgress } from "./SessionInProgress";
import { ClassicBreathingSession } from "./ClassicBreathingSession";
import { MobileBreathingInterface } from "./MobileBreathingInterface";
import { UnifiedBreathingSession } from "./UnifiedBreathingSession";

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

// Pattern mapping now handled by centralized utility

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
      pattern: {
        name: config.pattern.name,
        phases: {
          inhale: config.pattern.inhale,
          hold: config.pattern.hold,
          exhale: config.pattern.exhale,
          pause: config.pattern.rest,
        },
        difficulty: "intermediate",
        benefits: config.pattern.benefits,
      },
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
        <UnifiedBreathingSession
          pattern={{
            name: config.pattern.name,
            phases: {
              inhale: config.pattern.inhale,
              hold: config.pattern.hold,
              exhale: config.pattern.exhale,
              pause: config.pattern.rest,
            },
            difficulty: "intermediate",
            benefits: config.pattern.benefits,
          }}
          mode="enhanced"
          onSessionComplete={onComplete}
        />
      );
    }

    // Mobile-optimized interface
    if (sessionFlow.useMobileInterface && isMobile) {
      return (
        <MobileBreathingInterface
          onEndSession={() => {
            // Get session data from orchestrator and pass it to completion handler
            const sessionData = sessionState.sessionData;
            onComplete({
              breathHoldTime: 0, // Default for now
              restlessnessScore: 0, // Default for now
              cycleCount: sessionData.cycleCount,
              elapsedTime: sessionData.duration * 1000, // Convert to milliseconds
            });
          }}
          patternName={config.pattern.name}
        />
      );
    }

    // Classic desktop breathing interface - clean and focused
    // No camera, no AI, just pure breathing practice
    return (
      <ClassicBreathingSession
        patternName={config.pattern.name}
        onSessionComplete={(metrics) => {
          onComplete({
            ...metrics,
            // Classic sessions have no camera-based metrics
            breathHoldTime: 0,
            restlessnessScore: 0,
            // Ensure sessionType is preserved
            sessionType: "classic",
            cameraUsed: false,
            aiUsed: false,
          });
        }}
      />
    );
  };

  return <div className="w-full h-full">{renderSessionUI()}</div>;
};

export default SessionOrchestrator;
