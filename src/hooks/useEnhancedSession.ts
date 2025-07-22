/**
 * Enhanced Session Hook
 * 
 * Unified hook for managing breathing sessions with camera, AI, and audio features.
 * Provides clean API with automatic state management and error handling.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { sessionOrchestrator, SessionConfig, SessionState, SessionEvent } from '../lib/session/session-orchestrator';

export interface UseEnhancedSessionConfig extends SessionConfig {}

export interface UseEnhancedSessionReturn {
  // State
  state: SessionState;
  isReady: boolean;
  isActive: boolean;
  isPaused: boolean;
  isComplete: boolean;
  hasError: boolean;
  
  // Features
  cameraStream: MediaStream | null;
  canUseCamera: boolean;
  canUseAI: boolean;
  isAudioEnabled: boolean;
  
  // Actions
  initialize: (config: UseEnhancedSessionConfig) => Promise<void>;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  complete: () => void;
  
  // Controls
  toggleAudio: () => void;
  updatePhase: (phase: string) => void;
  incrementCycle: () => void;
  
  // Utilities
  getSessionDuration: () => string;
  getWarnings: () => string[];
  clearWarnings: () => void;
}

/**
 * Main enhanced session hook
 */
export const useEnhancedSession = (): UseEnhancedSessionReturn => {
  const [sessionState, setSessionState] = useState<SessionState>(sessionOrchestrator.getState());
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const eventCleanupRef = useRef<(() => void) | null>(null);

  /**
   * Handle session events
   */
  const handleSessionEvent = useCallback((event: SessionEvent) => {
    switch (event.type) {
      case 'state-change':
        if (event.state) {
          setSessionState(event.state);
        }
        break;

      case 'feature-change':
        if (event.feature === 'camera') {
          // Update camera stream when camera feature changes
          const stream = sessionOrchestrator.getCameraStream();
          setCameraStream(stream);
        }
        break;

      case 'error':
        console.error('Session error:', event.error);
        break;

      case 'warning':
        console.warn('Session warning:', event.warning);
        break;

      case 'ready':
        console.log('Session ready');
        break;

      case 'complete':
        console.log('Session complete');
        break;
    }
  }, []);

  /**
   * Setup event listener
   */
  useEffect(() => {
    eventCleanupRef.current = sessionOrchestrator.addEventListener(handleSessionEvent);
    
    // Update initial state
    setSessionState(sessionOrchestrator.getState());
    setCameraStream(sessionOrchestrator.getCameraStream());

    return () => {
      if (eventCleanupRef.current) {
        eventCleanupRef.current();
      }
    };
  }, [handleSessionEvent]);

  /**
   * Initialize session
   */
  const initialize = useCallback(async (config: UseEnhancedSessionConfig) => {
    try {
      await sessionOrchestrator.initialize(config);
    } catch (error) {
      console.error('Session initialization failed:', error);
      throw error;
    }
  }, []);

  /**
   * Start session
   */
  const start = useCallback(async () => {
    try {
      await sessionOrchestrator.start();
    } catch (error) {
      console.error('Session start failed:', error);
      throw error;
    }
  }, []);

  /**
   * Pause session
   */
  const pause = useCallback(() => {
    sessionOrchestrator.pause();
  }, []);

  /**
   * Resume session
   */
  const resume = useCallback(() => {
    sessionOrchestrator.resume();
  }, []);

  /**
   * Stop session
   */
  const stop = useCallback(() => {
    sessionOrchestrator.stop();
  }, []);

  /**
   * Complete session
   */
  const complete = useCallback(() => {
    sessionOrchestrator.complete();
  }, []);

  /**
   * Toggle audio
   */
  const toggleAudio = useCallback(() => {
    sessionOrchestrator.toggleAudio();
  }, []);

  /**
   * Update current breathing phase
   */
  const updatePhase = useCallback((phase: string) => {
    sessionOrchestrator.updatePhase(phase);
  }, []);

  /**
   * Increment cycle count
   */
  const incrementCycle = useCallback(() => {
    sessionOrchestrator.incrementCycle();
  }, []);

  /**
   * Format session duration for display
   */
  const getSessionDuration = useCallback((): string => {
    const totalSeconds = sessionState.sessionData.duration;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [sessionState.sessionData.duration]);

  /**
   * Get current warnings
   */
  const getWarnings = useCallback((): string[] => {
    return [...sessionState.warnings];
  }, [sessionState.warnings]);

  /**
   * Clear warnings (placeholder - would need to be implemented in orchestrator)
   */
  const clearWarnings = useCallback(() => {
    // Would need to implement clearWarnings in orchestrator
    console.log('Clear warnings not implemented yet');
  }, []);

  // Computed values
  const isReady = sessionState.phase === 'ready';
  const isActive = sessionState.phase === 'active';
  const isPaused = sessionState.phase === 'paused';
  const isComplete = sessionState.phase === 'complete';
  const hasError = sessionState.phase === 'error';
  
  const canUseCamera = sessionOrchestrator.isFeatureAvailable('camera');
  const canUseAI = sessionOrchestrator.isFeatureAvailable('ai');
  const isAudioEnabled = sessionState.features.audio === 'active';

  return {
    // State
    state: sessionState,
    isReady,
    isActive,
    isPaused,
    isComplete,
    hasError,
    
    // Features
    cameraStream,
    canUseCamera,
    canUseAI,
    isAudioEnabled,
    
    // Actions
    initialize,
    start,
    pause,
    resume,
    stop,
    complete,
    
    // Controls
    toggleAudio,
    updatePhase,
    incrementCycle,
    
    // Utilities
    getSessionDuration,
    getWarnings,
    clearWarnings,
  };
};

/**
 * Hook for session status only (lighter alternative)
 */
export const useSessionStatus = () => {
  const [sessionState, setSessionState] = useState<SessionState>(sessionOrchestrator.getState());

  useEffect(() => {
    const cleanup = sessionOrchestrator.addEventListener((event) => {
      if (event.type === 'state-change' && event.state) {
        setSessionState(event.state);
      }
    });

    // Update initial state
    setSessionState(sessionOrchestrator.getState());

    return cleanup;
  }, []);

  return {
    phase: sessionState.phase,
    isReady: sessionState.phase === 'ready',
    isActive: sessionState.phase === 'active',
    isPaused: sessionState.phase === 'paused',
    isComplete: sessionState.phase === 'complete',
    hasError: sessionState.phase === 'error',
    error: sessionState.error,
    warnings: sessionState.warnings,
    features: sessionState.features,
    sessionData: sessionState.sessionData,
  };
};

/**
 * Hook for session controls only
 */
export const useSessionControls = () => {
  return {
    start: useCallback(async () => {
      await sessionOrchestrator.start();
    }, []),
    
    pause: useCallback(() => {
      sessionOrchestrator.pause();
    }, []),
    
    resume: useCallback(() => {
      sessionOrchestrator.resume();
    }, []),
    
    stop: useCallback(() => {
      sessionOrchestrator.stop();
    }, []),
    
    complete: useCallback(() => {
      sessionOrchestrator.complete();
    }, []),
    
    toggleAudio: useCallback(() => {
      sessionOrchestrator.toggleAudio();
    }, []),
    
    updatePhase: useCallback((phase: string) => {
      sessionOrchestrator.updatePhase(phase);
    }, []),
    
    incrementCycle: useCallback(() => {
      sessionOrchestrator.incrementCycle();
    }, []),
  };
};

/**
 * Hook that ensures session is ready (throws if not ready)
 */
export const useReadySession = () => {
  const session = useEnhancedSession();
  
  if (!session.isReady && !session.isActive && !session.isPaused) {
    throw new Error('Session not ready');
  }
  
  return session;
};