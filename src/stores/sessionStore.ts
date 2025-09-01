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

// ============================================================================
// TYPES - Clean, meditation-focused state structure
// ============================================================================

export type SessionPhase = 'setup' | 'preparation' | 'ready' | 'active' | 'paused' | 'complete';
export type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'pause';
export type SessionMode = 'basic' | 'enhanced';

export interface SessionConfig {
  mode: SessionMode;
  pattern: BreathingPattern;
  enableCamera: boolean;
  enableAudio: boolean;
  enableAI: boolean;
}

export interface SessionMetrics {
  duration: number; // seconds
  cycleCount: number;
  currentPhase: BreathPhase;
  phaseProgress: number; // 0-100
  stillnessScore?: number; // 0-100
  breathQuality?: number; // 0-100
  startTime?: number;
}

export interface SessionState {
  // Core session state
  phase: SessionPhase;
  config: SessionConfig | null;
  metrics: SessionMetrics;
  
  // Media state
  cameraStream: MediaStream | null;
  cameraPermissionGranted: boolean;
  audioEnabled: boolean;
  
  // Vision processing state
  visionActive: boolean;
  visionMetrics: {
    stillness: number;
    presence: number;
    posture: number;
    restlessnessScore?: number;
    faceLandmarks?: Array<{ x: number; y: number; z?: number }>;
  } | null;
  
  // Error and warning state
  error: string | null;
  warnings: string[];
  
  // Performance state
  performanceMode: 'optimal' | 'balanced' | 'minimal';
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
  
  // Media management
  setCameraStream: (stream: MediaStream | null) => void;
  setCameraPermission: (granted: boolean) => void;
  toggleAudio: () => void;
  
  // Vision processing
  setVisionActive: (active: boolean) => void;
  updateVisionMetrics: (metrics: SessionState['visionMetrics']) => void;
  
  // Error handling
  setError: (error: string | null) => void;
  addWarning: (warning: string) => void;
  clearWarnings: () => void;
  
  // Performance
  setPerformanceMode: (mode: SessionState['performanceMode']) => void;
  
  // Utilities
  getSessionDuration: () => string;
  getCompletionPercentage: () => number;
}

// ============================================================================
// INITIAL STATE - Clean defaults
// ============================================================================

const initialMetrics: SessionMetrics = {
  duration: 0,
  cycleCount: 0,
  currentPhase: 'inhale',
  phaseProgress: 0,
};

const initialState: SessionState = {
  phase: 'setup',
  config: null,
  metrics: initialMetrics,
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
      set({
        config,
        phase: 'setup',
        metrics: { ...initialMetrics, startTime: Date.now() },
        error: null,
        warnings: [],
      });
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
        set({
          phase: 'active',
          metrics: {
            ...state.metrics,
            startTime: Date.now(),
          },
          error: null,
        });
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
      const { cameraStream } = get();
      // Cleanup camera stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
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
        
        // Only update if values actually changed
        if (state.metrics.currentPhase === phase && 
            Math.abs(state.metrics.phaseProgress - progress) < 1 &&
            state.metrics.duration === currentDuration) {
          return state; // No significant change
        }
        
        return {
          metrics: {
            ...state.metrics,
            currentPhase: phase,
            phaseProgress: Math.round(progress), // Round to prevent micro-updates
            duration: currentDuration,
          },
        };
      });
    },

    incrementCycle: () => {
      set((state) => ({
        metrics: {
          ...state.metrics,
          cycleCount: state.metrics.cycleCount + 1,
        },
      }));
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
        if (currentMetrics && 
            currentMetrics.stillness === metrics?.stillness &&
            currentMetrics.presence === metrics?.presence &&
            currentMetrics.posture === metrics?.posture &&
            currentMetrics.restlessnessScore === metrics?.restlessnessScore) {
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
      return Math.min((metrics.duration / targetDuration) * 100, 100);
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

export default useSessionStore;