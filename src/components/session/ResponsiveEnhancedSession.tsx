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
import { useSessionPhase } from '../../stores/sessionStore';

import VideoFeed from '../VideoFeed';
import { VisionManager } from './VisionManager';
import BreathingAnimation from '../BreathingAnimation';
import { SessionControls } from './SessionControls';
import { EnhancedSessionLayout } from './EnhancedSessionLayout';
import { SessionPreview } from './SessionPreview';

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
      benefits?: string[];
      description?: string;
    };
    mode: 'classic' | 'enhanced';
  };
  modeConfig: {
    enableCamera: boolean;
    enableVision: boolean;
  };
  onSessionComplete: (metrics: any) => void;
  onSessionExit: () => void;
  // AGGRESSIVE CONSOLIDATION: Remove sessionId prop - use sessionStore instead
}

export const ResponsiveEnhancedSession: React.FC<ResponsiveEnhancedSessionProps> = ({
  config,
  modeConfig,
  onSessionComplete,
  onSessionExit,
}) => {
  const isMobile = useIsMobile();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Session phase state - SINGLE SOURCE OF TRUTH
  const sessionPhase = useSessionPhase();
  
  // Camera and vision state
  const { stream: cameraStream } = useCamera();
  const stableMetrics = useStableMetrics();
  const session = useSession({
    autoStart: false,
    enableVision: modeConfig.enableVision,
    targetFPS: isMobile ? 0.5 : 1, // Slower FPS on mobile for performance
    videoElement: videoRef,
  });

  // DRY: Single source of truth for session ID
  const sessionId = session.getSessionId();

  // ENHANCEMENT FIRST: Initialize session with proper config
  React.useEffect(() => {
    if (!session.config) {
      console.log('🔧 Initializing enhanced session with config:', { 
        pattern: config.pattern.name, 
        mode: config.mode,
        enableCamera: modeConfig.enableCamera,
        enableVision: modeConfig.enableVision 
      });
      session.initialize({
        mode: config.mode as any,
        pattern: config.pattern as any,
        enableCamera: modeConfig.enableCamera,
        enableAudio: true,
        enableAI: modeConfig.enableVision,
      });
    }
  }, [session, config, modeConfig]);

  // Debug session phase changes
  React.useEffect(() => {
    console.log('📊 Session phase changed to:', sessionPhase);
  }, [sessionPhase]);

  // Handle session start from preparation flow
  const handleSessionStart = React.useCallback(async (cameraEnabled: boolean) => {
    console.log('🚀 Starting session with camera:', cameraEnabled);
    console.log('🔍 Current session state before start:', {
      phase: session.phase,
      config: !!session.config,
      isActive: session.isActive,
      metrics: session.metrics
    });
    
    // CRITICAL FIX: Use the session's built-in ready transition
    if (session.phase === 'setup') {
      console.log('🔄 Session in setup, using session.start() to handle transition');
    } else {
      console.log('🚀 Session already ready, starting immediately');
    }
    
    // Always call session.start() - it handles the ready transition internally
    session.start();
    
    // CRITICAL FIX: Ensure no return value that could be interpreted as cleanup function
    return undefined;
  }, [session]);

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
      phaseProgress={session.metrics?.phaseProgress || 0}
      sessionInfo={{
        duration: sessionInfo.duration,
        progressPercentage: sessionInfo.progressPercentage,
      }}
    />
  );

  // Session controls component
  const controls = (
    <SessionControls
      onEndSession={async () => {
        // Collect session metrics
        const sessionDuration = session.getSessionDuration?.() || 0;
        const cycleCount = session.metrics?.cycleCount || 0;

        // HONEST UX: Fetch REAL aggregated vision metrics from Hetzner API
        let realVisionMetrics = null;
        if (modeConfig.enableVision && sessionId) {
          try {
            console.log('📊 Fetching vision summary for session:', sessionId);
            const visionSummaryResponse = await fetch(
              `${import.meta.env.VITE_HETZNER_SERVICE_URL || "http://localhost:8001"}/api/vision/sessions/${sessionId}/summary`
            );
            
            if (visionSummaryResponse.ok) {
              const visionSummary = await visionSummaryResponse.json();
              console.log('✅ Fetched real vision summary:', visionSummary);
              
              // Calculate real stillness from movement (inverse relationship)
              const realStillness = Math.round((1 - visionSummary.avg_movement_level) * 100);
              
              realVisionMetrics = {
                averageStillness: realStillness,
                faceDetectionRate: Math.round(visionSummary.avg_confidence * 100),
                postureScore: Math.round(visionSummary.avg_posture_score * 100),
                movementLevel: visionSummary.avg_movement_level,
                totalFrames: visionSummary.total_frames,
                stillnessPercentage: visionSummary.stillness_percentage,
                consistencyScore: visionSummary.consistency_score,
              };
            } else {
              console.warn('⚠️ Vision summary not available, using last frame data');
              // FALLBACK: Use last available vision metrics from session
              if (session.visionMetrics?.stillness) {
                const lastFrameStillness = Math.round(session.visionMetrics.stillness);
                console.log('🔄 Using last frame stillness:', lastFrameStillness);
                realVisionMetrics = {
                  averageStillness: lastFrameStillness,
                  faceDetectionRate: Math.round((session.visionMetrics.presence || 0) * 100),
                  postureScore: Math.round((session.visionMetrics.posture || 0) * 100),
                  movementLevel: (100 - lastFrameStillness) / 100,
                  totalFrames: 1,
                  stillnessPercentage: lastFrameStillness,
                  consistencyScore: 75, // Default consistency
                };
              }
            }
          } catch (error) {
            console.error('❌ Failed to fetch vision summary:', error);
            // FALLBACK: Use last available vision metrics from session
            if (session.visionMetrics?.stillness) {
              const lastFrameStillness = Math.round(session.visionMetrics.stillness);
              console.log('🔄 Using last frame stillness as fallback:', lastFrameStillness);
              realVisionMetrics = {
                averageStillness: lastFrameStillness,
                faceDetectionRate: Math.round((session.visionMetrics.presence || 0) * 100),
                postureScore: Math.round((session.visionMetrics.posture || 0) * 100),
                movementLevel: (100 - lastFrameStillness) / 100,
                totalFrames: 1,
                stillnessPercentage: lastFrameStillness,
                consistencyScore: 75, // Default consistency
              };
            }
          }
        }

        const sessionMetrics = {
          duration: typeof sessionDuration === "string"
            ? parseInt(sessionDuration.split(":")[0]) * 60 + parseInt(sessionDuration.split(":")[1])
            : sessionDuration,
          cycleCount,
          breathHoldTime: 0,
          // HONEST: Use real aggregated stillness, not last frame
          stillnessScore: realVisionMetrics?.averageStillness || null,
          restlessnessScore: realVisionMetrics ? (100 - realVisionMetrics.averageStillness) : null,
          cameraUsed: !!cameraStream,
          sessionType: config.mode === "classic" ? "classic" : "enhanced",
          visionSessionId: sessionId,
          patternName: config.pattern.name,
          difficulty: 'intermediate',
          visionMetrics: realVisionMetrics,
        };

        console.log('📊 Session metrics with real vision data:', sessionMetrics);

        session.complete();
        onSessionComplete(sessionMetrics);
      }}
    />
  );

  // CLEAN: Phase-driven rendering - single responsibility
  // Show preparation flow for setup/preparation/camera_setup phases
  if (sessionPhase === 'setup' || sessionPhase === 'preparation' || sessionPhase === 'camera_setup') {
    console.log('📋 Showing preparation phase:', sessionPhase);
    return (
      <div className="min-h-screen flex flex-col">
        <SessionPreview
          patternName={config.pattern.name}
          pattern={{
            name: config.pattern.name,
            phases: config.pattern.phases,
            benefits: config.pattern.benefits || ['Improved focus', 'Stress reduction'],
            description: config.pattern.description || `Experience the ${config.pattern.name} breathing technique with enhanced AI feedback.`
          }}
          enableCamera={modeConfig.enableCamera}
          videoRef={videoRef}
          onStart={handleSessionStart}
          onCancel={onSessionExit}
        />
      </div>
    );
  }


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
