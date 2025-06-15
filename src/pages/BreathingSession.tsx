import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useBreathingSession } from '@/hooks/useBreathingSession';
import { BREATHING_PATTERNS } from '@/lib/breathingPatterns';
import { useCameraTracking } from '@/hooks/useCameraTracking';
import { useDemoMode } from '@/context/DemoModeContext';
import { useDemoFeedback } from '@/hooks/useDemoFeedback';

import { SessionSetup } from '@/components/session/SessionSetup';
import { SessionInProgress } from '@/components/session/SessionInProgress';

const BreathingSession = () => {
  const { state, controls } = useBreathingSession();
  const { isDemoMode } = useDemoMode();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const isTracking = state.sessionPhase === 'breath-hold' && !isDemoMode;
  const { restlessnessScore, landmarks, trackingStatus } = useCameraTracking({ videoRef, isTracking });
  const showVideoFeed = state.sessionPhase !== 'idle' && !state.isFinished && !isDemoMode;

  useDemoFeedback({
    isDemoMode,
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
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    const pattern = BREATHING_PATTERNS[state.pattern.key];
    const oneCycleDuration = pattern.phases.reduce((sum, phase) => sum + phase.duration, 0);
    const sessionDuration = (state.cycleCount * oneCycleDuration) / 1000;

    let finalBreathHoldTime = state.breathHoldTime;
    let finalRestlessnessScore = restlessnessScore;

    if (isDemoMode) {
      finalBreathHoldTime = 90;
      finalRestlessnessScore = Math.floor(Math.random() * 15) + 5;
    }
    
    controls.endSession();
    navigate('/results', { state: { 
      breathHoldTime: finalBreathHoldTime,
      restlessnessScore: finalRestlessnessScore,
      patternName: state.pattern.key,
      sessionDuration
    } });
  };

  if (state.sessionPhase === 'idle' || state.isFinished) {
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
    />
  );
};

export default BreathingSession;
