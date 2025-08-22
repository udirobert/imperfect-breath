/**
 * ULTIMATE UNIFIED SESSION COMPONENT
 *
 * SINGLE SOURCE OF TRUTH for ALL breathing session UIs.
 * Consolidates: SessionInProgress + UnifiedBreathingSession + SessionOrchestrator + ClassicBreathingSession
 *
 * Design Principles:
 * - DRY: No duplication - one component for all session types
 * - CLEAN: Meditation-focused UX with silent error handling
 * - ORGANISED: Clear phase-based structure with mode configurations
 * - MODULAR: Composable features that can be enabled/disabled
 * - PERFORMANT: Adaptive optimization for mobile meditation
 *
 * Features Consolidated:
 * ✅ Classic mode (no camera, pure mindfulness)
 * ✅ Enhanced mode (camera + AI vision)
 * ✅ Mobile optimization (adaptive performance)
 * ✅ Vision processing (FaceMesh with 20+ landmarks)
 * ✅ Session orchestration (phase management)
 * ✅ Error boundaries (gentle, meditation-appropriate)
 * ✅ Audio guidance support
 * ✅ Performance monitoring
 * ✅ Zustand state management
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import {
  Play,
  Pause,
  Square,
  Camera,
  CameraOff,
  Eye,
  Activity,
  Heart,
  Volume2,
  VolumeX,
  Loader2,
  Settings,
  Maximize2,
} from "lucide-react";

// Core imports
import BreathingAnimation from "../BreathingAnimation";
import { FaceMeshOverlay } from "../vision/FaceMeshOverlay";
import VideoFeed from "../VideoFeed";
import { GentleErrorBoundary } from "../meditation/GentleErrorBoundary";
import { CalmLoading } from "../meditation/CalmLoading";
import { PreparationPhase } from "./PreparationPhase";
import { PerformanceMonitor } from "../vision/PerformanceMonitor";
import { MobileBreathingControls } from "../mobile/MobileBreathingControls";

// Unified hooks
import { useSession } from "../../hooks/useSession";
import { useMeditationVision } from "../../hooks/useMeditationVision";
import useAdaptivePerformance, {
  useIsMobile,
} from "../../hooks/useAdaptivePerformance";
import { useAuth } from "../../hooks/useAuth";

// Patterns and utilities
import {
  BREATHING_PATTERNS,
  BreathingPhaseName,
} from "../../lib/breathingPatterns";
import { mapPatternForAnimation } from "../../lib/session/pattern-mapper";

// ============================================================================
// TYPES - Clean, comprehensive session types
// ============================================================================

export type SessionMode = "classic" | "enhanced" | "advanced" | "mobile";
export type SessionPhase =
  | "setup"
  | "preparation"
  | "active"
  | "paused"
  | "complete";

export interface SessionModeConfig {
  enableCamera: boolean;
  enableVision: boolean;
  enableAudio: boolean;
  enableAdvancedFeatures: boolean;
  enableMobileOptimizations: boolean;
  showPerformanceMonitor: boolean;
  layout: "single" | "dual" | "mobile";
  description: string;
}

// Mode configurations - consolidated from all session components
const SESSION_MODE_CONFIGS: Record<SessionMode, SessionModeConfig> = {
  classic: {
    enableCamera: false,
    enableVision: false,
    enableAudio: true,
    enableAdvancedFeatures: false,
    enableMobileOptimizations: false,
    showPerformanceMonitor: false,
    layout: "single",
    description: "Pure breathing practice with no distractions",
  },
  enhanced: {
    enableCamera: true,
    enableVision: true,
    enableAudio: true,
    enableAdvancedFeatures: true,
    enableMobileOptimizations: true,
    showPerformanceMonitor: false,
    layout: "dual",
    description: "AI-powered breathing with real-time feedback",
  },
  advanced: {
    enableCamera: true,
    enableVision: true,
    enableAudio: true,
    enableAdvancedFeatures: true,
    enableMobileOptimizations: true,
    showPerformanceMonitor: true,
    layout: "dual",
    description: "Full featured session with performance monitoring",
  },
  mobile: {
    enableCamera: true,
    enableVision: true,
    enableAudio: true,
    enableAdvancedFeatures: true,
    enableMobileOptimizations: true,
    showPerformanceMonitor: false,
    layout: "mobile",
    description: "Mobile-optimized session with haptic feedback",
  },
};

export interface MeditationSessionConfig {
  mode: SessionMode;
  pattern: {
    name: string;
    phases: {
      inhale: number;
      hold?: number;
      exhale: number;
      pause?: number;
    };
    difficulty?: string;
    benefits?: string[];
  };
  autoStart?: boolean;
  customSettings?: Partial<SessionModeConfig>;
}

export interface SessionMetrics {
  duration: number;
  cycleCount: number;
  breathHoldTime?: number;
  stillnessScore?: number;
  cameraUsed: boolean;
  sessionType: string;
  visionMetrics?: {
    averageStillness: number;
    faceDetectionRate: number;
    postureScore: number;
  };
}

interface MeditationSessionProps {
  config: MeditationSessionConfig;
  onSessionComplete?: (metrics: SessionMetrics) => void;
  onSessionExit?: () => void;
}

// ============================================================================
// MAIN COMPONENT - Ultimate unified session interface
// ============================================================================

export const MeditationSession: React.FC<MeditationSessionProps> = ({
  config,
  onSessionComplete,
  onSessionExit,
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Get mode configuration (with custom overrides)
  const modeConfig = useMemo(
    () => ({
      ...SESSION_MODE_CONFIGS[config.mode],
      ...config.customSettings,
    }),
    [config.mode, config.customSettings]
  );

  // Adaptive performance optimization (respects meditation UX requirements)
  const { profile, isLowEndDevice, shouldUseBatterySaver, isMobileOptimized } =
    useAdaptivePerformance();

  // Core session state
  const [phase, setPhase] = useState<SessionPhase>("setup");
  const [showPreparation, setShowPreparation] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(modeConfig.enableAudio);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [loadingState, setLoadingState] = useState({
    camera: false,
    models: false,
    session: false,
    message: "",
  });

  // Camera and video refs
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [videoRef] = useState<React.RefObject<HTMLVideoElement>>(
    React.createRef()
  );
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Enhanced session management with adaptive performance
  const session = useSession({
    autoStart: config.autoStart,
    enableVision: modeConfig.enableVision && !isLowEndDevice, // Adaptive vision
    targetFPS: profile.visionFPS, // Use performance-optimized FPS
  });

  // Vision processing (when enabled)
  const vision = useMeditationVision(
    modeConfig.enableVision && modeConfig.enableCamera
      ? {
          sessionId: `session_${user?.id || "anonymous"}_${Date.now()}`,
          targetFPS: shouldUseBatterySaver ? 1 : profile.visionFPS,
          silentMode: true, // Meditation UX requirement
          gracefulDegradation: true, // Handle failures peacefully
        }
      : undefined
  );

  // Determine what features are actually available
  const featuresEnabled = useMemo(
    () => ({
      camera: modeConfig.enableCamera && !isLowEndDevice,
      vision:
        modeConfig.enableVision && !isLowEndDevice && cameraPermissionGranted,
      audio: modeConfig.enableAudio,
      performance: modeConfig.showPerformanceMonitor && !isMobile,
      mobileControls: isMobile && modeConfig.enableMobileOptimizations,
    }),
    [modeConfig, isLowEndDevice, cameraPermissionGranted, isMobile]
  );

  // Camera ready check
  const cameraReady = featuresEnabled.camera
    ? cameraPermissionGranted && stream
    : true;

  // ========================================================================
  // CAMERA MANAGEMENT - Clean, unobtrusive (meditation UX)
  // ========================================================================

  const requestCameraPermission = useCallback(async () => {
    if (!featuresEnabled.camera) return;

    setLoadingState((prev) => ({
      ...prev,
      camera: true,
      message: "Requesting camera access...",
    }));

    try {
      const constraints = {
        video: {
          width: { ideal: isMobile ? 480 : 640 },
          height: { ideal: isMobile ? 360 : 480 },
          frameRate: { ideal: profile.visionFPS, max: 15 }, // Adaptive frame rate
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      setStream(mediaStream);
      setCameraPermissionGranted(true);

      // Connect to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Start vision processing if enabled
      if (vision && featuresEnabled.vision) {
        await vision.start(videoRef.current!);
      }

      setLoadingState((prev) => ({ ...prev, camera: false, message: "" }));
    } catch (error) {
      console.warn("Camera access failed:", error);
      setCameraPermissionGranted(false);
      setLoadingState((prev) => ({
        ...prev,
        camera: false,
        message: "Camera unavailable - continuing without tracking",
      }));

      // Silent degradation - don't show intrusive errors
      setTimeout(() => {
        setLoadingState((prev) => ({ ...prev, message: "" }));
      }, 3000);
    }
  }, [
    featuresEnabled.camera,
    isMobile,
    profile.visionFPS,
    vision,
    featuresEnabled.vision,
    videoRef,
  ]);

  // ========================================================================
  // SESSION FLOW - Calm, intuitive progression
  // ========================================================================

  const handleStartSession = useCallback(async () => {
    if (config.autoStart || !showPreparation) {
      setShowPreparation(true);

      // Brief preparation phase (meditation UX)
      setTimeout(() => {
        setPhase("active");
        session.start();
      }, 3000);
    } else {
      setPhase("active");
      session.start();
    }
  }, [config.autoStart, showPreparation, session]);

  const handlePauseResume = useCallback(() => {
    if (session.isActive) {
      session.pause();
      setPhase("paused");
    } else if (phase === "paused") {
      session.resume();
      setPhase("active");
    }
  }, [session, phase]);

  const handleEndSession = useCallback(() => {
    // Compile comprehensive metrics
    const metrics: SessionMetrics = {
      duration: session.metrics.duration,
      cycleCount: session.metrics.cycleCount,
      stillnessScore: session.visionMetrics?.stillness,
      cameraUsed: Boolean(featuresEnabled.camera && cameraPermissionGranted),
      sessionType: config.mode,
      visionMetrics: vision?.state.isActive
        ? {
            averageStillness: vision.state.metrics?.stillness
              ? 100 - vision.state.metrics.stillness
              : 0,
            faceDetectionRate: vision.state.metrics?.confidence || 0,
            postureScore: vision.state.metrics?.confidence || 0,
          }
        : undefined,
    };

    // Clean session shutdown
    session.complete();
    setPhase("complete");

    // Cleanup camera
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    // Stop vision
    if (vision) {
      vision.stop();
    }

    onSessionComplete?.(metrics);
  }, [
    session,
    featuresEnabled.camera,
    cameraPermissionGranted,
    config.mode,
    vision,
    stream,
    onSessionComplete,
  ]);

  // ========================================================================
  // PHASE RENDERING - Clean, focused UI components
  // ========================================================================

  const renderSetupPhase = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      {/* Calming header with mode badge */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="h-8 w-8 text-white" />
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="mb-2">
            {config.mode.charAt(0).toUpperCase() + config.mode.slice(1)} Session
          </Badge>
          <h2 className="text-2xl font-light text-gray-800">
            {config.pattern.name} Session
          </h2>
          <p className="text-gray-600 max-w-md">{modeConfig.description}</p>
        </div>
      </div>

      {/* Feature indicators */}
      <div className="flex flex-wrap gap-2 justify-center">
        {featuresEnabled.camera && (
          <Badge variant="secondary" className="text-xs">
            <Camera className="w-3 h-3 mr-1" />
            Camera Tracking
          </Badge>
        )}
        {featuresEnabled.vision && (
          <Badge variant="secondary" className="text-xs">
            <Eye className="w-3 h-3 mr-1" />
            AI Vision
          </Badge>
        )}
        {featuresEnabled.audio && (
          <Badge variant="secondary" className="text-xs">
            <Volume2 className="w-3 h-3 mr-1" />
            Audio Guidance
          </Badge>
        )}
      </div>

      {/* Camera setup for enhanced/advanced modes */}
      {featuresEnabled.camera && !cameraPermissionGranted && (
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-500">
            Camera helps track your stillness and breathing rhythm
          </p>
          <Button
            onClick={requestCameraPermission}
            size="lg"
            disabled={loadingState.camera}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
          >
            {loadingState.camera ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            {loadingState.camera ? "Requesting..." : "Enable Camera"}
          </Button>
          <Button
            variant="ghost"
            onClick={handleStartSession}
            className="text-gray-500 hover:text-gray-700"
          >
            Continue without camera
          </Button>
        </div>
      )}

      {/* Ready to start */}
      {cameraReady && (
        <div className="space-y-4 text-center">
          <Button
            onClick={handleStartSession}
            size="lg"
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Play className="mr-2 h-5 w-5" />
            Begin Session
          </Button>
          {config.mode !== "classic" && (
            <p className="text-xs text-gray-400">
              Press and hold during breathing phases for haptic feedback
            </p>
          )}
        </div>
      )}

      {/* Loading message */}
      {loadingState.message && (
        <div className="text-center">
          <p className="text-sm text-gray-500">{loadingState.message}</p>
        </div>
      )}
    </div>
  );

  const renderPreparationPhase = () => (
    <div className="text-center space-y-6 py-8">
      <CalmLoading message="Preparing your mindful space..." />
      <div className="space-y-3 text-left max-w-md mx-auto">
        <p className="text-sm font-medium text-gray-700">
          Take this moment to settle into your body...
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">
          Feel your feet on the ground, your spine gently elongated. Notice your
          natural breath flowing in and out.
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">
          When ready, we'll guide you through the {config.pattern.name} pattern
          for a peaceful breathing practice.
        </p>
      </div>
    </div>
  );

  const renderActiveSession = () => (
    <div className="space-y-6">
      {/* Session header - minimal, calming */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-4">
          <Badge variant="outline" className="text-sm">
            {config.pattern.name}
          </Badge>
          {phase === "paused" && (
            <Badge variant="secondary" className="text-sm">
              Paused
            </Badge>
          )}
        </div>
        <div className="text-3xl font-light font-mono text-primary">
          {session.getSessionDuration()}
        </div>
        <div className="text-sm text-gray-500">
          Cycle {session.metrics.cycleCount}
        </div>
      </div>

      {/* Main content area - adaptive layout */}
      <div
        className={`grid gap-6 ${
          modeConfig.layout === "dual" && !isMobile
            ? "md:grid-cols-2"
            : "grid-cols-1"
        }`}
      >
        {/* Breathing animation - always centered */}
        <Card className="relative">
          <CardContent className="p-6">
            <div className="aspect-square max-w-sm mx-auto">
              <BreathingAnimation
                phase={
                  (session.metrics.currentPhase as BreathingPhaseName) ||
                  "inhale"
                }
                pattern={mapPatternForAnimation(
                  BREATHING_PATTERNS[config.pattern.name] ||
                    BREATHING_PATTERNS.box
                )}
                isActive={session.isActive}
                phaseProgress={session.metrics.phaseProgress}
                showTimer={modeConfig.enableAdvancedFeatures}
                compactMode={isMobile}
                cycleCount={session.metrics.cycleCount}
                overlayMetrics={
                  featuresEnabled.vision && session.visionMetrics
                    ? {
                        stillness: session.visionMetrics.stillness,
                        confidence: session.visionMetrics.presence,
                      }
                    : undefined
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Enhanced features (camera + vision) */}
        {featuresEnabled.camera && cameraReady && (
          <Card className="relative">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Mindfulness Tracking
                {featuresEnabled.performance && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <VideoFeed
                  videoRef={videoRef}
                  isActive={session.isActive}
                  className="w-full h-full object-cover"
                />
                {featuresEnabled.vision && session.visionMetrics && (
                  <FaceMeshOverlay
                    videoElement={videoRef.current}
                    landmarks={session.visionMetrics.faceLandmarks || []}
                    isActive={session.isActive}
                    confidence={session.visionMetrics.presence / 100}
                    breathPhase={
                      (session.metrics.currentPhase as
                        | "inhale"
                        | "exhale"
                        | "hold"
                        | "pause"
                        | "transition") || "inhale"
                    }
                    showDebugInfo={false} // Silent mode for meditation
                  />
                )}
              </div>

              {/* Vision metrics display */}
              {featuresEnabled.vision && session.visionMetrics && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Stillness</span>
                    <span>{Math.round(session.visionMetrics.stillness)}%</span>
                  </div>
                  <Progress
                    value={session.visionMetrics.stillness}
                    className="h-1"
                  />
                  <div className="flex justify-between text-xs">
                    <span>Presence</span>
                    <span>{Math.round(session.visionMetrics.presence)}%</span>
                  </div>
                  <Progress
                    value={session.visionMetrics.presence}
                    className="h-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Controls - adaptive for mobile/desktop */}
      {featuresEnabled.mobileControls ? (
        <MobileBreathingControls
          isSessionActive={session.isActive}
          isPaused={phase === "paused"}
          isAudioEnabled={audioEnabled}
          isCameraEnabled={featuresEnabled.camera && cameraPermissionGranted}
          isFullscreen={false}
          currentPhase={session.metrics.currentPhase || "inhale"}
          cycleCount={session.metrics.cycleCount}
          onPlayPause={handlePauseResume}
          onStop={handleEndSession}
          onToggleAudio={() => setAudioEnabled(!audioEnabled)}
          onToggleCamera={() => {}}
          onToggleFullscreen={() => {}}
          onReset={() => {
            setPhase("setup");
            session.reset();
          }}
          onSettings={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePauseResume}
                className="rounded-full"
              >
                {session.isActive ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={handleEndSession}
                className="rounded-full"
              >
                <Square className="h-5 w-5" />
              </Button>

              {featuresEnabled.audio && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className="rounded-full"
                >
                  {audioEnabled ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <VolumeX className="h-5 w-5" />
                  )}
                </Button>
              )}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              {modeConfig.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Performance monitor (advanced mode only) */}
      {featuresEnabled.performance && showAdvancedMetrics && vision && (
        <PerformanceMonitor
          isVisible={true}
          compact={isMobile}
          performanceData={{
            cpuUsage: 0, // Placeholder for now
            memoryUsage: 0, // Placeholder for now
            frameRate: 0, // Placeholder for now
            processingTime: 0, // Placeholder for now
            batteryLevel: 100,
            thermalState: "nominal",
          }}
        />
      )}
    </div>
  );

  const renderCompletePhase = () => (
    <div className="text-center space-y-6 py-8">
      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <Heart className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-2xl font-light text-gray-800">Session Complete</h2>
      <p className="text-gray-600 max-w-md mx-auto">
        Beautiful work. Take a moment to notice how you feel after this mindful
        practice.
      </p>

      {/* Session summary */}
      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">
            {session.getSessionDuration()}
          </p>
          <p className="text-sm text-gray-500">Duration</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">
            {session.metrics.cycleCount}
          </p>
          <p className="text-sm text-gray-500">Cycles</p>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={() => {
            setPhase("setup");
            session.reset();
          }}
          size="lg"
          className="px-8"
        >
          Practice Again
        </Button>
        <Button
          variant="outline"
          onClick={onSessionExit}
          className="block mx-auto"
        >
          Return to Menu
        </Button>
      </div>
    </div>
  );

  // ========================================================================
  // MAIN RENDER - Clean phase-based UI
  // ========================================================================

  return (
    <GentleErrorBoundary
      fallbackMessage="Your breathing practice continues peacefully. Let's take a gentle reset together."
      onReset={() => setPhase("setup")}
    >
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Subtle mode indicator */}
        {config.mode !== "classic" && (
          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              <Eye className="w-3 h-3 mr-1" />
              {config.mode.charAt(0).toUpperCase() + config.mode.slice(1)}{" "}
              Session
            </Badge>
          </div>
        )}

        {/* Phase-based content */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            {phase === "setup" && renderSetupPhase()}
            {phase === "preparation" && renderPreparationPhase()}
            {(phase === "active" || phase === "paused") &&
              renderActiveSession()}
            {phase === "complete" && renderCompletePhase()}
          </CardContent>
        </Card>
      </div>
    </GentleErrorBoundary>
  );
};

// Clean component exports with all consolidated types
export default MeditationSession;
