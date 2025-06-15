
import React, { Suspense, lazy } from 'react';
import BreathingAnimation from '@/components/BreathingAnimation';
import { BreathingPhaseName } from '@/lib/breathingPatterns';
import { useBreathingSession } from '@/hooks/useBreathingSession';
import { SessionHeader } from './SessionHeader';
import { SessionControls } from './SessionControls';
import type { Keypoint } from '@tensorflow-models/face-landmarks-detection';

const VideoFeed = lazy(() => import('@/components/VideoFeed'));

type SessionInProgressProps = {
  state: ReturnType<typeof useBreathingSession>['state'];
  controls: ReturnType<typeof useBreathingSession>['controls'];
  handleEndSession: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  showVideoFeed: boolean;
  isTracking: boolean;
  restlessnessScore: number;
  landmarks: Keypoint[];
};

export const SessionInProgress = ({
  state,
  controls,
  handleEndSession,
  videoRef,
  showVideoFeed,
  isTracking,
  restlessnessScore,
  landmarks,
}: SessionInProgressProps) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center w-full relative animate-fade-in">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <BreathingAnimation 
          phase={state.sessionPhase === 'breath-hold' ? 'hold' : state.sessionPhase as BreathingPhaseName} 
          text={state.phaseText} 
        />
      </div>

      <SessionHeader state={state} />

      <SessionControls state={state} controls={controls} onEndSession={handleEndSession} />

      {showVideoFeed && (
        <Suspense fallback={<div className="absolute bottom-4 right-4 w-32 h-24 md:w-48 md:h-36 rounded-lg bg-secondary animate-pulse" />}>
          <VideoFeed videoRef={videoRef} isActive={showVideoFeed} landmarks={landmarks} />
        </Suspense>
      )}
      
      {isTracking && (
        <div className="absolute bottom-4 left-4 bg-gray-900/80 text-white p-2 rounded-lg text-xs z-30 font-mono animate-fade-in">
          <p>RESTLESSNESS: {Math.round(restlessnessScore)}</p>
        </div>
      )}
    </div>
  );
};
