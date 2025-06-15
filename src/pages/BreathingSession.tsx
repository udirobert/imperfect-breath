import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useBreathingSession } from "@/hooks/useBreathingSession";
import { BREATHING_PATTERNS } from "@/lib/breathingPatterns";
import { useCameraTracking } from "@/hooks/useCameraTracking";
import { useAIFeedback } from "@/hooks/useAIFeedback";

import { SessionSetup } from "@/components/session/SessionSetup";
import { SessionInProgress } from "@/components/session/SessionInProgress";

const BreathingSession = () => {
  const { state, controls } = useBreathingSession();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Keep camera tracking active during session phases
  const isTracking = state.sessionPhase !== "idle" && !state.isFinished;

  const {
    restlessnessScore,
    landmarks,
    trackingStatus,
    initializeCamera,
    cleanup,
  } = useCameraTracking({
    videoRef,
    isTracking,
  });

  // Show video feed during active phases
  const showVideoFeed = isTracking;

  useAIFeedback({
    isRunning: state.isRunning,
    isFinished: state.isFinished,
    speak: controls.speak,
    cycleCount: state.cycleCount,
    sessionPhase: state.sessionPhase,
    patternKey: state.pattern.key,
  });

  const handleEndSession = () => {
    const pattern = BREATHING_PATTERNS[state.pattern.key];
    const oneCycleDuration = pattern.phases.reduce(
      (sum, phase) => sum + phase.duration,
      0,
    );
    const sessionDuration = (state.cycleCount * oneCycleDuration) / 1000;

    const finalBreathHoldTime = state.breathHoldTime;
    const finalRestlessnessScore = restlessnessScore;

    // Clean up camera before ending session
    cleanup();
    controls.endSession();

    navigate("/results", {
      state: {
        breathHoldTime: finalBreathHoldTime,
        restlessnessScore: finalRestlessnessScore,
        patternName: state.pattern.key,
        sessionDuration,
      },
    });
  };

  if (state.sessionPhase === "idle" || state.isFinished) {
    return <SessionSetup state={state} controls={controls} />;
  }

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
      initializeCamera={initializeCamera}
    />
  );
};

export default BreathingSession;
