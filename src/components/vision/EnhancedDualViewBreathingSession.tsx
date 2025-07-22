/**
 * Enhanced Dual View Breathing Session
 * Shows breathing animation AND camera feed side-by-side with real-time AI feedback
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Camera,
  CameraOff,
  Play,
  Pause,
  Square,
  Brain,
  Eye,
  EyeOff,
  Activity,
  Volume2,
  VolumeX,
  Settings,
  Maximize2,
  Minimize2,
  Monitor,
  Gauge,
} from "lucide-react";

// Import our integrated hooks
import { useIntegratedVisionFeedback } from "../../hooks/useIntegratedVisionFeedback";
import { useBreathingSession } from "../../hooks/useBreathingSession";
import { useAuth } from "../../hooks/useAuth";

// Import existing components
import { BreathingVisualizer } from "../breathing/BreathingVisualizer";

// Camera display modes
type CameraDisplayMode = "focus" | "awareness" | "analysis";

interface CameraDisplayConfig {
  mode: CameraDisplayMode;
  showVideo: boolean;
  showOverlays: boolean;
  showMetrics: boolean;
}

interface EnhancedDualViewBreathingSessionProps {
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
  onSessionComplete?: (metrics: any) => void;
}

export const EnhancedDualViewBreathingSession: React.FC<
  EnhancedDualViewBreathingSessionProps
> = ({ pattern, onSessionComplete }) => {
  // Auth and session state
  const { user, isAuthenticated } = useAuth();
  const { state: sessionState, controls } = useBreathingSession();
  const { startSession, pauseSession, resumeSession, stopSession } = controls;

  // Integrated vision feedback with lazy loading
  const {
    isVisionActive,
    sessionMetrics,
    startVisionFeedback,
    stopVisionFeedback,
    provideFeedback,
    cameraStream,
    isStreamRequested,
    streamError,
    getCameraStream,
  } = useIntegratedVisionFeedback({
    enableRealTimeFeedback: true,
    feedbackThresholds: {
      restlessness: 0.7,
      movement: 0.6,
      posture: 0.5,
    },
    feedbackInterval: 30,
  });

  // Local state for UI
  const [sessionStarted, setSessionStarted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [cameraUserDisabled, setCameraUserDisabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>("inhale");
  const [cameraDisplayMode, setCameraDisplayMode] =
    useState<CameraDisplayMode>("focus");

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Get camera display configuration based on mode
   */
  const getCameraDisplayConfig = (
    mode: CameraDisplayMode
  ): CameraDisplayConfig => {
    switch (mode) {
      case "focus":
        return {
          mode: "focus",
          showVideo: false,
          showOverlays: false,
          showMetrics: false,
        };
      case "awareness":
        return {
          mode: "awareness",
          showVideo: false,
          showOverlays: true,
          showMetrics: true,
        };
      case "analysis":
        return {
          mode: "analysis",
          showVideo: true,
          showOverlays: true,
          showMetrics: true,
        };
      default:
        return getCameraDisplayConfig("focus");
    }
  };

  const displayConfig = getCameraDisplayConfig(cameraDisplayMode);

  /**
   * Request camera permission
   */
  const handleRequestCameraPermission = useCallback(async () => {
    try {
      // Request camera permission
      await getCameraStream();
      setCameraPermissionGranted(true);

      if (audioEnabled) {
        provideFeedback(
          "Camera access granted! You're ready to start your enhanced session.",
          "encouragement"
        );
      }
    } catch (error) {
      console.error("Camera permission denied:", error);
      setCameraPermissionGranted(false);

      if (audioEnabled) {
        provideFeedback(
          "Camera access denied. You can still enjoy an audio-guided session.",
          "guidance"
        );
      }
    }
  }, [getCameraStream, audioEnabled, provideFeedback]);

  /**
   * Disable camera access (user choice)
   */
  const handleDisableCamera = useCallback(() => {
    setCameraUserDisabled(true);
    setCameraEnabled(false);
    stopVisionFeedback();

    if (audioEnabled) {
      provideFeedback(
        "Camera disabled. Continuing with audio-only guidance.",
        "guidance"
      );
    }
  }, [stopVisionFeedback, audioEnabled, provideFeedback]);

  /**
   * Re-enable camera access
   */
  const handleEnableCamera = useCallback(async () => {
    setCameraUserDisabled(false);

    if (sessionStarted) {
      try {
        await startVisionFeedback(
          videoRef.current || undefined,
          canvasRef.current || undefined,
          cameraDisplayMode
        );
        setCameraEnabled(true);

        if (audioEnabled) {
          provideFeedback(
            "Camera re-enabled. Vision analysis is now active.",
            "encouragement"
          );
        }
      } catch (error) {
        console.error("Failed to re-enable camera:", error);
      }
    }
  }, [
    sessionStarted,
    startVisionFeedback,
    cameraDisplayMode,
    audioEnabled,
    provideFeedback,
  ]);

  /**
   * Start integrated session with camera
   */
  const handleStartSession = useCallback(async () => {
    try {
      if (cameraPermissionGranted && !cameraUserDisabled) {
        // Start vision feedback with lazy loading based on display mode
        await startVisionFeedback(
          videoRef.current || undefined,
          canvasRef.current || undefined,
          cameraDisplayMode
        );
        setCameraEnabled(true);
      }

      // Start breathing session
      startSession();
      setSessionStarted(true);

      // Welcome message
      if (audioEnabled) {
        const message =
          cameraPermissionGranted && !cameraUserDisabled
            ? `Welcome to your ${pattern.name} session. I'll be watching your breathing and providing guidance.`
            : `Welcome to your ${pattern.name} session. I'll provide audio guidance to help you breathe.`;
        provideFeedback(message, "encouragement");
      }

      console.log(
        `Enhanced dual view session started in ${cameraDisplayMode} mode`
      );
    } catch (error) {
      console.error("Failed to start session:", error);
      // Graceful fallback: Continue with AI audio coaching only
      startSession();
      setSessionStarted(true);
      setCameraEnabled(false);

      if (audioEnabled) {
        provideFeedback(
          "Camera unavailable, but I'll still provide AI coaching through audio guidance.",
          "guidance"
        );
      }
    }
  }, [
    cameraPermissionGranted,
    cameraUserDisabled,
    startVisionFeedback,
    startSession,
    pattern.name,
    provideFeedback,
    audioEnabled,
    cameraDisplayMode,
  ]);

  /**
   * Stop session
   */
  const handleStopSession = useCallback(() => {
    stopVisionFeedback();
    stopSession();
    setSessionStarted(false);
    setCameraEnabled(false);

    if (audioEnabled) {
      provideFeedback("Session complete. Well done!", "encouragement");
    }

    // Trigger completion callback
    if (onSessionComplete && sessionMetrics.visionMetrics) {
      onSessionComplete({
        ...sessionState,
        visionMetrics: sessionMetrics.visionMetrics,
        restlessnessAnalysis: sessionMetrics.restlessnessAnalysis,
        sessionQuality: sessionMetrics.sessionQuality,
        aiRecommendations: sessionMetrics.aiRecommendations,
      });
    }
  }, [
    stopVisionFeedback,
    stopSession,
    sessionMetrics,
    sessionState,
    onSessionComplete,
    audioEnabled,
    provideFeedback,
  ]);

  /**
   * Toggle pause/resume
   */
  const togglePause = useCallback(() => {
    if (sessionState.isPaused) {
      resumeSession();
    } else {
      pauseSession();
    }
  }, [sessionState.isPaused, resumeSession, pauseSession]);

  /**
   * Handle phase changes for contextual feedback
   */
  const handlePhaseChange = useCallback(
    (phase: string) => {
      setCurrentPhase(phase);

      // Provide phase-specific guidance based on current restlessness
      if (sessionMetrics.restlessnessAnalysis && audioEnabled) {
        const restlessness = sessionMetrics.restlessnessAnalysis.overall;

        if (restlessness > 0.6) {
          switch (phase) {
            case "inhale":
              provideFeedback(
                "Breathe in slowly and find your center.",
                "guidance"
              );
              break;
            case "hold":
              provideFeedback(
                "Hold steady, let stillness settle in.",
                "guidance"
              );
              break;
            case "exhale":
              provideFeedback("Release all tension as you exhale.", "guidance");
              break;
            case "pause":
              provideFeedback("Rest in this peaceful moment.", "guidance");
              break;
          }
        } else if (restlessness < 0.3) {
          // Occasional encouragement for good performance
          if (Math.random() < 0.3) {
            provideFeedback(
              "Beautiful stillness. You're in perfect harmony.",
              "encouragement"
            );
          }
        }
      }
    },
    [sessionMetrics.restlessnessAnalysis, audioEnabled, provideFeedback]
  );

  /**
   * Handle display mode changes with lazy loading
   */
  useEffect(() => {
    if (sessionStarted && cameraEnabled) {
      const config = getCameraDisplayConfig(cameraDisplayMode);

      // If switching to a mode that needs video and we don't have stream yet
      if (config.showVideo && !cameraStream && !isStreamRequested) {
        getCameraStream().catch((err) => {
          console.warn(
            "Failed to load camera stream for display mode change:",
            err
          );
        });
      }
    }
  }, [
    cameraDisplayMode,
    sessionStarted,
    cameraEnabled,
    cameraStream,
    isStreamRequested,
    getCameraStream,
  ]);

  /**
   * Render camera display mode selector
   */
  const renderCameraDisplayModeSelector = () => (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => setCameraDisplayMode("focus")}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
          cameraDisplayMode === "focus"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
        title="Focus Mode - Camera hidden, audio guidance only"
      >
        <EyeOff className="h-3 w-3" />
        Focus
      </button>
      <button
        onClick={() => setCameraDisplayMode("awareness")}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
          cameraDisplayMode === "awareness"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
        title="Awareness Mode - Quality indicators only"
      >
        <Gauge className="h-3 w-3" />
        Aware
      </button>
      <button
        onClick={() => setCameraDisplayMode("analysis")}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
          cameraDisplayMode === "analysis"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
        title="Analysis Mode - Full video feed with overlays"
      >
        <Monitor className="h-3 w-3" />
        Analyze
      </button>
    </div>
  );

  /**
   * Render camera feed with overlay
   */
  const renderCameraFeed = () => {
    // Show loading state when camera stream is being requested
    if (isStreamRequested && !cameraStream && !streamError) {
      return (
        <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-sm">Loading camera...</p>
            <p className="text-xs">Preparing vision analysis</p>
          </div>
        </div>
      );
    }

    // Show error state if camera stream failed
    if (streamError) {
      return (
        <div className="aspect-video bg-red-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-red-600">
            <CameraOff className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">Camera unavailable</p>
            <p className="text-xs">{streamError}</p>
            <Button
              onClick={() => getCameraStream().catch(console.warn)}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Retry Camera
            </Button>
          </div>
        </div>
      );
    }

    // Show camera unavailable only if permission was denied or stream failed
    if (!cameraEnabled && !cameraPermissionGranted) {
      return (
        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <CameraOff className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">Camera not available</p>
            <p className="text-xs">
              Session will continue without vision analysis
            </p>
          </div>
        </div>
      );
    }

    // Show user-disabled state
    if (!cameraEnabled && cameraPermissionGranted && cameraUserDisabled) {
      return (
        <div className="aspect-video bg-gradient-to-br from-orange-50 to-amber-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-600">
            <CameraOff className="h-12 w-12 mx-auto mb-3 text-orange-500" />
            <p className="text-sm font-medium">Camera Disabled</p>
            <p className="text-xs">You've chosen to disable camera access</p>
            <Button
              onClick={handleEnableCamera}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              <Camera className="mr-2 h-3 w-3" />
              Re-enable Camera
            </Button>
          </div>
        </div>
      );
    }

    // Show ready state when permission granted but session not started
    if (!cameraEnabled && cameraPermissionGranted && !cameraUserDisabled) {
      return (
        <div className="aspect-video bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-600">
            <Camera className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="text-sm font-medium">Camera Ready</p>
            <p className="text-xs">
              Vision analysis will activate when session starts
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs">Permission granted</span>
            </div>
          </div>
        </div>
      );
    }

    // Focus mode - show zen placeholder
    if (displayConfig.mode === "focus") {
      return (
        <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-600">
            <Brain className="h-12 w-12 mx-auto mb-3 text-purple-400" />
            <p className="text-sm font-medium">AI Vision Active</p>
            <p className="text-xs">Providing guidance through audio</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs">
                {cameraStream
                  ? "Camera loaded in background"
                  : "Loading camera..."}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Awareness mode - show metrics only
    if (displayConfig.mode === "awareness") {
      return (
        <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center relative">
          <div className="text-center text-gray-600">
            <Gauge className="h-12 w-12 mx-auto mb-3 text-blue-400" />
            <p className="text-sm font-medium">Session Awareness</p>
            <p className="text-xs">Quality metrics active</p>
          </div>

          {/* Floating metrics */}
          {sessionMetrics.visionMetrics && (
            <div className="absolute top-4 left-4 space-y-2">
              <div className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
                <Activity className="h-3 w-3 text-blue-500" />
                Quality: {sessionMetrics.sessionQuality}%
              </div>

              {sessionMetrics.restlessnessAnalysis && (
                <div
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm ${
                    sessionMetrics.restlessnessAnalysis.overall < 0.3
                      ? "bg-green-100/90 text-green-800"
                      : sessionMetrics.restlessnessAnalysis.overall < 0.6
                      ? "bg-yellow-100/90 text-yellow-800"
                      : "bg-red-100/90 text-red-800"
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  Stillness:{" "}
                  {Math.round(
                    (1 - sessionMetrics.restlessnessAnalysis.overall) * 100
                  )}
                  %
                </div>
              )}
            </div>
          )}

          {/* Current phase indicator */}
          <div className="absolute bottom-4 right-4">
            <div className="bg-blue-500/90 text-white px-3 py-1 rounded-full text-sm capitalize shadow-sm">
              {currentPhase}
            </div>
          </div>
        </div>
      );
    }

    // Analysis mode - full video feed with lazy loading
    return (
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {/* Video feed - only show when stream is available */}
        {cameraStream ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
              <p className="text-sm">Initializing camera...</p>
            </div>
          </div>
        )}

        {/* Vision analysis overlay */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Real-time metrics overlay */}
        {sessionMetrics.visionMetrics && displayConfig.showOverlays && (
          <div className="absolute top-4 left-4 space-y-2">
            {/* Quality indicator */}
            <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <Activity className="h-3 w-3" />
              Quality: {sessionMetrics.sessionQuality}%
            </div>

            {/* Stillness indicator */}
            {sessionMetrics.restlessnessAnalysis && (
              <div
                className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
                  sessionMetrics.restlessnessAnalysis.overall < 0.3
                    ? "bg-green-500/80 text-white"
                    : sessionMetrics.restlessnessAnalysis.overall < 0.6
                    ? "bg-yellow-500/80 text-black"
                    : "bg-red-500/80 text-white"
                }`}
              >
                <Eye className="h-3 w-3" />
                Stillness:{" "}
                {Math.round(
                  (1 - sessionMetrics.restlessnessAnalysis.overall) * 100
                )}
                %
              </div>
            )}

            {/* Current phase indicator */}
            <div className="bg-blue-500/80 text-white px-3 py-1 rounded-full text-sm capitalize">
              {currentPhase}
            </div>
          </div>
        )}

        {/* AI feedback indicator */}
        {audioEnabled && (
          <div className="absolute top-4 right-4">
            <div className="bg-purple-500/80 text-white p-2 rounded-full">
              <Brain className="h-4 w-4" />
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render breathing animation
   */
  const renderBreathingAnimation = () => (
    <div className="aspect-video">
      <BreathingVisualizer
        pattern={{
          name: pattern.name,
          phases: {
            inhale: pattern.phases.inhale,
            hold: pattern.phases.hold,
            exhale: pattern.phases.exhale,
            pause: pattern.phases.pause,
          },
          difficulty: pattern.difficulty,
          benefits: pattern.benefits,
        }}
        isActive={sessionState.isRunning}
      />
    </div>
  );

  /**
   * Render session controls
   */
  const renderControls = () => (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        {!sessionStarted ? (
          <>
            {!cameraPermissionGranted ? (
              <Button
                onClick={handleRequestCameraPermission}
                size="lg"
                variant="outline"
              >
                <Camera className="mr-2 h-4 w-4" />
                Enable Camera for AI Vision
              </Button>
            ) : null}
            <Button onClick={handleStartSession} size="lg">
              <Play className="mr-2 h-4 w-4" />
              {cameraPermissionGranted
                ? "Start Enhanced Session"
                : "Start Audio Session"}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={togglePause} variant="outline">
              {sessionState.isRunning ? (
                <Pause className="mr-2 h-4 w-4" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {sessionState.isRunning ? "Pause" : "Resume"}
            </Button>
            <Button onClick={handleStopSession} variant="destructive">
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => setAudioEnabled(!audioEnabled)}
          variant="outline"
          size="icon"
          title={audioEnabled ? "Disable AI Audio" : "Enable AI Audio"}
        >
          {audioEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </Button>

        {/* Camera toggle - only show if permission was granted */}
        {cameraPermissionGranted && (
          <Button
            onClick={
              cameraUserDisabled ? handleEnableCamera : handleDisableCamera
            }
            variant="outline"
            size="icon"
            title={cameraUserDisabled ? "Enable Camera" : "Disable Camera"}
          >
            {cameraUserDisabled ? (
              <CameraOff className="h-4 w-4" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
        )}

        <Button
          onClick={() => setIsFullscreen(!isFullscreen)}
          variant="outline"
          size="icon"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  /**
   * Render real-time AI recommendations
   */
  const renderAIRecommendations = () => {
    if (!sessionMetrics.aiRecommendations.length) return null;

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            AI Guidance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sessionMetrics.aiRecommendations.slice(0, 2).map((rec, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="text-purple-500 mt-1">•</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div
      className={`mx-auto p-4 space-y-6 ${
        isFullscreen ? "fixed inset-0 z-50 bg-white" : "max-w-6xl"
      }`}
    >
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-500" />
            Enhanced Vision Breathing Session
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{pattern.name}</Badge>
            <Badge variant={isVisionActive ? "default" : "secondary"}>
              {isVisionActive ? "Vision Active" : "Vision Inactive"}
            </Badge>
            <Badge variant={cameraEnabled ? "default" : "outline"}>
              {cameraEnabled ? "Camera On" : "Camera Off"}
            </Badge>
            <Badge variant={audioEnabled ? "default" : "outline"}>
              {audioEnabled ? "AI Audio On" : "AI Audio Off"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>{renderControls()}</CardContent>
      </Card>

      {/* Main dual view - responsive for mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Left: Breathing Animation */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Breathing Guide</CardTitle>
          </CardHeader>
          <CardContent>{renderBreathingAnimation()}</CardContent>
        </Card>

        {/* Right: Camera Feed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Vision Analysis
              </div>
              {cameraEnabled && renderCameraDisplayModeSelector()}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderCameraFeed()}</CardContent>
        </Card>
      </div>

      {/* Session stats and AI recommendations */}
      {sessionStarted && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Session Stats */}
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {Math.floor(sessionState.breathHoldTime / 60)}m
              </div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {sessionState.cycleCount}
              </div>
              <div className="text-sm text-muted-foreground">Cycles</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {sessionMetrics.sessionQuality}%
              </div>
              <div className="text-sm text-muted-foreground">Quality</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Recommendations */}
      {sessionStarted && renderAIRecommendations()}
    </div>
  );
};
