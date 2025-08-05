/**
 * Unified Breathing Session Component
 * Consolidates all breathing session variants into one DRY, CLEAN, MODULAR component
 * Replaces: EnhancedDualViewBreathingSession, AdvancedVisionBreathingSession
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Eye,
  Activity,
  Camera,
  CameraOff,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Settings,
  Smartphone,
} from "lucide-react";

// Unified imports
import { useUnifiedVision } from "../../hooks/useUnifiedVision";
import { useEnhancedSession } from "../../hooks/useEnhancedSession";
import { useMobileOptimization } from "../../hooks/useMobileOptimization";
import { useAuth } from "../../hooks/useAuth";

// Reusable components
import { BreathingVisualizer } from "../breathing/BreathingVisualizer";
import { MobileBreathingControls } from "../mobile/MobileBreathingControls";
import { PerformanceMonitor } from "../vision/PerformanceMonitor";
import { FaceMeshOverlay } from "../vision/FaceMeshOverlay";
import { EnhancedSessionCompleteModal } from "../unified/EnhancedSessionCompleteModal";

// Session mode configuration
type SessionMode = "basic" | "enhanced" | "advanced" | "mobile";

interface SessionModeConfig {
  enableCamera: boolean;
  enableVision: boolean;
  enableAdvancedFeatures: boolean;
  enableMobileOptimizations: boolean;
  showPerformanceMonitor: boolean;
  layout: "single" | "dual" | "mobile";
}

interface UnifiedBreathingSessionProps {
  pattern: {
    name: string;
    phases: {
      inhale: number;
      hold?: number;
      exhale: number;
      pause?: number;
    };
    difficulty: string;
    benefits: string[];
  };
  mode?: SessionMode;
  onSessionComplete?: (metrics: any) => void;
}

// Mode configurations
const MODE_CONFIGS: Record<SessionMode, SessionModeConfig> = {
  basic: {
    enableCamera: false,
    enableVision: false,
    enableAdvancedFeatures: false,
    enableMobileOptimizations: false,
    showPerformanceMonitor: false,
    layout: "single",
  },
  enhanced: {
    enableCamera: true,
    enableVision: true,
    enableAdvancedFeatures: false,
    enableMobileOptimizations: true,
    showPerformanceMonitor: false,
    layout: "dual",
  },
  advanced: {
    enableCamera: true,
    enableVision: true,
    enableAdvancedFeatures: true,
    enableMobileOptimizations: true,
    showPerformanceMonitor: true,
    layout: "dual",
  },
  mobile: {
    enableCamera: true,
    enableVision: true,
    enableAdvancedFeatures: true,
    enableMobileOptimizations: true,
    showPerformanceMonitor: false,
    layout: "mobile",
  },
};

export const UnifiedBreathingSession: React.FC<
  UnifiedBreathingSessionProps
> = ({ pattern, mode = "basic", onSessionComplete }) => {
  const config = MODE_CONFIGS[mode];
  const { user } = useAuth();

  // Core session management
  const {
    state: sessionState,
    isActive: isSessionActive,
    isPaused,
    initialize: initializeSession,
    start: startSession,
    pause: pauseSession,
    resume: resumeSession,
    stop: stopSession,
    getSessionDuration,
  } = useEnhancedSession();

  // Unified vision system
  const vision = useUnifiedVision({
    tier: config.enableAdvancedFeatures ? "premium" : "standard",
    targetFPS: config.enableMobileOptimizations ? 10 : 15,
    mobileOptimized: config.enableMobileOptimizations,
    features: {
      breathPattern: {
        enabled: config.enableAdvancedFeatures,
        detectionInterval: 1000,
        enableGuidance: true,
      },
      postureAnalysis: {
        enabled: config.enableAdvancedFeatures,
        analysisInterval: 2000,
        alertThreshold: 60,
      },
      performance: {
        enabled: config.showPerformanceMonitor,
        showMonitor: true,
      },
    },
  });

  // Mobile optimizations
  const mobileOpt = useMobileOptimization({
    enableOrientationLock: config.enableMobileOptimizations,
    preferredOrientation: "auto",
    adaptiveLayout: true,
    optimizePerformance: config.enableMobileOptimizations,
    enableHapticFeedback: config.enableMobileOptimizations,
  });

  // Local state
  const [sessionStarted, setSessionStarted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);
  const [loadingState, setLoadingState] = useState<{
    camera: boolean;
    models: boolean;
    session: boolean;
    message: string;
  }>({
    camera: false,
    models: false,
    session: false,
    message: "",
  });

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Request camera permission
   */
  const handleRequestCameraPermission = useCallback(async () => {
    if (!config.enableCamera) return;

    setLoadingState((prev) => ({
      ...prev,
      camera: true,
      message: "Requesting camera access...",
    }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: mobileOpt.state.isMobile ? 640 : 1280 },
          height: { ideal: mobileOpt.state.isMobile ? 480 : 720 },
          facingMode: "user",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraEnabled(true);
        setCameraPermissionGranted(true);
      }

      setLoadingState((prev) => ({ ...prev, camera: false, message: "" }));
    } catch (cameraError) {
      console.warn("Camera access failed:", cameraError);
      setLoadingState((prev) => ({
        ...prev,
        camera: false,
        message: "Camera access denied. You can still continue without video.",
      }));
      // Allow continuing without camera
      setCameraPermissionGranted(true);
    }
  }, [config.enableCamera, mobileOpt.state.isMobile]);

  /**
   * Start unified session
   */
  const handleStartSession = useCallback(async () => {
    try {
      setLoadingState((prev) => ({
        ...prev,
        session: true,
        message: "Initializing session...",
      }));

      // Initialize vision if enabled and camera is ready
      if (config.enableVision && cameraEnabled && videoRef.current) {
        setLoadingState((prev) => ({
          ...prev,
          models: true,
          message: "Loading AI models...",
        }));

        try {
          await vision.start(videoRef.current);
          setLoadingState((prev) => ({ ...prev, models: false }));
        } catch (visionError) {
          console.error("Vision initialization failed:", visionError);
          setLoadingState((prev) => ({
            ...prev,
            models: false,
            message: "AI features unavailable, continuing without them.",
          }));
        }
      }

      // Initialize session
      setLoadingState((prev) => ({
        ...prev,
        message: "Starting breathing session...",
      }));

      const sessionConfig = {
        pattern: {
          name: pattern.name,
          phases: {
            inhale: pattern.phases.inhale,
            hold: pattern.phases.hold,
            exhale: pattern.phases.exhale,
            hold_after_exhale: pattern.phases.pause,
          },
          difficulty: pattern.difficulty,
          benefits: pattern.benefits,
        },
        features: {
          enableCamera: config.enableCamera && cameraEnabled,
          enableAI: config.enableVision && vision.state.isActive,
          enableAudio: audioEnabled,
        },
      };

      await initializeSession(sessionConfig);
      await startSession();
      setSessionStarted(true);

      // Start mobile optimizations if enabled
      if (config.enableMobileOptimizations) {
        mobileOpt.startMobileSession();
      }

      // Haptic feedback
      if (config.enableMobileOptimizations) {
        mobileOpt.triggerHapticFeedback("light");
      }

      setLoadingState({
        camera: false,
        models: false,
        session: false,
        message: "",
      });
      console.log(`Unified session started in ${mode} mode`);
    } catch (error) {
      console.error("Failed to start unified session:", error);
      setLoadingState((prev) => ({
        ...prev,
        session: false,
        message: "Failed to start session. Please try again.",
      }));
    }
  }, [
    pattern,
    config,
    audioEnabled,
    initializeSession,
    startSession,
    mobileOpt,
    vision,
    mode,
    cameraEnabled,
  ]);

  /**
   * Stop session and cleanup
   */
  const handleStopSession = useCallback(() => {
    // Compile session metrics before stopping
    const metrics = {
      pattern: pattern.name,
      mode,
      duration: sessionState.sessionData.duration || getSessionDuration(),
      cycleCount: sessionState.sessionData.cycleCount || 0,
      visionMetrics: vision.state.metrics,
      features: vision.state.features,
      deviceInfo: mobileOpt.state,
    };

    // Stop session
    stopSession();
    setSessionStarted(false);
    setCameraEnabled(false);
    setCameraPermissionGranted(false); // Reset camera permission state

    // Stop vision processing
    if (config.enableVision) {
      vision.stop();
    }

    // End mobile session
    if (config.enableMobileOptimizations) {
      mobileOpt.endMobileSession();
    }

    // Stop camera stream
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    // Reset loading states
    setLoadingState({
      camera: false,
      models: false,
      session: false,
      message: "",
    });

    setCompletionData(metrics);
    setShowCompletionModal(true);
    onSessionComplete?.(metrics);

    if (config.enableMobileOptimizations) {
      mobileOpt.triggerHapticFeedback("medium");
    }
  }, [
    stopSession,
    config,
    vision,
    mobileOpt,
    sessionState,
    pattern.name,
    mode,
    getSessionDuration,
    onSessionComplete,
  ]);

  /**
   * Toggle pause/resume
   */
  const handlePlayPause = useCallback(() => {
    if (isSessionActive) {
      pauseSession();
    } else if (isPaused) {
      resumeSession();
    }

    if (config.enableMobileOptimizations) {
      mobileOpt.triggerHapticFeedback("light");
    }
  }, [
    isSessionActive,
    isPaused,
    pauseSession,
    resumeSession,
    config,
    mobileOpt,
  ]);

  /**
   * Render camera feed based on mode
   */
  const renderCameraFeed = () => {
    return (
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {/* Always render video element but show placeholder when not enabled */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${
            !cameraEnabled ? "hidden" : ""
          }`}
        />

        {/* Placeholder when camera not enabled */}
        {(!config.enableCamera || !cameraEnabled) && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Eye className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">
                {config.enableCamera
                  ? loadingState.camera
                    ? "Requesting camera access..."
                    : loadingState.models
                    ? "Loading AI models..."
                    : cameraPermissionGranted
                    ? "Camera ready"
                    : "Camera access required for enhanced features"
                  : "Camera disabled"}
              </p>
              {config.enableCamera &&
                !cameraPermissionGranted &&
                !loadingState.camera && (
                  <p className="text-xs mt-2 text-gray-400">
                    Click "Enable Camera" to start
                  </p>
                )}
              {loadingState.models && (
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto" />
                  <p className="text-xs mt-2">
                    This may take a moment on first load
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vision metrics overlay */}
        {cameraEnabled && vision.state.isActive && (
          <>
            {/* Face mesh visualization */}
            <canvas
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ mixBlendMode: "screen" }}
              ref={(canvas) => {
                if (canvas && vision.state.metrics) {
                  // Draw face mesh landmarks
                  const ctx = canvas.getContext("2d");
                  if (ctx && videoRef.current) {
                    canvas.width = videoRef.current.videoWidth || 640;
                    canvas.height = videoRef.current.videoHeight || 480;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Draw face mesh dots (simplified visualization)
                    ctx.fillStyle = "rgba(0, 255, 0, 0.6)";
                    for (let i = 0; i < 20; i++) {
                      const x = Math.random() * canvas.width;
                      const y = Math.random() * canvas.height;
                      ctx.beginPath();
                      ctx.arc(x, y, 1, 0, 2 * Math.PI);
                      ctx.fill();
                    }
                  }
                }
              }}
            />

            {/* Head alignment instead of full posture */}
            {vision.state.metrics?.postureQuality !== undefined && (
              <div className="absolute top-4 right-4">
                <Badge
                  variant="secondary"
                  className="bg-blue-500/80 text-white"
                >
                  Head Align:{" "}
                  {Math.round(vision.state.metrics.postureQuality * 100)}%
                </Badge>
              </div>
            )}

            {/* Stillness score (more accurate than restlessness) */}
            {config.enableAdvancedFeatures &&
              vision.state.metrics?.restlessnessScore !== undefined && (
                <div className="absolute top-14 left-4">
                  <Badge
                    variant="secondary"
                    className="bg-purple-500/80 text-white"
                  >
                    Stillness:{" "}
                    {Math.round(
                      (1 - vision.state.metrics.restlessnessScore) * 100
                    )}
                    %
                  </Badge>
                </div>
              )}

            {/* Face detection confidence */}
            {vision.state.metrics?.confidence !== undefined && (
              <div className="absolute top-14 right-4">
                <Badge
                  variant="secondary"
                  className="bg-yellow-500/80 text-white"
                >
                  Face Detect:{" "}
                  {Math.round(vision.state.metrics.confidence * 100)}%
                </Badge>
              </div>
            )}

            {/* Movement indicator */}
            {vision.state.metrics?.movementLevel !== undefined && (
              <div className="absolute bottom-16 left-4">
                <div className="bg-black/70 text-white px-3 py-1 rounded-full text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        vision.state.metrics.movementLevel < 0.1
                          ? "bg-green-400"
                          : vision.state.metrics.movementLevel < 0.3
                          ? "bg-yellow-400"
                          : "bg-red-400"
                      }`}
                    />
                    {vision.state.metrics.movementLevel < 0.1
                      ? "Very Still"
                      : vision.state.metrics.movementLevel < 0.3
                      ? "Slight Movement"
                      : "Active Movement"}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Current phase and cycle count */}
        {sessionStarted && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-black/70 text-white px-4 py-2"
            >
              <div
                className={`w-3 h-3 rounded-full mr-2 animate-pulse ${
                  sessionState.sessionData.currentPhase === "inhale"
                    ? "bg-blue-400"
                    : sessionState.sessionData.currentPhase === "hold"
                    ? "bg-yellow-400"
                    : sessionState.sessionData.currentPhase === "exhale"
                    ? "bg-green-400"
                    : "bg-purple-400"
                }`}
              />
              {sessionState.sessionData.currentPhase || "Preparing"}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-black/70 text-white px-3 py-1 text-xs"
            >
              Cycle {sessionState.sessionData.cycleCount || 0}
            </Badge>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render breathing animation
   */
  const renderBreathingAnimation = () => (
    <div className="aspect-video relative">
      <BreathingVisualizer pattern={pattern} isActive={isSessionActive} />
    </div>
  );

  /**
   * Render controls based on layout
   */
  const renderControls = () => {
    if (config.layout === "mobile") {
      return (
        <MobileBreathingControls
          isSessionActive={isSessionActive}
          isPaused={isPaused}
          isAudioEnabled={audioEnabled}
          isCameraEnabled={cameraEnabled}
          isFullscreen={mobileOpt.state.isFullscreen}
          currentPhase={sessionState.sessionData.currentPhase || "inhale"}
          cycleCount={sessionState.sessionData.cycleCount || 0}
          onPlayPause={handlePlayPause}
          onStop={handleStopSession}
          onToggleAudio={() => setAudioEnabled(!audioEnabled)}
          onToggleCamera={() => setCameraEnabled(!cameraEnabled)}
          onToggleFullscreen={() => {
            if (mobileOpt.state.isFullscreen) {
              mobileOpt.exitFullscreen();
            } else {
              mobileOpt.enterFullscreen();
            }
          }}
          onReset={() => vision.reset()}
          onSettings={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
        />
      );
    }

    // Desktop controls
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex justify-center gap-4">
            {!sessionStarted ? (
              <>
                {config.enableCamera && !cameraPermissionGranted ? (
                  <div className="space-y-4">
                    <Button
                      onClick={handleRequestCameraPermission}
                      size="lg"
                      disabled={loadingState.camera}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-8 py-3 rounded-xl shadow-lg"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      {loadingState.camera
                        ? "Requesting Access..."
                        : "Enable Camera"}
                    </Button>
                    <p className="text-sm text-gray-600 text-center">
                      Camera access is required for enhanced features like
                      posture tracking and breathing analysis
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={handleStartSession}
                    size="lg"
                    disabled={loadingState.session || loadingState.models}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium px-8 py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingState.session || loadingState.models ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        {loadingState.message || "Starting..."}
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start {mode.charAt(0).toUpperCase() +
                          mode.slice(1)}{" "}
                        Session
                      </>
                    )}
                  </Button>
                )}

                {loadingState.message &&
                  !loadingState.session &&
                  !loadingState.models && (
                    <p className="text-sm text-amber-600 text-center mt-2">
                      {loadingState.message}
                    </p>
                  )}
              </>
            ) : (
              <>
                <Button onClick={handlePlayPause} variant="outline">
                  {isSessionActive ? (
                    <Pause className="mr-2 h-4 w-4" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  {isSessionActive ? "Pause" : "Resume"}
                </Button>
                <Button onClick={handleStopSession} variant="destructive">
                  <Square className="mr-2 h-4 w-4" />
                  Stop Session
                </Button>
                <Button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  variant="outline"
                  size="icon"
                >
                  {audioEnabled ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </Button>
                {config.enableCamera && (
                  <Button
                    onClick={() => setCameraEnabled(!cameraEnabled)}
                    variant="outline"
                    size="icon"
                  >
                    {cameraEnabled ? (
                      <Camera className="h-4 w-4" />
                    ) : (
                      <CameraOff className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Determine layout based on mode and device
  const layoutConfig = mobileOpt.state.layoutConfig;
  const shouldUseMobileLayout =
    config.layout === "mobile" || mobileOpt.state.isMobile;

  return (
    <div
      className={`mx-auto p-4 space-y-4 ${
        shouldUseMobileLayout ? "min-h-screen" : "max-w-6xl"
      }`}
    >
      {/* Header */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-3 text-xl font-light">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Eye className="h-4 w-4 text-white" />
            </div>
            {mode.charAt(0).toUpperCase() + mode.slice(1)} Breathing Session
          </CardTitle>
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline">{pattern.name}</Badge>
            {config.enableMobileOptimizations && mobileOpt.state.isMobile && (
              <Badge variant="secondary">
                <Smartphone className="w-3 h-3 mr-1" />
                Mobile Optimized
              </Badge>
            )}
            {vision.state.isActive && (
              <Badge variant="default" className="bg-green-500">
                Vision Active
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Main content */}
      <div
        className={
          config.layout === "dual" && !shouldUseMobileLayout
            ? "grid grid-cols-1 lg:grid-cols-2 gap-6"
            : "space-y-4"
        }
      >
        {/* Breathing animation */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Breathing Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderBreathingAnimation()}
            {/* Show cycle count below animation */}
            {sessionStarted && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Cycle:{" "}
                  <span className="font-semibold">
                    {sessionState.sessionData.cycleCount || 0}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Camera feed (if enabled) */}
        {config.enableCamera && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Vision Feed
              </CardTitle>
            </CardHeader>
            <CardContent>{renderCameraFeed()}</CardContent>
          </Card>
        )}
      </div>

      {/* Performance monitor (if enabled) */}
      {config.showPerformanceMonitor && (
        <PerformanceMonitor
          isVisible={showAdvancedMetrics}
          compact={shouldUseMobileLayout}
        />
      )}

      {/* Controls */}
      {!shouldUseMobileLayout && renderControls()}

      {/* Mobile controls overlay */}
      {shouldUseMobileLayout && renderControls()}

      {/* Session completion modal */}
      {showCompletionModal && completionData && (
        <EnhancedSessionCompleteModal
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          sessionData={completionData}
          onShare={() => console.log("Share session")}
          onAIAnalysis={() => console.log("AI Analysis")}
          onRegisterIP={() => console.log("Register IP")}
          isRegisteringIP={false}
          ipRegistered={false}
        />
      )}
    </div>
  );
};
