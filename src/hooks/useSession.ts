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
import { useVisionStore, visionSelectors } from '../stores/visionStore';
import { useCamera } from '../contexts/CameraContext';

export interface UseSessionOptions {
  autoStart?: boolean;
  enableVision?: boolean;
  targetFPS?: number;
  videoElement?: React.RefObject<HTMLVideoElement>;
}

export const useSession = (options: UseSessionOptions = {}) => {
  const {
    autoStart = false,
    enableVision = false,
    targetFPS = 2,
    videoElement,
  } = options;

  // Store actions
  const {
    initializeSession,
    setSessionReady,
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
  const sessionVisionMetrics = useSessionStore((state) => state.visionMetrics);

  // Camera context
  const {
    stream: cameraContextStream,
    status: cameraStatus,
    error: cameraError,
    requestStream: requestCameraStream,
    releaseStream: releaseCameraStream,
    hasPermission: cameraPermission
  } = useCamera();

  // Vision processing (conditional) - use vision store
  const visionStore = useVisionStore();
  const isVisionActive = visionSelectors.isActive();
  const visionMetrics = visionSelectors.hasMetrics() ? visionStore.metrics : null;

  // Breathing phase timer
  const phaseTimerRef = useRef<NodeJS.Timeout>();
  const cycleTimerRef = useRef<NodeJS.Timeout>();

  // ========================================================================
  // CAMERA MANAGEMENT - Clean, unified
  // ========================================================================

  const requestCamera = useCallback(async () => {
    try {
      console.log('📷 useSession: Requesting camera access through CameraContext...');

      const stream = await requestCameraStream();

      if (stream) {
        console.log('✅ useSession: Camera access granted through CameraContext');
        setCameraStream(stream);
        setCameraPermission(true);

        // Attach stream to video element if provided
        // Video element handling is now managed by VideoFeed component.
        // The stream is stored in CameraContext and consumed by VideoFeed,
        // so we only need to request the stream and update the store.

        // Start vision if enabled
        if (enableVision && visionStore.isReady && videoElement?.current) {
          console.log('🔍 useSession: Starting vision processing with video element');
          try {
            await visionStore.start(videoElement.current);
            setVisionActive(true);
          } catch (error) {
            console.warn('⚠️ useSession: Failed to start vision processing:', error);
            setError(`Vision processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        return stream;
      } else {
        // Handle case where stream request failed
        setCameraPermission(false);
        const errorMessage = cameraError || 'Camera access failed';
        setError(errorMessage);
        return null;
      }
    } catch (error) {
      console.warn('❌ useSession: Camera access failed:', error);
      setCameraPermission(false);

      // Provide more specific error messages
      let errorMessage = 'Camera access was denied. Continuing without camera tracking.';

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permissions in your browser settings.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera and try again.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Camera access timed out. Please check permissions and try again.';
        }
      }

      setError(errorMessage);
      return null;
    }
  }, [requestCameraStream, setCameraStream, setCameraPermission, setVisionActive, setError, videoElement, enableVision, visionStore, cameraError]);

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

    // Initialize vision store if vision is enabled
    if (enableVision && sessionConfig.enableCamera) {
      console.log('🔍 useSession: Initializing vision store');
      try {
        const stableSessionId = `session_${Date.now()}`;
        await visionStore.initialize({
          sessionId: stableSessionId,
          targetFPS: targetFPS,
          silentMode: false,
          gracefulDegradation: false, // No fake data
          features: {
            detectFace: true,
            analyzePosture: true,
            trackMovement: true,
          },
        });
      } catch (error) {
        console.warn('⚠️ useSession: Failed to initialize vision store:', error);
        setError(`Vision initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Request camera if needed
    if (sessionConfig.enableCamera) {
      await requestCamera();
    }

    // CLEAN: Don't auto-advance to ready - let preparation flow handle it
    // Session stays in 'setup' phase until user completes preparation
    console.log('🔧 Session initialized in setup phase, waiting for preparation flow');

    // Auto-start if enabled (only for classic mode or when preparation is disabled)
    if (autoStart && !sessionConfig.enableCamera) {
      setTimeout(() => {
        setSessionReady();
        const { startSession: start } = useSessionStore.getState();
        start();
      }, 1000);
    }
  }, [initializeSession, requestCamera, setSessionReady, autoStart, enableVision, visionStore, targetFPS, setError]);

  const start = useCallback(() => {
    // Check if session is properly initialized by checking the store directly
    const currentState = useSessionStore.getState();
    if (!currentState.config) {
      setError('Session not properly initialized');
      return;
    }

    // Ensure we're in ready state before starting
    if (currentState.phase !== 'ready') {
      console.log('🔄 Moving to ready phase before starting session');
      setSessionReady();
      // Small delay to ensure state update
      setTimeout(() => {
        startSession();
        startBreathingCycle();
      }, 100);
    } else {
      startSession();
      startBreathingCycle();
    }
  }, [startSession, setError, startBreathingCycle, setSessionReady]);

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

    // Only cleanup camera on actual completion, not during phase transitions
    // Camera cleanup is now handled by CameraContext
    console.log('🛑 useSession: Session completed, releasing camera reference');
    releaseCameraStream();

    // Stop vision
    if (visionStore.isActive) {
      visionStore.stop();
      setVisionActive(false);
    }
  }, [completeSession, releaseCameraStream, visionStore, setVisionActive]);

  const reset = useCallback(() => {
    stopBreathingCycle();
    resetSession();

    if (visionStore.isActive) {
      visionStore.reset();
    }
  }, [resetSession, visionStore]);

  // ========================================================================
  // VISION INTEGRATION - Clean, optional
  // ========================================================================

  const previousVisionMetricsRef = useRef<string>('');

  useEffect(() => {
    if (enableVision && visionMetrics) {
      const { stillness, presence, posture, restlessnessScore, faceLandmarks } = visionMetrics;

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
  }, [enableVision, visionMetrics, updateVisionMetrics]);

  // ========================================================================
  // CLEANUP - Proper resource management
  // ========================================================================

  useEffect(() => {
    return () => {
      console.log('🧹 useSession: Component unmounting, cleaning up resources');
      stopBreathingCycle();
      // Release camera reference instead of directly stopping stream
      console.log('🧹 useSession: Releasing camera reference on component unmount');
      releaseCameraStream();
    };
  }, [releaseCameraStream]); // Empty dependency array - only run on unmount

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
    visionMetrics: enableVision ? sessionVisionMetrics : null,
    visionActive: enableVision ? isVisionActive : false,

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
    cameraStream: cameraContextStream,
    cameraPermissionGranted: cameraPermission,
  };
};

export default useSession;
