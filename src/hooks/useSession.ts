/**
 * Unified Session Hook
 * 
 * REPLACES: useEnhancedSession + useSessionFlow + multiple session hooks
 * 
 * Provides a clean, simple interface for session management
 * backed by the unified session store.
 */

import { useEffect, useCallback, useRef } from 'react';
import { 
  useSessionStore, 
  sessionSelectors, 
  useSessionPhase,
  useSessionMetrics,
  useSessionConfig,
  SessionConfig 
} from '../stores/sessionStore';
import { useMeditationVision } from './useMeditationVision';

export interface UseSessionOptions {
  autoStart?: boolean;
  enableVision?: boolean;
  targetFPS?: number;
}

export const useSession = (options: UseSessionOptions = {}) => {
  const {
    autoStart = false,
    enableVision = false,
    targetFPS = 2,
  } = options;

  // Store actions
  const {
    initializeSession,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    resetSession,
    updateBreathPhase,
    incrementCycle,
    setCameraStream,
    setCameraPermission,
    toggleAudio,
    setVisionActive,
    updateVisionMetrics,
    setError,
    getSessionDuration,
    getCompletionPercentage,
  } = useSessionStore();

  // Store state
  const phase = useSessionPhase();
  const metrics = useSessionMetrics();
  const config = useSessionConfig();
  
  // Selectors for optimized re-renders
  const isActive = sessionSelectors.isActive();
  const isPaused = sessionSelectors.isPaused();
  const isComplete = sessionSelectors.isComplete();
  const audioEnabled = useSessionStore((state) => state.audioEnabled);
  const cameraStream = useSessionStore((state) => state.cameraStream);
  const visionMetrics = useSessionStore((state) => state.visionMetrics);

  // Vision processing (conditional)
  const vision = useMeditationVision(
    enableVision ? {
      sessionId: `session_${Date.now()}`,
      targetFPS,
      silentMode: true,
      gracefulDegradation: true,
    } : undefined
  );

  // Breathing phase timer
  const phaseTimerRef = useRef<NodeJS.Timeout>();
  const cycleTimerRef = useRef<NodeJS.Timeout>();

  // ========================================================================
  // CAMERA MANAGEMENT - Clean, unified
  // ========================================================================

  const requestCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 30 }
        }
      });
      
      setCameraStream(stream);
      setCameraPermission(true);
      
      // Start vision if enabled
      if (enableVision && vision) {
        setVisionActive(true);
        // Vision hook will handle the video element connection
      }
      
      return stream;
    } catch (error) {
      console.warn('Camera access denied:', error);
      setCameraPermission(false);
      setError('Camera access was denied. Continuing without camera tracking.');
      return null;
    }
  }, [enableVision, vision, setCameraStream, setCameraPermission, setVisionActive, setError]);

  // ========================================================================
  // BREATHING CYCLE MANAGEMENT - Clean timing
  // ========================================================================

  const startBreathingCycle = useCallback(() => {
    if (!config?.pattern) {
      return;
    }
    
    const { pattern } = config;
    const phases = [
      { name: 'inhale' as const, duration: pattern.inhale },
      ...(pattern.hold ? [{ name: 'hold' as const, duration: pattern.hold }] : []),
      { name: 'exhale' as const, duration: pattern.exhale },
      ...(pattern.hold_after_exhale ? [{ name: 'pause' as const, duration: pattern.hold_after_exhale }] : []),
    ];
    
    let currentPhaseIndex = 0;
    let phaseStartTime = Date.now();
    
    const updatePhase = () => {
      const now = Date.now();
      const currentPhase = phases[currentPhaseIndex];
      const phaseElapsed = (now - phaseStartTime) / 1000;
      const progress = Math.min((phaseElapsed / currentPhase.duration) * 100, 100);
      
      updateBreathPhase(currentPhase.name, progress);
      
      // Move to next phase
      if (phaseElapsed >= currentPhase.duration) {
        currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
        phaseStartTime = now;
        
        // Increment cycle when returning to inhale
        if (currentPhaseIndex === 0) {
          incrementCycle();
        }
      }
    };
    
    // Update every 100ms for smooth progress
    phaseTimerRef.current = setInterval(updatePhase, 100);
  }, [config, updateBreathPhase, incrementCycle]);

  const stopBreathingCycle = useCallback(() => {
    if (phaseTimerRef.current) {
      clearInterval(phaseTimerRef.current);
      phaseTimerRef.current = undefined;
    }
  }, []);

  // ========================================================================
  // SESSION LIFECYCLE - Simplified, clean
  // ========================================================================

  const initialize = useCallback(async (sessionConfig: SessionConfig) => {
    initializeSession(sessionConfig);
    
    // Request camera if needed
    if (sessionConfig.enableCamera) {
      await requestCamera();
    }
    
    // Auto-start if enabled
    if (autoStart) {
      setTimeout(() => {
        const { startSession: start } = useSessionStore.getState();
        start();
      }, 1000);
    }
  }, [initializeSession, requestCamera, autoStart]);

  const start = useCallback(() => {
    if (!config) {
      setError('Session not properly initialized');
      return;
    }
    
    startSession();
    
    // Start breathing phase cycle
    startBreathingCycle();
  }, [config, startSession, setError, startBreathingCycle]);

  const pause = useCallback(() => {
    pauseSession();
    stopBreathingCycle();
  }, [pauseSession, stopBreathingCycle]);

  const resume = useCallback(() => {
    resumeSession();
    startBreathingCycle();
  }, [resumeSession, startBreathingCycle]);

  const complete = useCallback(() => {
    completeSession();
    stopBreathingCycle();
    
    // Cleanup camera
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    
    // Stop vision
    if (vision) {
      vision.stop();
      setVisionActive(false);
    }
  }, [completeSession, cameraStream, setCameraStream, vision, setVisionActive]);

  const reset = useCallback(() => {
    stopBreathingCycle();
    resetSession();
    
    if (vision) {
      vision.reset();
    }
  }, [resetSession, vision]);

  // ========================================================================
  // VISION INTEGRATION - Clean, optional
  // ========================================================================
  
  const previousVisionMetricsRef = useRef<string>('');

  useEffect(() => {
    if (enableVision && vision?.state.metrics) {
      const { stillness, presence, posture, restlessnessScore, faceLandmarks } = vision.state.metrics;

      // Create a hash to detect actual changes in metrics (include faceLandmarks)
      const metricsHash = JSON.stringify({
        stillness,
        presence,
        posture,
        restlessnessScore,
        faceLandmarksCount: faceLandmarks?.length || 0
      });

      // Only update if metrics actually changed
      if (metricsHash !== previousVisionMetricsRef.current) {
        previousVisionMetricsRef.current = metricsHash;

        updateVisionMetrics({
          stillness,
          presence,
          posture,
          restlessnessScore,
          faceLandmarks,
        });
      }
    }
  }, [enableVision, vision?.state.metrics, updateVisionMetrics]);

  // ========================================================================
  // CLEANUP - Proper resource management
  // ========================================================================

  useEffect(() => {
    return () => {
      stopBreathingCycle();
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stopBreathingCycle, cameraStream]);

  // ========================================================================
  // PUBLIC API - Clean, simple interface
  // ========================================================================

  return {
    // State
    phase,
    metrics,
    config,
    isActive,
    isPaused,
    isComplete,
    audioEnabled,
    
    // Vision state (if enabled)
    visionMetrics: enableVision ? visionMetrics : null,
    visionActive: enableVision ? vision?.state.isActive : false,
    
    // Actions
    initialize,
    start,
    pause,
    resume,
    complete,
    reset,
    toggleAudio,
    requestCamera,
    
    // Utilities
    getSessionDuration,
    getCompletionPercentage,
    
    // Camera state
    cameraStream,
    cameraPermissionGranted: sessionSelectors.canUseCamera(),
  };
};

export default useSession;