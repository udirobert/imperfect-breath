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
  const visionMetrics = useSessionStore((state) => state.visionMetrics);

  // Camera context
  const { 
    stream: cameraContextStream, 
    status: cameraStatus, 
    error: cameraError,
    requestStream: requestCameraStream,
    releaseStream: releaseCameraStream,
    hasPermission: cameraPermission
  } = useCamera();

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
      console.log('📷 useSession: Requesting camera access through CameraContext...');

      const stream = await requestCameraStream();
      
      if (stream) {
        console.log('✅ useSession: Camera access granted through CameraContext');
        setCameraStream(stream);
        setCameraPermission(true);

        // Attach stream to video element if provided
        if (videoElement?.current) {
          console.log('📹 useSession: Attaching stream to video element...');
          const video = videoElement.current;

          // Set stream and video properties
          video.srcObject = stream;
          video.muted = true;
          video.autoplay = true;
          video.playsInline = true;

          // Ensure video is playing with retry mechanism
          const playVideo = async (retries = 3) => {
            for (let i = 0; i < retries; i++) {
              try {
                await video.play();
                console.log('✅ useSession: Video is playing, readyState:', video.readyState);
                return;
              } catch (playError) {
                console.warn(`⚠️ useSession: Video play attempt ${i + 1} failed:`, playError);
                if (i < retries - 1) {
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
              }
            }
            console.warn('⚠️ useSession: All video play attempts failed');
          };

          await playVideo();

          // Set video element styling
          video.style.display = 'block';
          video.style.visibility = 'visible';
          video.style.opacity = '1';
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.position = 'absolute';
          video.style.top = '0';
          video.style.left = '0';
          video.style.zIndex = '1';
          console.log('✅ useSession: Video element configured');
        }

        // Start vision if enabled
        if (enableVision && vision) {
          setVisionActive(true);
          // Vision hook will handle the video element connection
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
  }, [requestCameraStream, setCameraStream, setCameraPermission, setVisionActive, setError, videoElement, enableVision, vision, cameraError]);

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

    // Set session as ready after initialization
    setSessionReady();

    // Auto-start if enabled
    if (autoStart) {
      setTimeout(() => {
        const { startSession: start } = useSessionStore.getState();
        start();
      }, 1000);
    }
  }, [initializeSession, requestCamera, setSessionReady, autoStart]);

  const start = useCallback(() => {
    // Check if session is properly initialized by checking the store directly
    const currentState = useSessionStore.getState();
    if (!currentState.config) {
      setError('Session not properly initialized');
      return;
    }

    startSession();

    // Start breathing phase cycle
    startBreathingCycle();
  }, [startSession, setError, startBreathingCycle]);

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
    if (vision) {
      vision.stop();
      setVisionActive(false);
    }
  }, [completeSession, releaseCameraStream, vision, setVisionActive]);

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
    cameraStream: cameraContextStream,
    cameraPermissionGranted: cameraPermission,
  };
};

export default useSession;