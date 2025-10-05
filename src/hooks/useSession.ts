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
    getSessionId,
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
    
    // CRITICAL FIX: Ensure no return value that could be interpreted as cleanup function
    return undefined;
  }, [requestCameraStream, setCameraStream, setCameraPermission, setVisionActive, setError, videoElement, enableVision, visionStore, cameraError]);

  // ========================================================================
  // BREATHING CYCLE MANAGEMENT - Clean timing
  // ========================================================================

  const startBreathingCycle = useCallback(() => {
    if (!config?.pattern) {
      console.warn('🚫 startBreathingCycle: No pattern config available');
      return;
    }

    // Clear any existing timer first
    if (phaseTimerRef.current) {
      console.log('🔄 startBreathingCycle: Clearing existing timer');
      clearInterval(phaseTimerRef.current);
      phaseTimerRef.current = undefined;
    }

    const { pattern } = config;
    const phases = [
      { name: 'inhale' as const, duration: typeof pattern.phases?.inhale === 'number' && pattern.phases.inhale >= 0 ? pattern.phases.inhale : 4 },
      ...(typeof pattern.phases?.hold === 'number' && pattern.phases.hold != null && pattern.phases.hold > 0 ? [{ name: 'hold' as const, duration: pattern.phases.hold }] : []),
      { name: 'exhale' as const, duration: typeof pattern.phases?.exhale === 'number' && pattern.phases.exhale >= 0 ? pattern.phases.exhale : 4 },
      ...(typeof pattern.phases?.hold_after_exhale === 'number' && pattern.phases.hold_after_exhale != null && pattern.phases.hold_after_exhale > 0 ? [{ name: 'pause' as const, duration: pattern.phases.hold_after_exhale }] : []),
    ];

    console.log('🫁 startBreathingCycle: Starting with phases:', phases);

    let currentPhaseIndex = 0;
    let phaseStartTime = Date.now();

    const updatePhase = () => {
      try {
        // CRITICAL SAFETY CHECK: Stop timer if session is no longer active
        const currentState = useSessionStore.getState();
        if (currentState.phase === 'complete' || currentState.phase === 'setup') {
          console.log('🚨 SAFETY: Session not active, stopping breathing cycle timer');
          if (phaseTimerRef.current) {
            clearInterval(phaseTimerRef.current);
            phaseTimerRef.current = undefined;
          }
          return;
        }

        const now = Date.now();
        const currentPhase = phases[currentPhaseIndex];
        const phaseElapsed = (now - phaseStartTime) / 1000;
        const progress = Math.min((phaseElapsed / currentPhase.duration) * 100, 100);

        // CRITICAL DEBUG: Always log first few updates to see if timer is working
        if (phaseElapsed < 2) {
          console.log(`🫑 TIMER WORKING - Phase: ${currentPhase.name}, Progress: ${progress.toFixed(1)}%, Elapsed: ${phaseElapsed.toFixed(1)}s`);
        }

        // Debug logging every 2 seconds to avoid spam
        if (Math.floor(phaseElapsed) % 2 === 0 && progress < 5) {
          console.log(`🫑 Phase: ${currentPhase.name}, Progress: ${progress.toFixed(1)}%, Elapsed: ${phaseElapsed.toFixed(1)}s`);
        }

        console.log(`🔄 Calling updateBreathPhase with: ${currentPhase.name}, ${progress.toFixed(1)}%`);
        updateBreathPhase(currentPhase.name, progress);

        // Move to next phase
        if (phaseElapsed >= currentPhase.duration) {
          console.log(`✅ Phase ${currentPhase.name} completed, moving to next phase`);
          currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
          phaseStartTime = now;

          // Increment cycle when returning to inhale
          if (currentPhaseIndex === 0) {
            console.log('🔄 Cycle completed, incrementing cycle count');
            incrementCycle();
          }
        }
      } catch (error) {
        console.error('❌ Error in updatePhase:', error);
      }
    };

    // Start immediately
    updatePhase();
    
    // Update every 100ms for smooth progress
    phaseTimerRef.current = setInterval(updatePhase, 100);
    console.log('⏰ Breathing cycle timer started');
  }, [config, updateBreathPhase, incrementCycle]);

  const stopBreathingCycle = useCallback(() => {
    if (phaseTimerRef.current) {
      console.log('⏹️ Stopping breathing cycle timer:', phaseTimerRef.current);
      clearInterval(phaseTimerRef.current);
      phaseTimerRef.current = undefined;
      console.log('✅ Breathing cycle timer stopped and cleared');
    } else {
      console.log('⚠️ stopBreathingCycle called but no timer was running');
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
        // Use the stable session ID from the session store
        const sessionId = getSessionId();
        if (sessionId) {
          await visionStore.initialize({
            sessionId,
            targetFPS: targetFPS,
            silentMode: false,
            gracefulDegradation: false, // No fake data
            features: {
              detectFace: true,
              analyzePosture: true,
              trackMovement: true,
            },
          });
        } else {
          console.warn('⚠️ useSession: No session ID available for vision initialization');
        }
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
        startSession();
      }, 1000);
    }
    
    // CRITICAL FIX: Ensure no return value that could be interpreted as cleanup function
    return undefined;
  }, [initializeSession, requestCamera, setSessionReady, autoStart, enableVision, visionStore, targetFPS, setError, getSessionId]);

  const start = useCallback(() => {
    // Check if session is properly initialized by checking the store directly
    const currentState = useSessionStore.getState();
    if (!currentState.config) {
      console.error('❌ Session not properly initialized');
      setError('Session not properly initialized');
      return;
    }

    console.log('🚀 Starting session, current phase:', currentState.phase);

    // CRITICAL FIX: Simplified session start to prevent React Error #310
    // Always set ready first, then start immediately
    setSessionReady();
    startSession();
    
    // Start breathing cycle after a minimal delay to ensure state is updated
    setTimeout(() => {
      startBreathingCycle();
    }, 50);
    
    // Note: No return value from useCallback - cleanup is handled in useEffect
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
  // CRITICAL FIX: Stop breathing cycle when session completes
  // ========================================================================
  
  useEffect(() => {
    // CRITICAL: Stop breathing cycle when session phase changes to complete
    if (phase === 'complete') {
      console.log('🚨 Session phase is complete, force stopping breathing cycle');
      stopBreathingCycle();
    }
  }, [phase, stopBreathingCycle]);

  // ========================================================================
  // CLEANUP - Proper resource management (FIXED: Prevent React Error #310)
  // ========================================================================

  useEffect(() => {
    return () => {
      // CRITICAL FIX: Use refs to avoid stale closure issues that cause React Error #310
      if (phaseTimerRef.current) {
        clearInterval(phaseTimerRef.current);
        phaseTimerRef.current = undefined;
      }
      // Camera cleanup is handled by CameraContext - don't duplicate here
    };
  }, []); // CLEAN: Only cleanup timers on unmount, avoid stale closures

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
    getSessionId,

    // Camera state
    cameraStream: cameraContextStream,
    cameraPermissionGranted: cameraPermission,
  };
};

export default useSession;
