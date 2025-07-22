/**
 * Legacy Breathing Session Hook - Backward Compatibility
 * 
 * This is a compatibility shim that provides the old useBreathingSession API
 * while internally using the new enhanced session system.
 * 
 * @deprecated Use useEnhancedSession instead
 */

import { useState, useEffect, useCallback } from 'react';
import { useEnhancedSession } from './useEnhancedSession';
import { BreathingPattern } from '../lib/breathingPatterns';

// Legacy types for backward compatibility
export type SessionPhase = 'idle' | 'ready' | 'camera-setup' | 'breath-hold' | 'finished' | 'inhale' | 'hold' | 'exhale' | 'pause';

export interface BreathingSessionData {
  id?: string;
  user_id?: string;
  pattern_name: string;
  session_duration: number;
  created_at?: string;
  breath_hold_time?: number;
  restlessness_score?: number;
  lensId?: string | null;
}

export interface LegacySessionState {
  phase: SessionPhase;
  isRunning: boolean;
  isPaused: boolean;
  isFinished: boolean;
  currentCycle: number;
  cycleCount: number;
  breathHoldTime: number;
  sessionDuration: number;
  pattern: BreathingPattern;
  audioEnabled: boolean;
  error: string | null;
}

export interface LegacySessionControls {
  startSession: () => void;
  stopSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  selectPattern: (pattern: BreathingPattern) => void;
  toggleAudio: () => void;
  prepareSession: () => void;
}

/**
 * Legacy useBreathingSession hook for backward compatibility
 * @deprecated Use useEnhancedSession instead
 */
export const useBreathingSession = (
  initialPattern?: BreathingPattern,
  enableVisionFeedback: boolean = false
) => {
  console.warn('useBreathingSession is deprecated. Please migrate to useEnhancedSession.');
  
  const {
    initialize,
    start,
    pause,
    resume,
    stop,
    complete,
    state: enhancedState,
    updatePhase,
    incrementCycle,
    toggleAudio,
  } = useEnhancedSession();

  const [legacyState, setLegacyState] = useState<LegacySessionState>({
    phase: 'idle',
    isRunning: false,
    isPaused: false,
    isFinished: false,
    currentCycle: 0,
    cycleCount: 0,
    breathHoldTime: 0,
    sessionDuration: 0,
    pattern: initialPattern || {
      id: 'boxBreathing',
      name: 'Box Breathing',
      description: 'Equal timing for all phases',
      inhale: 4,
      hold: 4,
      exhale: 4,
      rest: 4,
      difficulty: 'beginner',
      benefits: ['Focus', 'Relaxation'],
    },
    audioEnabled: true,
    error: null,
  });

  // Map enhanced state to legacy state
  useEffect(() => {
    const phaseMap: Record<string, SessionPhase> = {
      'setup': 'idle',
      'initializing': 'camera-setup',
      'ready': 'ready',
      'active': 'inhale', // Default to inhale when active
      'paused': 'inhale', // Keep current phase when paused
      'complete': 'finished',
      'error': 'idle',
    };

    setLegacyState(prev => ({
      ...prev,
      phase: phaseMap[enhancedState.phase] || 'idle',
      isRunning: enhancedState.phase === 'active',
      isPaused: enhancedState.phase === 'paused',
      isFinished: enhancedState.phase === 'complete',
      cycleCount: enhancedState.sessionData.cycleCount,
      sessionDuration: enhancedState.sessionData.duration,
      audioEnabled: enhancedState.features.audio === 'active',
      error: enhancedState.error,
    }));
  }, [enhancedState]);

  // Legacy controls implementation
  const legacyControls: LegacySessionControls = {
    startSession: useCallback(async () => {
      try {
        if (enhancedState.phase === 'setup') {
          // Initialize first
          await initialize({
            pattern: {
              name: legacyState.pattern.name,
              phases: {
                inhale: legacyState.pattern.inhale,
                hold: legacyState.pattern.hold,
                exhale: legacyState.pattern.exhale,
                pause: legacyState.pattern.rest,
              },
              difficulty: legacyState.pattern.difficulty || 'medium',
              benefits: legacyState.pattern.benefits || [],
            },
            features: {
              enableCamera: enableVisionFeedback,
              enableAI: enableVisionFeedback,
              enableAudio: legacyState.audioEnabled,
            },
          });
        }
        await start();
      } catch (error) {
        console.error('Legacy session start failed:', error);
      }
    }, [initialize, start, legacyState.pattern, legacyState.audioEnabled, enableVisionFeedback, enhancedState.phase]),

    stopSession: useCallback(() => {
      stop();
    }, [stop]),

    pauseSession: useCallback(() => {
      pause();
    }, [pause]),

    resumeSession: useCallback(() => {
      resume();
    }, [resume]),

    selectPattern: useCallback((pattern: BreathingPattern) => {
      setLegacyState(prev => ({ ...prev, pattern }));
    }, []),

    toggleAudio: useCallback(() => {
      toggleAudio();
    }, [toggleAudio]),

    prepareSession: useCallback(async () => {
      // Legacy prepare - just initialize
      await initialize({
        pattern: {
          name: legacyState.pattern.name,
          phases: {
            inhale: legacyState.pattern.inhale,
            hold: legacyState.pattern.hold,
            exhale: legacyState.pattern.exhale,
            pause: legacyState.pattern.rest,
          },
          difficulty: legacyState.pattern.difficulty || 'medium',
          benefits: legacyState.pattern.benefits || [],
        },
        features: {
          enableCamera: enableVisionFeedback,
          enableAI: enableVisionFeedback,
          enableAudio: legacyState.audioEnabled,
        },
      });
    }, [initialize, legacyState.pattern, legacyState.audioEnabled, enableVisionFeedback]),
  };

  return {
    state: legacyState,
    controls: legacyControls,
  };
};