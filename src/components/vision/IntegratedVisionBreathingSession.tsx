/**
 * Integrated Vision Breathing Session
 * Demonstrates the complete integration of vision analysis, AI feedback, and social primitives
 * Follows DRY, CLEAN, ORGANISED, MODULAR principles
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Alert, AlertDescription } from "../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Camera,
  CameraOff,
  Play,
  Pause,
  Square,
  Brain,
  Share2,
  Settings,
  Eye,
  Activity,
  TrendingUp,
  MessageCircle,
  Coins,
  Shield,
} from "lucide-react";

// Import our integrated hooks
import { useIntegratedVisionFeedback } from "../../hooks/useIntegratedVisionFeedback";
import { useEnhancedSession } from "../../hooks/useEnhancedSession";
import { useAuth } from "../../hooks/useAuth";

// Import existing components
import { BreathingVisualizer } from "../breathing/BreathingVisualizer";
import { BreathingSessionPost } from "../social/BreathingSessionPost";

interface IntegratedVisionBreathingSessionProps {
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

export const IntegratedVisionBreathingSession: React.FC<
  IntegratedVisionBreathingSessionProps
> = ({ pattern, onSessionComplete }) => {
  // Auth and session state
  const { user, isAuthenticated } = useAuth();
  const {
    state: sessionState,
    isActive: isSessionActive,
    start: startSession,
    pause: pauseSession,
    stop: stopSession,
    getSessionDuration,
  } = useEnhancedSession();

  // Integrated vision feedback
  const {
    isVisionActive,
    sessionMetrics,
    startVisionFeedback,
    stopVisionFeedback,
    shareSessionWithVision,
    mintPatternWithVisionData,
    updateConfig,
    provideFeedback,
  } = useIntegratedVisionFeedback({
    enableRealTimeFeedback: true,
    feedbackThresholds: {
      restlessness: 0.7,
      movement: 0.6,
      posture: 0.5,
    },
    feedbackInterval: 30,
  });

  // Local state
  const [activeTab, setActiveTab] = useState("session");
  const [showSettings, setShowSettings] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  /**
   * Start integrated session with vision feedback
   */
  const handleStartSession = useCallback(async () => {
    try {
      // Start vision feedback first
      await startVisionFeedback();

      // Start breathing session
      startSession();

      setSessionStarted(true);
      console.log("Integrated vision breathing session started");
    } catch (error) {
      console.error("Failed to start integrated session:", error);
      // Provide fallback feedback
      provideFeedback(
        "Vision system unavailable, but you can still enjoy your breathing practice.",
        "guidance"
      );
    }
  }, [startVisionFeedback, startSession, pattern.name, provideFeedback]);

  /**
   * Stop integrated session
   */
  const handleStopSession = useCallback(() => {
    stopVisionFeedback();
    stopSession();
    setSessionStarted(false);

    // Trigger completion callback with integrated metrics
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
  ]);

  /**
   * Handle social sharing with vision data
   */
  const handleShare = useCallback(async () => {
    try {
      await shareSessionWithVision();
      provideFeedback(
        "Your session has been shared with the community!",
        "encouragement"
      );
    } catch (error) {
      console.error("Failed to share session:", error);
      provideFeedback(
        "Sharing failed, but your practice was still valuable.",
        "guidance"
      );
    }
  }, [shareSessionWithVision, provideFeedback]);

  /**
   * Handle NFT minting with vision data
   */
  const handleMintNFT = useCallback(async () => {
    try {
      await mintPatternWithVisionData();
      provideFeedback(
        "Your breathing pattern has been minted as an NFT!",
        "encouragement"
      );
    } catch (error) {
      console.error("Failed to mint NFT:", error);
      provideFeedback(
        "Minting failed, but your pattern is still saved locally.",
        "guidance"
      );
    }
  }, [mintPatternWithVisionData, provideFeedback]);

  /**
   * Render vision metrics display
   */
  const renderVisionMetrics = () => {
    if (!sessionMetrics.visionMetrics || !sessionMetrics.restlessnessAnalysis) {
      return (
        <Alert>
          <Eye className="h-4 w-4" />
          <AlertDescription>
            Vision analysis will appear here once the session starts.
          </AlertDescription>
        </Alert>
      );
    }

    const { visionMetrics, restlessnessAnalysis, sessionQuality } =
      sessionMetrics;

    return (
      <div className="space-y-4">
        {/* Overall Quality Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Session Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-primary">
                {sessionQuality}%
              </div>
              <Progress value={sessionQuality} className="flex-1" />
            </div>
          </CardContent>
        </Card>

        {/* Restlessness Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Stillness Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Overall:</span>
                <Badge
                  variant={
                    restlessnessAnalysis.overall < 0.3 ? "default" : "secondary"
                  }
                  className="ml-2"
                >
                  {Math.round((1 - restlessnessAnalysis.overall) * 100)}%
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Trend:</span>
                <Badge
                  variant={
                    restlessnessAnalysis.trend === "improving"
                      ? "default"
                      : "outline"
                  }
                  className="ml-2"
                >
                  {restlessnessAnalysis.trend}
                </Badge>
              </div>
            </div>

            {/* Component Breakdown */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                Component Analysis:
              </div>
              {Object.entries(restlessnessAnalysis.components).map(
                ([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <span className="w-20 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}:
                    </span>
                    <Progress
                      value={(1 - value) * 100}
                      className="flex-1 h-2"
                    />
                    <span className="w-8 text-right">
                      {Math.round((1 - value) * 100)}%
                    </span>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        {sessionMetrics.aiRecommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {sessionMetrics.aiRecommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  /**
   * Render session controls
   */
  const renderSessionControls = () => (
    <div className="flex gap-2">
      {!sessionStarted ? (
        <Button onClick={handleStartSession} className="flex-1">
          <Play className="mr-2 h-4 w-4" />
          Start Vision Session
        </Button>
      ) : (
        <>
          <Button
            onClick={() => (isSessionActive ? pauseSession() : startSession())}
            variant="outline"
          >
            {isSessionActive ? (
              <Pause className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isSessionActive ? "Pause" : "Resume"}
          </Button>
          <Button onClick={handleStopSession} variant="destructive">
            <Square className="mr-2 h-4 w-4" />
            Stop
          </Button>
        </>
      )}

      <Button
        onClick={() => setShowSettings(!showSettings)}
        variant="outline"
        size="icon"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );

  /**
   * Render social integration
   */
  const renderSocialIntegration = () => (
    <div className="space-y-4">
      {/* Lens V3 Social Integration */}
      <BreathingSessionPost
        sessionData={{
          patternName: pattern.name,
          duration: sessionState.sessionData.duration,
          score: sessionMetrics.sessionQuality,
          breathHoldTime: 0, // Vision sessions don't track breath holds
          cycles: 0, // Will be tracked separately
          insights: sessionMetrics.aiRecommendations,
        }}
        onPublished={(txHash) => {
          provideFeedback(
            "Session shared successfully on Lens!",
            "encouragement"
          );
          console.log("Published to Lens:", txHash);
        }}
      />

      {/* Additional Actions */}
      {sessionStarted && sessionMetrics.visionMetrics && (
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleShare} variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share with Vision Data
          </Button>
          <Button onClick={handleMintNFT} variant="outline" size="sm">
            <Coins className="mr-2 h-4 w-4" />
            Mint Vision NFT
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Vision-Enhanced Breathing Session
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{pattern.name}</Badge>
            <Badge variant={isVisionActive ? "default" : "secondary"}>
              {isVisionActive ? "Vision Active" : "Vision Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>{renderSessionControls()}</CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="session">Session</TabsTrigger>
          <TabsTrigger value="metrics">Vision Metrics</TabsTrigger>
          <TabsTrigger value="social">Social & NFT</TabsTrigger>
        </TabsList>

        <TabsContent value="session" className="space-y-4">
          {/* Breathing Visualizer */}
          <Card>
            <CardContent className="p-6">
              <BreathingVisualizer
                pattern={pattern}
                isActive={isSessionActive}
              />
            </CardContent>
          </Card>

          {/* Session Stats */}
          {sessionStarted && (
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">
                    {Math.floor(sessionState.sessionData.duration / 60)}m
                  </div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">
                    {sessionState.sessionData.cycleCount}
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
        </TabsContent>

        <TabsContent value="metrics">{renderVisionMetrics()}</TabsContent>

        <TabsContent value="social">{renderSocialIntegration()}</TabsContent>
      </Tabs>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vision Feedback Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">
                  Feedback Interval (seconds)
                </label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  defaultValue="30"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  onChange={(e) =>
                    updateConfig({ feedbackInterval: parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Restlessness Threshold
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  defaultValue="0.7"
                  className="w-full mt-1"
                  onChange={(e) =>
                    updateConfig({
                      feedbackThresholds: {
                        restlessness: parseFloat(e.target.value),
                        movement: 0.6,
                        posture: 0.5,
                      },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
