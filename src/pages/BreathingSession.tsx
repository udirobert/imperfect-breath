import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { useBreathingSession } from "../hooks/useBreathingSession";
import {
  BreathingPattern,
  BREATHING_PATTERNS,
  BreathingPhaseName,
} from "../lib/breathingPatterns";
import { useVision } from "../hooks/useVision";
import { useAIFeedback } from "../hooks/useAIFeedback";
import { useMobileCameraManager } from "../lib/vision/MobileCameraManager";

import { SessionSetup } from "../components/session/SessionSetup";
import { SessionInProgress } from "../components/session/SessionInProgress";
import { MobileBreathingInterface } from "../components/session/MobileBreathingInterface";
import { useIsMobile } from "../hooks/use-mobile";
import { useOfflineManager } from "../lib/offline/OfflineManager";

function getInitialPattern(location: ReturnType<typeof useLocation>) {
  // 1. Try navigation state (preview)
  if (location.state?.previewPattern) return location.state.previewPattern;
  // 2. Try localStorage
  try {
    const stored = localStorage.getItem("selectedPattern");
    if (stored) return JSON.parse(stored);
  } catch {}
  // 3. Fallback to default free pattern
  return BREATHING_PATTERNS.box;
}

const BreathingSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { saveSession, syncStatus } = useOfflineManager();

  const initialPattern = getInitialPattern(location);
  const { state, controls } = useBreathingSession(initialPattern);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [cameraRequested, setCameraRequested] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Mobile camera manager for optimized mobile experience
  const mobileCameraManager = useMobileCameraManager({
    performance: {
      processingInterval: 200, // Optimize for battery
      batteryOptimized: true,
      adaptiveQuality: true,
    },
  });

  // Keep camera tracking active once initialized until session ends
  const isTracking =
    cameraInitialized && !state.isFinished && state.sessionPhase !== "idle";

  // Camera tracking state management

  const {
    restlessnessScore,
    landmarks,
    trackingStatus,
    initializeCamera,
    cleanup,
  } = useVision({
    videoRef,
    isTracking,
  } as any); // Type assertion to bypass TypeScript error temporarily

  // No automatic phase transitions - user controls when to start

  // Show video feed once camera is requested and throughout the session
  const showVideoFeed = cameraRequested && !state.isFinished;

  // Camera initialization is now manual only - triggered by user clicking "Enable Camera"

  const handleRequestCamera = async () => {
    setCameraRequested(true);

    try {
      // Small delay to ensure video element is rendered
      await new Promise((resolve) => setTimeout(resolve, 100));
      await initializeCamera();
      setCameraInitialized(true);
    } catch (error) {
      console.error("Failed to initialize camera:", error);
      setCameraInitialized(false);
      setCameraRequested(false); // Reset on failure so user can try again
    }
  };

  useAIFeedback({
    isRunning: state.isRunning,
    isFinished: state.isFinished,
    speak: controls.speak,
    cycleCount: state.cycleCount,
    sessionPhase: state.sessionPhase,
    patternKey: state.pattern.id || "custom",
  });

  // Cleanup camera when component unmounts
  useEffect(() => {
    return () => {
      if (cameraInitialized) {
        cleanup();
      }
    };
  }, [cleanup, cameraInitialized]);

  const handleEndSession = useCallback(() => {
    // Calculate session duration based on pattern properties
    // and cycles completed
    const oneCycleDuration = state.pattern.phases
      ? state.pattern.phases.reduce((sum, phase) => sum + phase.duration, 0)
      : (state.pattern.inhale +
          state.pattern.hold +
          state.pattern.exhale +
          state.pattern.rest) *
        1000;

    const sessionDuration = (state.cycleCount * oneCycleDuration) / 1000;

    const finalBreathHoldTime = state.breathHoldTime;
    const finalRestlessnessScore = restlessnessScore;

    // Clean up camera before ending session
    if (typeof cleanup === "function") {
      cleanup();
    }
    setCameraInitialized(false);
    setCameraRequested(false);
    // Save session offline-first
    const sessionId = saveSession({
      patternId: state.pattern.id || 'custom',
      patternName: state.pattern.name,
      startTime: new Date(Date.now() - state.elapsedTime),
      endTime: new Date(),
      duration: sessionDuration,
      cycleCount: state.cycleCount,
      breathHoldTime: finalBreathHoldTime,
      restlessnessScore: finalRestlessnessScore,
      completed: true,
    });

    controls.endSession();

    navigate("/results", {
      state: {
        breathHoldTime: finalBreathHoldTime,
        restlessnessScore: finalRestlessnessScore,
        patternName: state.pattern.name,
        sessionDuration,
        sessionId,
        isOffline: !syncStatus.isOnline,
      },
    });
  }, [
    cleanup,
    state.pattern,
    state.cycleCount,
    state.breathHoldTime,
    restlessnessScore,
    controls,
    navigate,
  ]);

  if (state.sessionPhase === "idle" || state.isFinished) {
    return <SessionSetup state={state} controls={controls} />;
  }

  // Mobile-optimized interface or desktop interface
  if (isMobile && state.isRunning) {
    return (
      <MobileBreathingInterface
        state={state}
        controls={controls}
        onEndSession={handleEndSession}
        cameraEnabled={cameraInitialized}
        onToggleCamera={handleRequestCamera}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
      />
    );
  }

  // Desktop interface or mobile setup
  return (
    <SessionInProgress
      state={state}
      controls={controls}
      handleEndSession={handleEndSession}
      videoRef={videoRef}
      showVideoFeed={showVideoFeed}
      isTracking={isTracking}
      restlessnessScore={restlessnessScore}
      landmarks={landmarks}
      trackingStatus={trackingStatus}
      cameraInitialized={cameraInitialized}
      cameraRequested={cameraRequested}
      onRequestCamera={handleRequestCamera}
    />
  );
};

export default BreathingSession;
