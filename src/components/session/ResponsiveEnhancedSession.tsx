/**
 * Responsive Enhanced Session - HONEST UX for all devices
 * 
 * CORE PRINCIPLES APPLIED:
 * - ENHANCEMENT FIRST: Enhanced existing session with better viewport usage
 * - CLEAN: Clear separation of concerns for desktop vs mobile
 * - MODULAR: Reusable components for different layouts
 * - PERFORMANT: Optimized camera handling for mobile
 * - HONEST: Real metrics correlation visible at all times
 */

import React, { useRef } from 'react';
import { useIsMobile } from '../../hooks/use-mobile';
import { useCamera } from '../../contexts/CameraContext';
import { useStableMetrics } from '../../hooks/useStableMetrics';
import { useSession } from '../../hooks/useSession';

import VideoFeed from '../VideoFeed';
import { VisionManager } from './VisionManager';
import BreathingAnimation from '../BreathingAnimation';
import { SessionControls } from './SessionControls';
import { EnhancedSessionLayout } from './EnhancedSessionLayout';

import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Eye, Activity, Camera, CameraOff } from 'lucide-react';
import { Button } from '../ui/button';

interface ResponsiveEnhancedSessionProps {
  config: {
    pattern: {
      name: string;
      phases: {
        inhale: number;
        hold?: number;
        exhale: number;
        pause?: number;
      };
    };
    mode: 'classic' | 'enhanced';
  };
  modeConfig: {
    enableCamera: boolean;
    enableVision: boolean;
  };
  onSessionComplete: (metrics: any) => void;
  onSessionExit: () => void;
  sessionId: string;
}

export const ResponsiveEnhancedSession: React.FC<ResponsiveEnhancedSessionProps> = ({
  config,
  modeConfig,
  onSessionComplete,
  onSessionExit,
  sessionId,
}) => {
  const isMobile = useIsMobile();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Camera and vision state
  const { stream: cameraStream } = useCamera();
  const stableMetrics = useStableMetrics();
  const session = useSession({
    autoStart: false,
    enableVision: modeConfig.enableVision,
    targetFPS: isMobile ? 0.5 : 1, // Slower FPS on mobile for performance
    videoElement: videoRef,
  });

  // Session info for display
  const sessionInfo = {
    duration: session.getSessionDuration ? session.getSessionDuration() : "00:00",
    cycle: session.metrics?.cycleCount || 0,
    phase: session.metrics?.currentPhase || "inhale",
    progressPercentage: session.getCompletionPercentage ? session.getCompletionPercentage() : 0,
  };

  // Metrics for display
  const metrics = {
    stillnessScore: stableMetrics.stillnessScore,
    presenceScore: stableMetrics.presenceScore,
    confidenceScore: Math.round(stableMetrics.confidence * 100),
    showMetrics: modeConfig.enableVision && stableMetrics.hasValidData,
  };

  // Video feed component
  const videoFeed = modeConfig.enableCamera && cameraStream ? (
    <div className="relative w-full h-full">
      <VideoFeed
        videoRef={videoRef}
        isActive={session.isActive}
        landmarks={session.visionMetrics?.faceLandmarks || []}
        trackingStatus={(session.visionMetrics?.presence || 0) > 0 ? "TRACKING" : "IDLE"}
      />
      <VisionManager
        enabled={modeConfig.enableVision && cameraStream !== null}
        videoRef={videoRef}
        cameraStream={cameraStream}
        sessionId={sessionId}
        onVisionReady={() => console.log('Vision processing ready')}
        onVisionError={(error) => console.warn('Vision processing error:', error)}
      />
    </div>
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center text-gray-500">
        <CameraOff className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">Camera not available</p>
      </div>
    </div>
  );

  // Breathing animation component
  const breathingAnimation = (
    <BreathingAnimation
      phase={
        (session.metrics?.currentPhase === "pause"
          ? "hold_after_exhale"
          : session.metrics?.currentPhase) || "inhale"
      }
      pattern={config.pattern}
      isActive={session.isActive}
      cycleCount={session.metrics?.cycleCount || 0}
      sessionInfo={{
        duration: sessionInfo.duration,
        progressPercentage: sessionInfo.progressPercentage,
        stillnessScore: metrics.stillnessScore,
        presenceScore: metrics.presenceScore,
        confidenceScore: metrics.confidenceScore,
        showMetrics: metrics.showMetrics,
      }}
    />
  );

  // Session controls component
  const controls = (
    <SessionControls
      onEndSession={() => {
        // Collect session metrics
        const sessionDuration = session.getSessionDuration?.() || 0;
        const cycleCount = session.metrics?.cycleCount || 0;
        const visionData = session.visionMetrics;

        const sessionMetrics = {
          duration: typeof sessionDuration === "string"
            ? parseInt(sessionDuration.split(":")[0]) * 60 + parseInt(sessionDuration.split(":")[1])
            : sessionDuration,
          cycleCount,
          breathHoldTime: 0,
          stillnessScore: visionData?.stillness,
          cameraUsed: !!cameraStream,
          sessionType: config.mode === "classic" ? "classic" : "enhanced",
          visionSessionId: sessionId,
          visionMetrics: visionData ? {
            averageStillness: visionData.stillness,
            faceDetectionRate: visionData.presence,
            postureScore: visionData.posture,
          } : undefined,
        };

        session.complete();
        onSessionComplete(sessionMetrics);
      }}
    />
  );

  // MOBILE: Special handling for mobile enhanced sessions
  if (isMobile && config.mode === 'enhanced') {
    return (
      <EnhancedSessionLayout
        videoFeed={videoFeed}
        showVideo={modeConfig.enableCamera}
        breathingAnimation={breathingAnimation}
        metrics={metrics}
        sessionInfo={sessionInfo}
        controls={controls}
        isMobile={true}
      />
    );
  }

  // DESKTOP: Side-by-side layout for optimal correlation viewing
  if (!isMobile && config.mode === 'enhanced') {
    return (
      <EnhancedSessionLayout
        videoFeed={videoFeed}
        showVideo={modeConfig.enableCamera}
        breathingAnimation={breathingAnimation}
        metrics={metrics}
        sessionInfo={sessionInfo}
        controls={controls}
        isMobile={false}
      />
    );
  }

  // FALLBACK: Classic session layout
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex justify-center">
              {breathingAnimation}
            </div>
            {controls}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResponsiveEnhancedSession;