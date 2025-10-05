/**
 * Unified Session State Store
 * 
 * SINGLE SOURCE OF TRUTH for all session state management.
 * Eliminates duplication across multiple session components and hooks.
 * 
 * Built with Zustand for clean, predictable state management.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { BreathingPattern } from '../lib/breathingPatterns';
import type { SessionPhase, BreathPhase, SessionMode, SessionMetrics, PerformanceMode, VisionMetrics } from '../types/metrics';

// ============================================================================
// SESSION-SPECIFIC TYPES - Session store specific interfaces
// ============================================================================

export interface SessionConfig {
  mode: SessionMode;
  pattern: BreathingPattern;
  enableCamera: boolean;
  enableAudio: boolean;
  enableAI: boolean;
}

// SessionMetrics now imported from types/metrics.ts

export interface SessionState {
  // Core session state
  phase: SessionPhase;
  config: SessionConfig | null;
  metrics: SessionMetrics;
  sessionId: string | null; // Stable session ID

  // Media state
  cameraStream: MediaStream | null;
  cameraPermissionGranted: boolean;
  audioEnabled: boolean;

  // Vision processing state
  visionActive: boolean;
  visionMetrics: VisionMetrics | null;

  // Error and warning state
  error: string | null;
  warnings: string[];

  // Performance state
  performanceMode: PerformanceMode;
}

// ============================================================================
// ACTIONS - Clean, focused state mutations
// ============================================================================

export interface SessionActions {
  // Session lifecycle
  initializeSession: (config: SessionConfig) => void;
  setSessionReady: () => void;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  completeSession: () => void;
  resetSession: () => void;

  // Phase management
  updateBreathPhase: (phase: BreathPhase, progress: number) => void;
  incrementCycle: () => void;

  // Pattern performance tracking
  updatePatternMetrics: (metrics: Partial<SessionMetrics>) => void;
  recordPatternPerformance: (patternId: string, completionRate: number, engagement: number) => void;

  // Media management
  setCameraStream: (stream: MediaStream | null) => void;
  setCameraPermission: (granted: boolean) => void;
  toggleAudio: () => void;

  // Vision processing
  setVisionActive: (active: boolean) => void;
  updateVisionMetrics: (metrics: VisionMetrics | null) => void;

  // Error handling
  setError: (error: string | null) => void;
  addWarning: (warning: string) => void;
  clearWarnings: () => void;

  // Performance
  setPerformanceMode: (mode: PerformanceMode) => void;

  // Utilities
  getSessionDuration: () => string;
  getCompletionPercentage: () => number;
  getSessionId: () => string | null;
}

// ============================================================================
// INITIAL STATE - Clean defaults
// ============================================================================

const initialMetrics: SessionMetrics = {
  duration: 0,
  cycleCount: 0,
  cameraUsed: false,
  sessionType: 'basic',
  currentPhase: 'inhale',
  phaseProgress: 0,
};

const initialState: SessionState = {
  phase: 'setup',
  config: null,
  metrics: initialMetrics,
  sessionId: null,
  cameraStream: null,
  cameraPermissionGranted: false,
  audioEnabled: true,
  visionActive: false,
  visionMetrics: null,
  error: null,
  warnings: [],
  performanceMode: 'optimal',
};

// ============================================================================
// STORE - Unified session state with clean actions
// ============================================================================

export const useSessionStore = create<SessionState & SessionActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Session lifecycle actions
    initializeSession: (config) => {
      const sessionId = `session_${Date.now()}`;
      set({
        config,
        sessionId,
        phase: 'setup',
        metrics: { ...initialMetrics, startTime: Date.now() },
        error: null,
        warnings: [],
      });
      
      // MODULAR: Notify error reporter of new session
      try {
        const { errorReporter } = require('../lib/errors/error-reporter');
        errorReporter.updateSessionId(sessionId);
      } catch {
        // Graceful fallback if error reporter not available
      }
      
      console.log('🔧 Session initialized with ID:', sessionId);
    },

    setSessionReady: () => {
      set({
        phase: 'ready',
        error: null,
      });
    },

    startSession: () => {
      const state = get();
      if (state.config) {
        const startTime = Date.now();
        set({
          phase: 'active',
          metrics: {
            ...state.metrics,
            startTime,
            currentPhase: 'inhale', // Ensure we start with inhale
            phaseProgress: 0,
            cycleCount: 0,
          },
          error: null,
        });
        console.log('🚀 Session started with timestamp:', startTime);
      }
    },

    pauseSession: () => {
      set((state) => ({
        phase: state.phase === 'active' ? 'paused' : state.phase,
      }));
    },

    resumeSession: () => {
      set((state) => ({
        phase: state.phase === 'paused' ? 'active' : state.phase,
      }));
    },

    completeSession: () => {
      set({
        phase: 'complete',
        visionActive: false,
      });
    },

    resetSession: () => {
      // NOTE: Camera stream cleanup is now handled by cameraManager
      // We only reset the store state, not the actual camera stream
      console.log('🔄 SessionStore: Resetting session state (camera stream managed by cameraManager)');

      set({
        ...initialState,
        // Preserve camera permission for better UX
        cameraPermissionGranted: get().cameraPermissionGranted,
      });
    },

    // Phase management
    updateBreathPhase: (phase, progress) => {
      set((state) => {
        const currentDuration = state.metrics.startTime ?
          Math.floor((Date.now() - state.metrics.startTime) / 1000) :
          state.metrics.duration;

        const roundedProgress = Math.round(progress);

        // Debug logging for phase updates
        const phaseChanged = state.metrics.currentPhase !== phase;
        const progressChanged = Math.abs((state.metrics.phaseProgress || 0) - roundedProgress) >= 1; // Reduced threshold
        const durationChanged = state.metrics.duration !== currentDuration;

        if (phaseChanged) {
          console.log(`🔄 Phase changed: ${state.metrics.currentPhase} → ${phase}`);
        }

        // Always update if phase changed, or if progress/duration changed
        if (phaseChanged || progressChanged || durationChanged) {
          return {
            metrics: {
              ...state.metrics,
              currentPhase: phase,
              phaseProgress: roundedProgress,
              duration: currentDuration,
            },
          };
        }

        return state; // No significant change
      });
    },

    incrementCycle: () => {
      set((state) => {
        const newCycleCount = state.metrics.cycleCount + 1;
        console.log(`🔄 Cycle incremented: ${state.metrics.cycleCount} → ${newCycleCount}`);
        return {
          metrics: {
            ...state.metrics,
            cycleCount: newCycleCount,
          },
        };
      });
    },

    // Media management
    setCameraStream: (stream) => {
      set({ cameraStream: stream });
    },

    setCameraPermission: (granted) => {
      set({ cameraPermissionGranted: granted });
    },

    toggleAudio: () => {
      set((state) => ({ audioEnabled: !state.audioEnabled }));
    },

    // Vision processing
    setVisionActive: (active) => {
      set({ visionActive: active });
    },

    updateVisionMetrics: (metrics) => {
      set((state) => {
        // Only update if metrics actually changed
        const currentMetrics = state.visionMetrics;
        if (currentMetrics && metrics &&
          currentMetrics.stillness === metrics.stillness &&
          currentMetrics.presence === metrics.presence &&
          currentMetrics.posture === metrics.posture) {
          return state; // No change, don't trigger re-render
        }
        return { visionMetrics: metrics };
      });
    },

    // Error handling
    setError: (error) => {
      set({ error });
    },

    addWarning: (warning) => {
      set((state) => ({
        warnings: [...state.warnings, warning],
      }));
    },

    clearWarnings: () => {
      set({ warnings: [] });
    },

    // Performance
    setPerformanceMode: (mode) => {
      set({ performanceMode: mode });
    },

    // Pattern performance tracking
    updatePatternMetrics: (metrics) => {
      set((state) => ({
        metrics: {
          ...state.metrics,
          ...metrics,
        },
      }));
    },

    recordPatternPerformance: (patternId, completionRate, engagement) => {
      const effectivenessScore = (completionRate + engagement) / 2;
      set((state) => ({
        metrics: {
          ...state.metrics,
          patternId,
          completionRate,
          userEngagement: engagement,
          effectivenessScore,
        },
      }));
    },

    // Utilities
    getSessionDuration: () => {
      const { metrics } = get();
      const totalSeconds = metrics.duration;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    getCompletionPercentage: () => {
      const { metrics, config } = get();
      if (!config) return 0;

      // Estimate completion based on typical 5-minute session
      const targetDuration = 300; // 5 minutes
      const percentage = Math.min((metrics.duration / targetDuration) * 100, 100);
      // Fix floating point precision issues
      return Math.round(percentage * 100) / 100;
    },

    getSessionId: () => {
      return get().sessionId;
    },
  }))
);

// ============================================================================
// SELECTORS - Optimized state access
// ============================================================================

export const sessionSelectors = {
  // Core state
  isActive: () => useSessionStore((state) => state.phase === 'active'),
  isPaused: () => useSessionStore((state) => state.phase === 'paused'),
  isComplete: () => useSessionStore((state) => state.phase === 'complete'),

  // Session info
  currentMode: () => useSessionStore((state) => state.config?.mode || 'basic'),
  currentPattern: () => useSessionStore((state) => state.config?.pattern),

  // Media state
  hasCameraStream: () => useSessionStore((state) => !!state.cameraStream),
  canUseCamera: () => useSessionStore((state) =>
    state.cameraPermissionGranted && !!state.cameraStream
  ),

  // Vision state
  hasVisionMetrics: () => useSessionStore((state) => !!state.visionMetrics),
  visionReady: () => useSessionStore((state) =>
    state.visionActive && !!state.visionMetrics
  ),

  // Performance state
  isOptimalPerformance: () => useSessionStore((state) =>
    state.performanceMode === 'optimal'
  ),

  // Pattern performance state
  currentPatternId: () => useSessionStore((state) => state.metrics.patternId),
  patternCompletionRate: () => useSessionStore((state) => state.metrics.completionRate),
  patternEngagement: () => useSessionStore((state) => state.metrics.userEngagement),
  patternEffectiveness: () => useSessionStore((state) => state.metrics.effectivenessScore),

  // Error state
  hasError: () => useSessionStore((state) => !!state.error),
  hasWarnings: () => useSessionStore((state) => state.warnings.length > 0),
};

// ============================================================================
// HOOKS - Clean, focused hooks for components
// ============================================================================

export const useSessionPhase = () => useSessionStore((state) => state.phase);
export const useSessionMetrics = () => useSessionStore((state) => state.metrics);
export const useSessionConfig = () => useSessionStore((state) => state.config);
export const useSessionError = () => useSessionStore((state) => state.error);
export const useVisionState = () => useSessionStore((state) => ({
  active: state.visionActive,
  metrics: state.visionMetrics,
}));

// Pattern performance hooks
export const usePatternPerformance = () => useSessionStore((state) => ({
  patternId: state.metrics.patternId,
  completionRate: state.metrics.completionRate,
  engagement: state.metrics.userEngagement,
  effectiveness: state.metrics.effectivenessScore,
}));

export default useSessionStore;
