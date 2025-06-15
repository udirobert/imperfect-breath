
import React, { Suspense, lazy } from 'react';
import { Button } from '@/components/ui/button';
import { useBreathingSession } from '@/hooks/useBreathingSession';
import { TrackingStatus } from '@/hooks/useCameraTracking';
import type { Keypoint } from '@tensorflow-models/face-landmarks-detection';
import { Loader2 } from 'lucide-react';

const VideoFeed = lazy(() => import('@/components/VideoFeed'));

type CameraSetupProps = {
  controls: ReturnType<typeof useBreathingSession>['controls'];
  videoRef: React.RefObject<HTMLVideoElement>;
  landmarks: Keypoint[];
  trackingStatus: TrackingStatus;
};

export const CameraSetup = ({ controls, videoRef, landmarks, trackingStatus }: CameraSetupProps) => {
  const isReady = trackingStatus === 'TRACKING';

  return (
    <div className="flex-grow flex flex-col items-center justify-center w-full relative animate-fade-in p-4 text-center">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Camera Setup</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Position your face in the center of the video feed. This allows us to measure your stillness during the breath hold phase.
        </p>
      </div>

      <div className="w-64 h-48 md:w-96 md:h-72 relative rounded-lg overflow-hidden shadow-lg">
        <Suspense fallback={<div className="w-full h-full rounded-lg bg-secondary animate-pulse" />}>
          <VideoFeed
            videoRef={videoRef}
            isActive={true}
            landmarks={landmarks}
            trackingStatus={trackingStatus}
            className="!relative !inset-0 !w-full !h-full"
          />
        </Suspense>
      </div>

      <div className="mt-8">
        <Button onClick={controls.startSession} size="lg" disabled={!isReady} className="w-48">
          {!isReady && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isReady ? 'Start Session' : 'Initializing...'}
        </Button>
      </div>
    </div>
  );
};
