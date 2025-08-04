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
  Clock,
  Target,
} from "lucide-react";

// Import our integrated hooks
import { useIntegratedVisionFeedback } from "../../hooks/useIntegratedVisionFeedback";
import { useEnhancedSession } from "../../hooks/useEnhancedSession";
import { useAuth } from "../../hooks/useAuth";

// Import existing components
import { BreathingVisualizer } from "../breathing/BreathingVisualizer";
import { EnhancedSessionCompleteModal } from "../unified/EnhancedSessionCompleteModal";

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
  const {
    state: sessionState,
    isActive: isSessionActive,
    initialize: initializeSession,
    start: startSession,
    pause: pauseSession,
    resume: resumeSession,
    stop: stopSession,
    getSessionDuration,
  } = useEnhancedSession();

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
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);

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
          showVideo: true, // Always show video when camera is enabled
          showOverlays: false,
          showMetrics: false,
        };
      case "awareness":
        return {
          mode: "awareness",
          showVideo: true, // Always show video when camera is enabled
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
      // Request camera permission and start stream immediately
      const stream = await getCameraStream();
      setCameraPermissionGranted(true);
      setCameraEnabled(true); // Enable camera display immediately

      // Connect stream to video element immediately if available
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn("Video autoplay failed:", playError);
        }
      }

      if (audioEnabled) {
        provideFeedback(
          "Camera access granted! You can see yourself now. Ready to start your enhanced session.",
          "encouragement"
        );
      }
    } catch (error) {
      console.error("Camera permission denied:", error);
      setCameraPermissionGranted(false);
      setCameraEnabled(false);

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
      // Initialize session first with proper configuration
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
          enableCamera: cameraPermissionGranted && !cameraUserDisabled,
          enableAI: true,
          enableAudio: audioEnabled,
        },
        cameraSettings: {
          displayMode: cameraDisplayMode,
          quality: "medium" as const,
        },
      };

      // Initialize and start session
      await initializeSession(sessionConfig);
      await startSession();
      setSessionStarted(true);

      // Then try to start vision feedback if camera is available
      if (cameraPermissionGranted && !cameraUserDisabled) {
        try {
          await startVisionFeedback(
            videoRef.current || undefined,
            canvasRef.current || undefined,
            cameraDisplayMode
          );
          // Camera is already enabled from permission grant
        } catch (visionError) {
          console.warn("Vision feedback failed to start:", visionError);

          if (audioEnabled) {
            provideFeedback(
              "Vision analysis unavailable, continuing with audio guidance.",
              "guidance"
            );
          }
        }
      }

      // Welcome message
      if (audioEnabled) {
        const message = cameraEnabled
          ? `Welcome to your ${pattern.name} session. I'll be watching your breathing and providing guidance.`
          : `Welcome to your ${pattern.name} session. I'll provide audio guidance to help you breathe.`;
        provideFeedback(message, "encouragement");
      }

      console.log(
        `Enhanced dual view session started in ${cameraDisplayMode} mode`
      );
    } catch (error) {
      console.error("Failed to start session:", error);

      // Try to start session anyway - don't let vision failures block the breathing session
      try {
        const fallbackConfig = {
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
            enableCamera: false,
            enableAI: false,
            enableAudio: audioEnabled,
          },
        };

        await initializeSession(fallbackConfig);
        await startSession();
        setSessionStarted(true);
        setCameraEnabled(false);

        if (audioEnabled) {
          provideFeedback(
            "Session started with basic features. Some advanced features may be unavailable.",
            "guidance"
          );
        }
      } catch (sessionError) {
        console.error("Critical session start failure:", sessionError);
        if (audioEnabled) {
          provideFeedback(
            "Unable to start session. Please try again.",
            "guidance"
          );
        }
      }
    }
  }, [
    pattern,
    cameraPermissionGranted,
    cameraUserDisabled,
    audioEnabled,
    cameraDisplayMode,
    initializeSession,
    startSession,
    startVisionFeedback,
    provideFeedback,
    cameraEnabled,
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

    // Prepare completion data and show modal
    const sessionCompletionData = {
      patternName: pattern.name,
      duration: sessionState.sessionData.duration || getSessionDuration(),
      cycleCount: sessionState.sessionData.cycleCount || 0,
      sessionQuality: sessionMetrics.sessionQuality || 85,
      restlessnessScore: sessionMetrics.restlessnessAnalysis?.overall || 0,
      restlessnessAnalysis: sessionMetrics.restlessnessAnalysis,
      visionMetrics: sessionMetrics.visionMetrics,
      aiRecommendations: sessionMetrics.aiRecommendations || [
        "Great focus throughout the session!",
        "Your breathing rhythm was consistent.",
        "Consider extending your next session for deeper benefits.",
      ],
    };

    setCompletionData(sessionCompletionData);
    setShowCompletionModal(true);

    // Trigger completion callback
    if (onSessionComplete) {
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
    pattern.name,
    getSessionDuration,
    onSessionComplete,
    audioEnabled,
    provideFeedback,
  ]);

  /**
   * Toggle pause/resume
   */
  const togglePause = useCallback(() => {
    if (isSessionActive) {
      pauseSession();
    } else {
      resumeSession();
    }
  }, [isSessionActive, resumeSession, pauseSession]);

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
   * Connect camera stream to video element when available
   */
  useEffect(() => {
    if (videoRef.current && cameraStream && cameraEnabled) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((error) => {
        console.warn("Video play failed:", error);
      });
    }
  }, [cameraStream, cameraEnabled]);

  /**
   * Listen to session state changes to update current phase
   */
  useEffect(() => {
    if (sessionState.sessionData.currentPhase) {
      setCurrentPhase(sessionState.sessionData.currentPhase);
      handlePhaseChange(sessionState.sessionData.currentPhase);
    }
  }, [sessionState.sessionData.currentPhase, handlePhaseChange]);

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
        title="Focus Mode - Clean camera view with minimal overlays"
      >
        <Eye className="h-3 w-3" />
        Clean
      </button>
      <button
        onClick={() => setCameraDisplayMode("awareness")}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
          cameraDisplayMode === "awareness"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
        title="Awareness Mode - Camera with quality indicators"
      >
        <Gauge className="h-3 w-3" />
        Metrics
      </button>
      <button
        onClick={() => setCameraDisplayMode("analysis")}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
          cameraDisplayMode === "analysis"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
        title="Analysis Mode - Full camera feed with detailed overlays"
      >
        <Monitor className="h-3 w-3" />
        Detailed
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

    // Show camera preview when permission granted but session not started
    if (cameraPermissionGranted && !sessionStarted && !cameraUserDisabled) {
      return (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {/* Video preview - show user themselves */}
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
                <p className="text-sm">Loading camera preview...</p>
              </div>
            </div>
          )}

          {/* Ready overlay */}
          <div className="absolute top-4 left-4">
            <div className="bg-green-500/90 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              Camera Ready
            </div>
          </div>

          {/* Instructions overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/70 text-white p-3 rounded-lg text-center">
              <p className="text-sm font-medium mb-1">Camera Preview Active</p>
              <p className="text-xs opacity-90">
                You can see yourself now. Click "Start Enhanced Session" when
                ready.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // All modes now show the camera feed when available
    return (
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {/* Video feed - always show when stream is available */}
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

        {/* Face Mesh Visualization - only show in detailed mode */}
        {displayConfig.mode === "analysis" && sessionMetrics.visionMetrics && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Face detection indicators */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-32 h-32 border-2 border-green-400/60 rounded-full animate-pulse" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-400 rounded-full" />
            </div>
            {/* Breathing detection indicator */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
              <div className="bg-black/70 text-white px-3 py-1 rounded-full text-xs">
                Face detected - Analyzing breathing
              </div>
            </div>
          </div>
        )}

        {/* Real-time metrics overlay - only show based on display mode */}
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
          </div>
        )}

        {/* Session phase indicator - always visible */}
        {sessionStarted && (
          <div className="absolute top-4 right-4">
            <div className="bg-blue-500/80 text-white px-3 py-1 rounded-full text-sm capitalize">
              {sessionState.sessionData.currentPhase}
            </div>
          </div>
        )}

        {/* AI feedback indicator */}
        {audioEnabled && (
          <div className="absolute top-16 right-4">
            <div className="bg-purple-500/80 text-white p-2 rounded-full">
              <Brain className="h-4 w-4" />
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render breathing animation with enhanced progress indicators
   */
  const renderBreathingAnimation = () => (
    <div className="aspect-video relative">
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
        isActive={isSessionActive}
      />

      {/* Simple session info overlay - no duplicate progress bar */}
      {sessionStarted && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    sessionState.sessionData.currentPhase === "inhale"
                      ? "bg-blue-500 animate-pulse"
                      : sessionState.sessionData.currentPhase === "hold"
                      ? "bg-yellow-500 animate-pulse"
                      : sessionState.sessionData.currentPhase === "exhale"
                      ? "bg-green-500 animate-pulse"
                      : "bg-purple-500 animate-pulse"
                  }`}
                />
                <span className="text-sm font-medium capitalize">
                  {sessionState.sessionData.currentPhase}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600">
                  Cycle {sessionState.sessionData.cycleCount}
                </div>
                <div className="text-xs text-gray-500">
                  {sessionState.sessionData.phaseDuration
                    ? `${sessionState.sessionData.phaseDuration}s`
                    : pattern.phases[
                        sessionState.sessionData
                          .currentPhase as keyof typeof pattern.phases
                      ] + "s"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /**
   * Render session controls
   */
  const renderControls = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex gap-3 flex-wrap justify-center sm:justify-start">
        {!sessionStarted ? (
          <>
            {!cameraPermissionGranted ? (
              <Button
                onClick={handleRequestCameraPermission}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium px-6 py-3 rounded-xl shadow-lg transition-all duration-200"
              >
                <Camera className="mr-2 h-4 w-4" />
                Enable Camera for AI Vision
              </Button>
            ) : null}
            <Button
              onClick={handleStartSession}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium px-8 py-3 rounded-xl shadow-lg transition-all duration-200"
            >
              <Play className="mr-2 h-4 w-4" />
              {cameraPermissionGranted
                ? "Begin Mindful Session"
                : "Start Audio Session"}
            </Button>
            {cameraPermissionGranted && (
              <Button
                onClick={handleDisableCamera}
                variant="outline"
                size="sm"
                className="bg-white/70 border-gray-300 text-gray-700 hover:bg-white/90 rounded-lg"
              >
                <CameraOff className="mr-2 h-3 w-3" />
                Disable Camera
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              onClick={togglePause}
              variant="outline"
              className="bg-white/70 border-gray-300 text-gray-700 hover:bg-white/90 rounded-lg px-6 py-2"
            >
              {isSessionActive ? (
                <Pause className="mr-2 h-4 w-4" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {isSessionActive ? "Pause" : "Resume"}
            </Button>
            <Button
              onClick={handleStopSession}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium px-6 py-2 rounded-lg shadow-md transition-all duration-200"
            >
              <Square className="mr-2 h-4 w-4" />
              Complete Session
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
          className={`rounded-lg transition-all duration-200 ${
            audioEnabled
              ? "bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200"
              : "bg-white/70 border-gray-300 text-gray-500 hover:bg-white/90"
          }`}
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
            className={`rounded-lg transition-all duration-200 ${
              !cameraUserDisabled
                ? "bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200"
                : "bg-white/70 border-gray-300 text-gray-500 hover:bg-white/90"
            }`}
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
          className="bg-white/70 border-gray-300 text-gray-700 hover:bg-white/90 rounded-lg transition-all duration-200"
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
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-gray-800 flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Brain className="h-3 w-3 text-white" />
            </div>
            AI Guidance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessionMetrics.aiRecommendations.slice(0, 2).map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-white/60 rounded-lg"
              >
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-700">{rec}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div
        className={`mx-auto p-4 space-y-6 ${
          isFullscreen
            ? "fixed inset-0 z-50 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
            : "max-w-6xl"
        }`}
        style={{
          background: isFullscreen
            ? undefined
            : "linear-gradient(135deg, rgba(239, 246, 255, 0.6) 0%, rgba(238, 242, 255, 0.6) 50%, rgba(243, 232, 255, 0.6) 100%)",
        }}
      >
        {/* Header */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-3 text-2xl font-light text-gray-800">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Eye className="h-5 w-5 text-white" />
              </div>
              Mindful Breathing Session
            </CardTitle>
            <p className="text-gray-600 font-light mt-2">
              Enhanced with AI vision guidance for deeper awareness
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              <Badge
                variant="outline"
                className="bg-white/50 text-gray-700 border-gray-300"
              >
                {pattern.name}
              </Badge>
              <Badge
                variant={isVisionActive ? "default" : "secondary"}
                className={
                  isVisionActive
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }
              >
                {isVisionActive ? "Vision Active" : "Vision Inactive"}
              </Badge>
              <Badge
                variant={cameraEnabled ? "default" : "outline"}
                className={
                  cameraEnabled
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 border-gray-300"
                }
              >
                {cameraEnabled ? "Camera On" : "Camera Off"}
              </Badge>
              <Badge
                variant={audioEnabled ? "default" : "outline"}
                className={
                  audioEnabled
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 text-gray-600 border-gray-300"
                }
              >
                {audioEnabled ? "AI Audio On" : "AI Audio Off"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>{renderControls()}</CardContent>
        </Card>

        {/* Main dual view - responsive for mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Left: Breathing Animation */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-gray-800 flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <Activity className="h-3 w-3 text-white" />
                </div>
                Breathing Guide
              </CardTitle>
            </CardHeader>
            <CardContent>{renderBreathingAnimation()}</CardContent>
          </Card>

          {/* Right: Camera Feed */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                    <Camera className="h-3 w-3 text-white" />
                  </div>
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
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 mx-auto mb-3 text-blue-500" />
                <div className="text-2xl font-bold text-gray-800">
                  {Math.floor(sessionState.sessionData.duration / 60)}m
                </div>
                <div className="text-sm text-gray-600">Duration</div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 mx-auto mb-3 text-green-500" />
                <div className="text-2xl font-bold text-gray-800">
                  {sessionState.sessionData?.cycleCount || 0}
                </div>
                <div className="text-sm text-gray-600">Cycles</div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Activity className="w-8 h-8 mx-auto mb-3 text-purple-500" />
                <div className="text-2xl font-bold text-gray-800">
                  {sessionMetrics.sessionQuality}%
                </div>
                <div className="text-sm text-gray-600">Quality</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Recommendations */}
        {sessionStarted && renderAIRecommendations()}
      </div>

      {/* Session Completion Modal */}
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
    </>
  );
};
