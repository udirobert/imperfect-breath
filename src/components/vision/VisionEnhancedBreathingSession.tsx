import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useLens } from "../../hooks/useLens";
import { useEnhancedSession } from "../../hooks/useEnhancedSession";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Alert, AlertDescription } from "../../components/ui/alert";
import {
  Camera,
  CameraOff,
  Settings,
  Activity,
  Eye,
  Zap,
  Battery,
  Cpu,
  LogIn,
  Share2,
} from "lucide-react";

import { VisionEngine, CameraManager, VisionManager } from "../../lib/vision";
import type {
  VisionTier,
  VisionMetrics,
  PerformanceMode,
  PerformanceMetrics,
} from "../../lib/vision/types";
import { BreathingVisualizer } from "../../components/breathing/BreathingVisualizer";

interface VisionEnhancedBreathingSessionProps {
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
  onShare?: (metrics: any) => void;
}

export const VisionEnhancedBreathingSession: React.FC<
  VisionEnhancedBreathingSessionProps
> = ({ pattern, onSessionComplete, onShare }) => {
  // Auth state
  const { user, isAuthenticated, loginWithEmail } = useAuth();
  const { currentAccount: lensAccount, isAuthenticated: isLensAuthenticated } =
    useLens();
  const isLensConnected = isLensAuthenticated && !!lensAccount;

  // Initialize the enhanced session hook
  const {
    state: sessionState,
    isActive: isSessionActive,
    start: startSession,
    stop: stopSession,
    getSessionDuration,
  } = useEnhancedSession();
  // Vision system state
  const [visionEnabled, setVisionEnabled] = useState(false);
  const [visionTier, setVisionTier] = useState<VisionTier>("loading");
  const [performanceMode, setPerformanceMode] =
    useState<PerformanceMode>("auto");
  const [visionMetrics, setVisionMetrics] = useState<VisionMetrics | null>(
    null
  );
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);

  // Camera state
  const [cameraPermission, setCameraPermission] = useState<
    "granted" | "denied" | "prompt"
  >("prompt");
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Local session state (complementing the enhanced session)
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [totalCycles] = useState(10); // Default to 10 cycles for vision sessions

  // Refs
  const visionManagerRef = useRef<VisionManager | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize vision manager
  useEffect(() => {
    visionManagerRef.current = VisionManager.getInstance();

    const visionManager = visionManagerRef.current;

    // Set up event listeners
    visionManager.onTierChange(setVisionTier);
    visionManager.onMetrics(setVisionMetrics);
    visionManager.onError((error) => {
      console.error("Vision error:", error);
      setCameraError(error.message);
    });

    return () => {
      // Cleanup on unmount
      if (visionManagerRef.current) {
        visionManagerRef.current.dispose();
      }
    };
  }, []);

  // Request camera permission and initialize vision
  const initializeVision = useCallback(async () => {
    try {
      setCameraError(null);

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: "user",
        },
      });

      videoStreamRef.current = stream;
      setCameraPermission("granted");

      // Initialize vision system
      const visionManager = visionManagerRef.current!;
      const tier = await visionManager.initialize(performanceMode);

      // Start vision processing
      await visionManager.startVision(stream);

      setVisionEnabled(true);
      setVisionTier(tier);

      // Start metrics collection
      startMetricsCollection();
    } catch (error) {
      console.error("Failed to initialize vision:", error);
      setCameraPermission("denied");
      setCameraError(
        error instanceof Error ? error.message : "Camera access failed"
      );
    }
  }, [performanceMode]);

  // Stop vision processing
  const stopVision = useCallback(async () => {
    if (visionManagerRef.current) {
      await visionManagerRef.current.stopVision();
    }

    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }

    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = null;
    }

    setVisionEnabled(false);
    setVisionMetrics(null);
  }, []);

  // Start collecting metrics and performance data
  const startMetricsCollection = useCallback(() => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
    }

    metricsIntervalRef.current = setInterval(async () => {
      if (visionManagerRef.current) {
        const metrics = await visionManagerRef.current.getMetrics();
        if (metrics) {
          setVisionMetrics(metrics);
        }
      }
    }, 1000); // Update every second
  }, []);

  // Handle performance mode change
  const handlePerformanceModeChange = useCallback(
    async (mode: PerformanceMode) => {
      if (visionManagerRef.current && visionEnabled) {
        setPerformanceMode(mode);
        const newTier = await visionManagerRef.current.switchMode(mode);
        setVisionTier(newTier);
      } else {
        setPerformanceMode(mode);
      }
    },
    [visionEnabled]
  );

  // Start breathing session
  const handleStartSession = useCallback(() => {
    // Start the enhanced session
    startSession();
    setCurrentCycle(0);

    // Auto-stop after 10 minutes
    setTimeout(() => {
      stopSession();
      setSessionCompleted(true);

      if (visionMetrics) {
        // Prepare session data with proper field names for the database
        const sessionData = {
          pattern_name: pattern.name,
          session_duration: sessionState.sessionData.duration,
          breath_hold_time: 0, // Vision sessions don't currently track breath holds in VisionMetrics
          restlessness_score: visionMetrics.restlessnessScore || 0,
          sessionType: "enhanced", // Explicitly mark as enhanced session
          cameraUsed: true, // Vision sessions always use camera
          visionMetrics: visionMetrics,
        };

        // Call the onSessionComplete callback if provided
        if (onSessionComplete) {
          onSessionComplete({
            ...sessionData,
            userId: user?.id || null,
            walletAddress: user?.wallet_address || null,
            lensId: lensAccount?.id || null,
          });
        }
      }
    }, 10 * 60 * 1000);
  }, [
    startSession,
    stopSession,
    getSessionDuration,
    visionMetrics,
    pattern,
    onSessionComplete,
    user,
    lensAccount,
  ]);

  // Stop breathing session
  const handleStopSession = useCallback(() => {
    // Stop the enhanced session
    stopSession();
    setSessionCompleted(true);

    if (visionMetrics) {
      // Prepare session data with proper field names for the database
      const sessionData = {
        pattern_name: pattern.name,
        session_duration: sessionState.sessionData.duration,
        breath_hold_time: 0, // Vision sessions don't currently track breath holds in VisionMetrics
        restlessness_score: visionMetrics.restlessnessScore || 0,
        sessionType: "enhanced", // Explicitly mark as enhanced session
        cameraUsed: true, // Vision sessions always use camera
        visionMetrics: visionMetrics,
      };

      // Call the onSessionComplete callback if provided
      if (onSessionComplete) {
        onSessionComplete({
          ...sessionData,
          userId: user?.id || null,
          walletAddress: user?.wallet_address || null,
          lensId: lensAccount?.id || null,
        });
      }
    }
  }, [
    stopSession,
    getSessionDuration,
    visionMetrics,
    pattern,
    onSessionComplete,
    user,
    lensAccount,
  ]);

  // Handle sharing session results to social platforms
  const handleShare = useCallback(() => {
    if (!visionMetrics) return;

    if (isLensConnected) {
      // Prepare session data for sharing
      const sessionData = {
        pattern_name: pattern.name,
        session_duration: sessionState.sessionData.duration,
        breath_hold_time: 0, // Vision sessions don't currently track breath holds in VisionMetrics
        restlessness_score: visionMetrics.restlessnessScore || 0,
        sessionType: "enhanced", // Explicitly mark as enhanced session
        cameraUsed: true, // Vision sessions always use camera
        visionMetrics: visionMetrics,
      };

      // Call the onShare callback if provided
      if (onShare) {
        onShare({
          ...sessionData,
          userId: user?.id || null,
          lensId: lensAccount?.id || null,
        });
      }
    } else {
      // Prompt to connect to Lens
      alert("Please connect to Lens Protocol to share your results");
    }
  }, [
    getSessionDuration,
    visionMetrics,
    pattern,
    onShare,
    isLensConnected,
    user,
    lensAccount,
  ]);

  // Render vision metrics display
  const renderVisionMetrics = () => {
    if (!visionMetrics) return null;

    const getMetricColor = (value: number, reverse = false) => {
      if (reverse) value = 1 - value;
      if (value > 0.7) return "text-green-600";
      if (value > 0.4) return "text-yellow-600";
      return "text-red-600";
    };

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Basic metrics available in all tiers */}
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {visionMetrics.confidence
              ? Math.round(visionMetrics.confidence * 100)
              : 0}
            %
          </div>
          <div className="text-sm text-gray-600">Confidence</div>
        </div>

        {/* Movement level */}
        {"movementLevel" in visionMetrics && (
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${getMetricColor(
                1 - visionMetrics.movementLevel
              )}`}
            >
              {Math.round(visionMetrics.movementLevel * 100)}%
            </div>
            <div className="text-sm text-gray-600">Stillness</div>
          </div>
        )}

        {/* Breathing rate */}
        {"estimatedBreathingRate" in visionMetrics && (
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(visionMetrics.estimatedBreathingRate || 0)}
            </div>
            <div className="text-sm text-gray-600">Breaths/min</div>
          </div>
        )}

        {/* Posture quality (standard+ tiers) */}
        {"postureQuality" in visionMetrics && (
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${getMetricColor(
                visionMetrics.postureQuality || 0
              )}`}
            >
              {Math.round((visionMetrics.postureQuality || 0) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Posture</div>
          </div>
        )}

        {/* Restlessness score */}
        {"restlessnessScore" in visionMetrics && (
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${getMetricColor(
                1 - (visionMetrics.restlessnessScore || 0)
              )}`}
            >
              {Math.round((1 - (visionMetrics.restlessnessScore || 0)) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Calmness</div>
          </div>
        )}
      </div>
    );
  };

  // Render performance controls
  const renderPerformanceControls = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Vision Performance Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current tier display */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Tier:</span>
            <Badge
              variant={
                visionTier === "premium"
                  ? "default"
                  : visionTier === "standard"
                  ? "secondary"
                  : "outline"
              }
            >
              {visionTier.charAt(0).toUpperCase() + visionTier.slice(1)}
            </Badge>
          </div>

          {/* Performance mode selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Performance Mode:</label>
            <div className="flex gap-2">
              {(["performance", "auto", "quality"] as PerformanceMode[]).map(
                (mode) => (
                  <Button
                    key={mode}
                    variant={performanceMode === mode ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePerformanceModeChange(mode)}
                    className="flex items-center gap-1"
                  >
                    {mode === "performance" && <Zap className="w-4 h-4" />}
                    {mode === "auto" && <Activity className="w-4 h-4" />}
                    {mode === "quality" && <Eye className="w-4 h-4" />}
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Performance metrics */}
          {performanceMetrics && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Cpu className="w-4 h-4" />
                  <span className="text-sm">CPU</span>
                </div>
                <Progress value={performanceMetrics.cpuUsage} className="h-2" />
                <span className="text-xs text-gray-600">
                  {Math.round(performanceMetrics.cpuUsage)}%
                </span>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm">FPS</span>
                </div>
                <div className="text-lg font-bold">
                  {Math.round(performanceMetrics.frameRate)}
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Battery className="w-4 h-4" />
                  <span className="text-sm">Battery</span>
                </div>
                <Progress
                  value={performanceMetrics.batteryImpact}
                  className="h-2"
                />
                <span className="text-xs text-gray-600">
                  {Math.round(performanceMetrics.batteryImpact)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Enhanced Breathing Session: {pattern.name}</span>
            <div className="flex items-center gap-2">
              {visionEnabled && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  AI Vision Active
                </Badge>
              )}
              <Badge variant="outline">{pattern.difficulty}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Benefits: {pattern.benefits.join(", ")}
          </p>

          {/* Vision toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium">AI Vision Coaching</h3>
              <p className="text-sm text-gray-600">
                Get real-time feedback on your breathing, posture, and focus
              </p>
            </div>
            <Button
              onClick={visionEnabled ? stopVision : initializeVision}
              variant={visionEnabled ? "destructive" : "default"}
              className="flex items-center gap-2"
            >
              {visionEnabled ? (
                <CameraOff className="w-4 h-4" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              {visionEnabled ? "Disable Vision" : "Enable Vision"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Camera error */}
      {cameraError && (
        <Alert>
          <AlertDescription>
            Camera Error: {cameraError}. You can still practice without vision
            features.
          </AlertDescription>
        </Alert>
      )}

      {/* Performance controls (only when vision is enabled) */}
      {visionEnabled && renderPerformanceControls()}

      {/* Main breathing interface */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Breathing visualizer */}
        <Card>
          <CardContent className="p-6">
            <BreathingVisualizer pattern={pattern} isActive={isSessionActive} />

            <div className="mt-6 text-center space-y-4">
              <div className="text-2xl font-bold">
                {Math.floor(sessionState.sessionData.duration / 60)}:
                {(sessionState.sessionData.duration % 60)
                  .toString()
                  .padStart(2, "0")}
              </div>

              {!isAuthenticated ? (
                <div className="space-y-4">
                  <Button
                    onClick={() => (window.location.href = "/login")}
                    size="lg"
                    variant="outline"
                    className="w-full flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Login to Save Progress
                  </Button>
                  <Button
                    onClick={handleStartSession}
                    size="lg"
                    variant="default"
                    className="w-full"
                  >
                    Try Without Login
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    onClick={
                      isSessionActive ? handleStopSession : handleStartSession
                    }
                    size="lg"
                    variant={isSessionActive ? "destructive" : "default"}
                    className="w-full"
                  >
                    {isSessionActive ? "Stop Session" : "Start Session"}
                  </Button>

                  {!isSessionActive &&
                    sessionState.sessionData.duration > 0 && (
                      <Button
                        onClick={handleShare}
                        size="sm"
                        variant="outline"
                        className="w-full flex items-center gap-2"
                        disabled={!isLensConnected}
                      >
                        <Share2 className="w-4 h-4" />
                        Share Results
                      </Button>
                    )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vision metrics */}
        <Card>
          {isAuthenticated && (
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="flex items-center gap-1">
                {user?.email?.split("@")[0] || "User"}
              </Badge>
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Real-Time Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visionEnabled ? (
              renderVisionMetrics()
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Enable AI Vision to see real-time metrics</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
