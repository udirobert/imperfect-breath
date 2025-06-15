import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useBreathingSession } from "@/hooks/useBreathingSession";
import { BREATHING_PATTERNS } from "@/lib/breathingPatterns";
import { useCameraTracking } from "@/hooks/useCameraTracking";
import { useAIFeedback } from "@/hooks/useAIFeedback";

import { SessionSetup } from "@/components/session/SessionSetup";
import { SessionInProgress } from "@/components/session/SessionInProgress";
import { CameraSetup } from "@/components/session/CameraSetup";

const BreathingSession = () => {
  const { state, controls } = useBreathingSession();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const isTracking = state.isRunning || state.sessionPhase === "camera-setup";
  const { restlessnessScore, landmarks, trackingStatus, initializeCamera } =
    useCameraTracking({
      videoRef,
      isTracking,
    });
  const showVideoFeed = state.sessionPhase !== "idle" && !state.isFinished;

  useAIFeedback({
    isRunning: state.isRunning,
    isFinished: state.isFinished,
    speak: controls.speak,
    cycleCount: state.cycleCount,
    sessionPhase: state.sessionPhase,
    patternKey: state.pattern.key,
  });

  const handleEndSession = () => {
    // Stop camera feed before navigating away
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    const pattern = BREATHING_PATTERNS[state.pattern.key];
    const oneCycleDuration = pattern.phases.reduce(
      (sum, phase) => sum + phase.duration,
      0,
    );
    const sessionDuration = (state.cycleCount * oneCycleDuration) / 1000;

    const finalBreathHoldTime = state.breathHoldTime;
    const finalRestlessnessScore = restlessnessScore;

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

  if (state.sessionPhase === "camera-setup") {
    return (
      <CameraSetup
        controls={controls}
        videoRef={videoRef}
        landmarks={landmarks}
        trackingStatus={trackingStatus}
        initializeCamera={initializeCamera}
      />
    );
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
    />
  );
};

export default BreathingSession;
