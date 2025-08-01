/**
 * Shared Session Initialization Hook
 * 
 * Centralizes session initialization logic to maintain DRY principles
 * and ensure consistent session setup across mobile and desktop interfaces.
 */

import { useState, useEffect, useCallback } from 'react';
import { BreathingPattern, BREATHING_PATTERNS } from '../lib/breathingPatterns';
import { mapPatternForSession } from '../lib/session/pattern-mapper';
import { useEnhancedSession } from './useEnhancedSession';

interface SessionInitializationConfig {
  pattern?: BreathingPattern;
  enableCamera?: boolean;
  enableAI?: boolean;
  enableAudio?: boolean;
}

interface SessionInitializationReturn {
  isInitializing: boolean;
  initializationError: string | null;
  isReady: boolean;
  sessionConfig: any;
  initializeSession: () => Promise<void>;
}

/**
 * Hook for managing session initialization with consistent configuration
 */
export const useSessionInitialization = (
  config: SessionInitializationConfig = {}
): SessionInitializationReturn => {
  const {
    pattern = BREATHING_PATTERNS.box,
    enableCamera = false,
    enableAI = false,
    enableAudio = true,
  } = config;

  const { state, initialize, isReady } = useEnhancedSession();
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  // Memoized session configuration
  const sessionConfig = {
    pattern: mapPatternForSession(pattern),
    features: {
      enableCamera,
      enableAI: enableAI && enableCamera, // AI requires camera
      enableAudio,
    },
    cameraSettings: {
      displayMode: "focus" as const,
      quality: "medium" as const,
    },
  };

  const initializeSession = useCallback(async () => {
    // Only initialize if we're in setup phase and not already initializing
    if (state.phase !== "setup" || isInitializing) return;

    try {
      setIsInitializing(true);
      setInitializationError(null);

      await initialize(sessionConfig);
    } catch (error) {
      const errorMessage = (error as Error).message;
      // Don't show error if session is already initialized
      if (!errorMessage.includes("already initialized")) {
        console.error("Session initialization failed:", error);
        setInitializationError(errorMessage);
      }
    } finally {
      setIsInitializing(false);
    }
  }, [state.phase, isInitializing, initialize, sessionConfig]);

  // Auto-initialize when component mounts
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  return {
    isInitializing,
    initializationError,
    isReady,
    sessionConfig,
    initializeSession,
  };
};

/**
 * Specialized hook for mobile session initialization
 */
export const useMobileSessionInitialization = (pattern?: BreathingPattern) => {
  return useSessionInitialization({
    pattern,
    enableCamera: false, // Disable camera by default for mobile
    enableAI: false,
    enableAudio: true,
  });
};

/**
 * Specialized hook for desktop session initialization
 */
export const useDesktopSessionInitialization = (pattern?: BreathingPattern) => {
  return useSessionInitialization({
    pattern,
    enableCamera: false, // Disable camera by default for desktop
    enableAI: false,
    enableAudio: true,
  });
};