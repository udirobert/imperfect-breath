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

import React, { useEffect, useRef } from 'react';
import { useIsMobile } from '../../hooks/use-mobile';
import { useCameraStore } from '../../stores/cameraStore';
import { useStableMetrics } from '../../hooks/useStableMetrics';
import { useSession } from '../../hooks/useSession';
import { useSessionPhase, useSessionStore } from '../../stores/sessionStore';
import { useVoiceGuidance } from '../../hooks/useVoiceGuidance';
import { useAdaptiveEncouragement } from '../../hooks/useAdaptiveEncouragement';
import { usePreferencesStore } from '../../stores/preferencesStore';

import VideoFeed from '../VideoFeed';
import { VisionManager } from './VisionManager';
import BreathingAnimation from '../BreathingAnimation';
import { SessionControls } from './SessionControls';
import { EnhancedSessionLayout } from './EnhancedSessionLayout';
import { SessionPreview } from './SessionPreview';

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
  const { stream: cameraStream } = useCameraStore();
  const stableMetrics = useStableMetrics();
  const session = useSession({
    autoStart: false,
    enableVision: modeConfig.enableVision,
    targetFPS: isMobile ? 0.5 : 1, // Slower FPS on mobile for performance
    videoElement: videoRef,
  });

  // DRY: Single source of truth for session ID
  const sessionId = session.getSessionId();

  // Voice guidance — phase cues ("Breathe in…", "Hold…", "Breathe out…").
  // Opt-in via sessionStore audioEnabled AND user preference. No continuous chatter.
  const audioEnabled = useSessionStore((s) => s.audioEnabled);
  const audioPrefs = usePreferencesStore((s) => s.audio);
  const voiceEnabled = audioEnabled && audioPrefs.enableVoiceGuidance && audioPrefs.enablePhaseCues;
  const { cuePhase } = useVoiceGuidance(voiceEnabled);

  // Adaptive encouragement — contextual, performance-timed coaching.
  // Reads stillness from vision metrics; surfaces a single fade message.
  const encouragement = useAdaptiveEncouragement({
    enabled: session.isActive,
    sessionMetrics: session.metrics,
    visionMetrics: session.visionMetrics,
    currentPhase: sessionPhase,
    isSessionActive: session.isActive,
  });

  // Speak the phase cue on each phase transition during the active session.
  const lastPhaseRef = useRef<string | null>(null);
  useEffect(() => {
    if (!session.isActive || session.isPaused) return;
    const phase = session.metrics?.currentPhase;
    if (phase && phase !== lastPhaseRef.current) {
      lastPhaseRef.current = phase;
      cuePhase(phase);
    }
  }, [session.metrics?.currentPhase, session.isActive, session.isPaused, cuePhase]);

  // Reset phase tracker when session exits active state.
  useEffect(() => {
    if (!session.isActive) lastPhaseRef.current = null;
  }, [session.isActive]);

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
  const videoFeed = cameraStream ? (
    <div className="relative w-full h-full">
      <VideoFeed
        videoRef={videoRef}
        isActive={session.isActive}
        landmarks={session.visionMetrics?.faceLandmarks || []}
        trackingStatus={(session.visionMetrics?.presence || 0) > 0 ? "TRACKING" : "IDLE"}
        luxuryMode={false}
      />
      <VisionManager
        enabled={modeConfig.enableVision && cameraStream !== null}
        videoRef={videoRef}
        cameraStream={cameraStream}
        sessionId={sessionId ?? ''}
        quiet
        onVisionReady={() => console.log('Vision processing ready')}
        onVisionError={(error) => console.warn('Vision processing error:', error)}
      />
    </div>
  ) : null;

  // Breathing animation component
  // The breath signal from useStableMetrics drives the orb's quality
  // (glow, stability, color) — making verification visible in real time.
  const breathSignal = modeConfig.enableVision
    ? {
        stillness: stableMetrics.stillnessScore,
        confidence: Math.round(stableMetrics.confidence * 100),
        faceDetected: stableMetrics.hasValidData,
        hasValidData: stableMetrics.hasValidData,
      }
    : undefined;

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
      breathSignal={breathSignal}
      sessionInfo={{
        duration: sessionInfo.duration,
        progressPercentage: sessionInfo.progressPercentage,
      }}
    />
  );

  // Session controls component
  const controls = (
    <SessionControls
      onEndSession={() => {
        const durationSeconds = useSessionStore.getState().metrics.duration || 0;
        const lastStillness =
          session.visionMetrics?.stillness != null
            ? Math.round(session.visionMetrics.stillness)
            : stableMetrics.hasValidData
              ? stableMetrics.stillnessScore
              : null;

        const sessionMetrics = {
          duration: durationSeconds,
          sessionDuration: durationSeconds,
          elapsedTime: durationSeconds * 1000,
          cycleCount: session.metrics?.cycleCount || 0,
          breathHoldTime: 0,
          stillnessScore: lastStillness,
          restlessnessScore: lastStillness != null ? 100 - lastStillness : null,
          cameraUsed: !!cameraStream,
          sessionType: config.mode === "classic" ? "classic" : "enhanced",
          visionSessionId: sessionId,
          patternName: config.pattern.name,
        };

        session.complete();
        onSessionComplete(sessionMetrics);
      }}
    />
  );

  if (sessionPhase === 'setup' || sessionPhase === 'preparation' || sessionPhase === 'camera_setup') {
    return (
      <div className="min-h-screen flex flex-col">
        <SessionPreview
          patternName={config.pattern.name}
          pattern={{
            name: config.pattern.name,
            phases: {
              inhale: config.pattern.phases.inhale,
              hold: config.pattern.phases.hold,
              exhale: config.pattern.phases.exhale,
              pause: config.pattern.phases.pause,
            },
            benefits: config.pattern.benefits || ['Improved focus', 'Stress reduction'],
            description: config.pattern.description || `Experience the ${config.pattern.name} breathing technique with enhanced AI feedback.`
          }}
          enableCamera={modeConfig.enableCamera}
          capture={videoFeed}
          onStart={handleSessionStart}
          onCancel={onSessionExit}
        />
      </div>
    );
  }

  return (
    <EnhancedSessionLayout
      videoFeed={videoFeed}
      showVideo={!!cameraStream}
      seen={stableMetrics.hasValidData}
      breathingAnimation={breathingAnimation}
      metrics={metrics}
      sessionInfo={sessionInfo}
      controls={controls}
      encouragement={encouragement.currentEncouragement}
      isMobile={isMobile}
      onExit={onSessionExit}
    />
  );
};

export default ResponsiveEnhancedSession;
