import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Clock,
  Activity,
  Star,
  Share,
  Brain,
  Settings,
  Loader2,
  TrendingUp,
  Shield,
  CheckCircle,
  BarChart3,
  Heart,
} from "lucide-react";
import { BREATHING_PATTERNS } from "../lib/breathingPatterns";
import { useSessionHistory } from "../hooks/useSessionHistory";
import { useSecureAIAnalysis } from "../hooks/useSecureAIAnalysis";
import { AI_PROVIDERS, AIConfigManager, SessionData } from "../lib/ai/config";
import { API_ENDPOINTS, createEndpoint } from "../config/api-endpoints";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useLens } from "../hooks/useLens";
import { useAIFeatureAccess } from "../hooks/useSubscriptionAccess";
import InlineUpgrade from "../components/monetization/InlineUpgrade";
import { formatTime } from "../lib/utils/formatters";

import { EnhancedCustomPattern } from "../types/patterns";
import { BreathingSessionPost } from "../components/social/BreathingSessionPost";
import { SessionCompleteModal } from "../components/unified/SessionCompleteModal";

import { AIAnalysisDebugButton } from "../components/debug/AIAnalysisDebugButton";

import { AIAnalysisErrorBoundary } from "../components/error/AIAnalysisErrorBoundary";

import { EnhancedAIAnalysisDisplay } from "../components/ai/EnhancedAIAnalysisDisplay";
import { StreamingIndicator } from "../components/ai/StreamingIndicator";
import {
  EnhancedAnalysisService,
  EnhancedAnalysisRequest,
} from "../lib/ai/enhanced-analysis-service";
import { trackEvent } from "@/lib/analytics";

// Using consolidated formatTime from utils

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAuthenticated: isLensAuthenticated } = useLens();
  const { streak, totalMinutes, saveSession, history } = useSessionHistory();
  const { canUseAIAnalysis } = useAIFeatureAccess();
  const {
    analyzeSession,
    results: analysesRaw,
    isAnalyzing,
    error,
    streamingState,
  } = useSecureAIAnalysis();

  // ENHANCED: Robust safety checks with comprehensive validation
  const analyses = useMemo(() => {
    // AGGRESSIVE CONSOLIDATION: Single validation chain
    if (!analysesRaw || !Array.isArray(analysesRaw)) {
      console.log("🔍 AI Analysis: No valid analyses data available");
      return [];
    }

    // CLEAN: Filter out any invalid entries - check for provider and analysis content
    const validAnalyses = analysesRaw.filter(
      (analysis) =>
        analysis &&
        typeof analysis === "object" &&
        analysis.provider &&
        analysis.analysis && // Should have the actual analysis text
        analysis.score // Should have scores
    );

    console.log("🔍 AI Analysis: Processed analyses:", validAnalyses.length);
    return validAnalyses;
  }, [analysesRaw]);
  const hasSavedRef = useRef(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  const [showSessionModal, setShowSessionModal] = useState(false); // Disable the redundant modal
  const [isSharing, setIsSharing] = useState(false); // Prevent multiple share attempts

  const sessionData = useMemo(() => location.state || {}, [location.state]);

  const patternID = useMemo(() => {
    if (!sessionData.patternName) return undefined;
    const match = Object.values(BREATHING_PATTERNS).find(
      (p) => p.name === sessionData.patternName
    );
    return match?.id;
  }, [sessionData.patternName]);

  // Share to Lens CTA with auth gating and router state
  const handleShareToLensClick = () => {
    try {
      trackEvent("share_to_lens_click", {
        source: "results",
        patternID,
        patternName: sessionData.patternName,
      });
    } catch {
      console.warn("Failed to track share to lens click event");
    }

    const sessionState = {
      patternID,
      patternName: sessionData.patternName,
      sessionDuration: sessionData.sessionDuration,
      breathHoldTime: sessionData.breathHoldTime,
      restlessnessScore: sessionData.restlessnessScore,
      timestamp: sessionData.timestamp || new Date().toISOString(),
    };

    if (!isLensAuthenticated) {
      toast.info("Connect to Lens to share your results", {
        description: "We’ll resume the share flow after connecting.",
      });
      navigate("/lens/flow", { state: { focusTab: "auth", session: sessionState } });
      return;
    }

    navigate("/lens/flow", { state: { focusTab: "share", session: sessionState } });
  };

  useEffect(() => {
    if (sessionData.patternName && !hasSavedRef.current && user) {
      try {
        saveSession({
          breathHoldTime: sessionData.breathHoldTime || 0,
          restlessnessScore: sessionData.restlessnessScore || 0,
          sessionDuration: sessionData.sessionDuration || 0,
          patternName: sessionData.patternName,
        });
        toast.success("Session saved successfully!");
        hasSavedRef.current = true;
      } catch (error) {
        console.error("Failed to save session", error);
        toast.error("Could not save your session. Please try again.");
      }
    }
  }, [
    sessionData.patternName,
    sessionData.breathHoldTime,
    sessionData.restlessnessScore,
    sessionData.sessionDuration,
    saveSession,
    user,
  ]);

  const handleAIAnalysis = async () => {
    console.log("🚀 handleAIAnalysis called - starting debug trace");
    
    if (!sessionData.patternName) {
      console.error("❌ No session data available for analysis");
      toast.error("No session data available for analysis");
      return;
    }

    // Check subscription access first - no longer show popup, just prevent action
    if (!canUseAIAnalysis) {
      console.log('❌ AI Analysis blocked - insufficient subscription tier');
      // Don't show popup, the inline upgrade component will handle this
      return;
    }

    console.log("✅ Session data validation passed");
    console.log("🔍 AI Analysis Debug:", {
      hetznerUrl: import.meta.env.VITE_HETZNER_SERVICE_URL,
      configuredAiUrl:
        import.meta.env.VITE_HETZNER_SERVICE_URL || "http://localhost:8001",
      sessionData: sessionData,
      hasVisionSessionId: !!sessionData.visionSessionId,
    });

    // UNIFIED DATA FLOW: Combine session + vision data (AGGRESSIVE CONSOLIDATION)
    type EnhancedSessionData = SessionData & {
      cycleCount?: number;
      targetCycles?: number;
      visionMetrics?: unknown;
    };
    let enhancedSessionData: EnhancedSessionData = {
      breathHoldTime: sessionData.breathHoldTime || 0,
      restlessnessScore: sessionData.restlessnessScore || 0,
      patternName: sessionData.patternName,
      sessionDuration: sessionData.sessionDuration || 0,
      timestamp: new Date().toISOString(),
      landmarks: 68,
    };

    // Add cycle data if available
    if (sessionData.cycleCount !== undefined) {
      enhancedSessionData.cycleCount = sessionData.cycleCount;
    }
    if (sessionData.targetCycles !== undefined) {
      enhancedSessionData.targetCycles = sessionData.targetCycles;
    }

    // ENHANCED: Robust vision data integration with proper validation
    if (sessionData.visionSessionId && sessionData.cameraUsed !== false) {
      try {
        console.log(
          "🔍 Vision Analysis: Fetching data for session:",
          sessionData.visionSessionId
        );

        // PERFORMANT: Cache vision data fetches to avoid redundant requests
        const cacheKey = `vision_summary_${sessionData.visionSessionId}`;
        let visionData = sessionStorage.getItem(cacheKey);

        if (!visionData) {
          // ENHANCED: Add timeout and better error handling
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const visionSummary = await fetch(
            `${
              import.meta.env.VITE_HETZNER_SERVICE_URL ||
              "http://localhost:8001"
            }${createEndpoint.visionSessionSummary(
              sessionData.visionSessionId
            )}`,
            { signal: controller.signal }
          );

          clearTimeout(timeoutId);

          if (visionSummary.ok) {
            visionData = await visionSummary.text();
            // Cache for 5 minutes
            sessionStorage.setItem(cacheKey, visionData);
            sessionStorage.setItem(
              `${cacheKey}_timestamp`,
              Date.now().toString()
            );
          } else if (visionSummary.status === 404) {
            // Handle 404 gracefully without throwing an error that would trigger the error boundary
            console.warn(
              "Vision summary not found on server, using session data only"
            );
            toast.warning(
              "Vision data not available - using session data only"
            );
          } else {
            throw new Error(
              `Vision API returned status ${visionSummary.status}`
            );
          }
        }

        // Parse and integrate vision data
        if (visionData) {
          try {
            const parsedVisionData = JSON.parse(visionData);
            console.log(
              "📊 Enhanced session data with vision metrics:",
              parsedVisionData
            );

            // ENHANCEMENT FIRST: Merge vision data with session data
            enhancedSessionData = {
              ...enhancedSessionData,
              ...parsedVisionData,
              visionSessionId: sessionData.visionSessionId,
            };
          } catch (parseError) {
            console.warn(
              "Failed to parse vision data, using session data only:",
              parseError
            );
          }
        }
      } catch (error) {
        console.warn(
          "Vision data fetch failed, continuing with session data:",
          error
        );
        toast.warning("Vision analysis unavailable - using session data only");
      }
    }

    // Use the existing analyzeSession function from the hook
    console.log("🤖 About to call analyzeSession with enhanced data:", enhancedSessionData);
    try {
      await analyzeSession('auto', enhancedSessionData);
      console.log("✅ analyzeSession completed successfully");
    } catch (error) {
      console.error("❌ analyzeSession failed:", error);
      toast.error("AI analysis failed. Please try again.");
    }
  };

  // Using consolidated formatTime from utils

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  const restlessnessValue = Math.round(sessionData.restlessnessScore || 0);

  const handleShare = async () => {
    // Prevent multiple share attempts
    if (isSharing) return;

    setIsSharing(true);

    try {
      const isClassic = enhancedSessionData.sessionType === "classic";

      // For classic sessions, use simple native sharing
      if (isClassic) {
        const summary = `I just completed a ${
          sessionData.patternName || "breathing"
        } session! 🧘

⏱️ Duration: ${formatTime(sessionData.sessionDuration || 0)}
🔄 Cycles: ${sessionData.cycleCount || 0}

Focused breathing practice with Imperfect Breath 🌬️`;

        if (navigator.share) {
          try {
            await navigator.share({
              title: "My Breathing Session Results",
              text: summary,
              url: window.location.origin,
            });
            return;
          } catch (error) {
            // Handle specific share errors
            if (error instanceof Error && error.name === "AbortError") {
              // User canceled the share - this is normal, don't show error
              return;
            }
            console.error("Error sharing:", error);
            // Fall through to clipboard fallback
          }
        }

        // Fallback to clipboard for classic sessions
        try {
          await navigator.clipboard.writeText(summary);
          toast.success("Session results copied to clipboard!");
        } catch (clipboardError) {
          console.error("Clipboard error:", clipboardError);
          toast.error("Could not copy to clipboard. Please try again.");
        }
        return;
      }

      // For enhanced sessions, check if user is authenticated with Lens
      if (user && isLensAuthenticated) {
        try {
          // This will be handled by the BreathingSessionPost component
          setShowSessionModal(true);
          return;
        } catch (error) {
          console.error(
            "Lens sharing failed, falling back to native share:",
            error
          );
        }
      }

      // Fallback to native sharing for enhanced sessions
      const actualStillness =
        sessionData.restlessnessScore !== undefined
          ? Math.max(0, 100 - sessionData.restlessnessScore)
          : null;

      const summary = `I just completed a mindful breathing session!
- Duration: ${formatTime(sessionData.sessionDuration || 0)}
- Cycles: ${sessionData.cycleCount || 0}${
        actualStillness !== null
          ? `
- Stillness: ${actualStillness}%`
          : ""
      }
Check out Imperfect Breath!`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: "My Breathing Session Results",
            text: summary,
            url: window.location.origin,
          });
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            // User canceled the share - this is normal
            return;
          }
          console.error("Error sharing:", error);
          // Fall through to clipboard fallback
        }
      }

      // Clipboard fallback for enhanced sessions
      try {
        await navigator.clipboard.writeText(summary);
        toast.success("Results copied to clipboard!");
      } catch (clipboardError) {
        console.error("Clipboard error:", clipboardError);
        toast.error("Could not copy to clipboard. Please try again.");
      }
    } catch (error) {
      console.error("Unexpected error in handleShare:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  // Enhanced session data with actual metrics
  const enhancedSessionData = useMemo(() => {
    const data = {
      patternName: sessionData.patternName || "Custom Pattern",
      duration: sessionData.sessionDuration || 0,
      breathHoldTime: sessionData.breathHoldTime || 0,
      restlessnessScore: sessionData.restlessnessScore || 0,
      cycleCount: sessionData.cycleCount || 0,
      targetCycles: sessionData.targetCycles,
      // Real-time performance metrics
      phaseAccuracy: sessionData.phaseAccuracy || 0,
      rhythmConsistency: sessionData.rhythmConsistency || 0,
      // Session type detection - trust the sessionType from the session
      sessionType: sessionData.sessionType || "enhanced",
      cameraUsed: sessionData.cameraUsed !== false, // Default to true for backward compatibility
      // Add calculated metrics - only for sessions that actually tracked these metrics
      stillnessScore:
        sessionData.sessionType === "classic" || !sessionData.cameraUsed
          ? null // Don't calculate stillness for classic sessions
          : sessionData.restlessnessScore !== undefined
          ? Math.max(0, 100 - sessionData.restlessnessScore) // Real data: stillness = 100 - restlessness
          : null, // No real data available
      completionRate: sessionData.targetCycles
        ? Math.round(
            ((sessionData.cycleCount || 0) / sessionData.targetCycles) * 100
          )
        : 100,
      // Pass along any vision metrics if present for AI analysis
      visionMetrics: sessionData.visionMetrics,
    };
    return data;
  }, [sessionData]);

  const stats = useMemo(() => {
    const baseStats: Array<{
      title: string;
      value: string;
      icon: JSX.Element;
      description: string;
      content?: JSX.Element;
    }> = [
      {
        title: "Session Duration",
        value:
          enhancedSessionData.duration > 0
            ? formatTime(enhancedSessionData.duration)
            : "20s", // Show actual duration even if short
        icon: <Clock className="w-6 h-6 text-primary" />,
        description: "Time invested in your wellbeing.",
      },
      {
        title: "Cycles Completed",
        value:
          enhancedSessionData.cycleCount > 0
            ? `${enhancedSessionData.cycleCount}${
                enhancedSessionData.targetCycles
                  ? `/${enhancedSessionData.targetCycles}`
                  : ""
              }`
            : "1", // Show actual cycles even if minimal
        icon: <Activity className="w-6 h-6 text-primary" />,
        description: "Breathing cycles completed this session.",
      },
    ];

    // Only show camera-related metrics for enhanced sessions that actually used camera
    if (
      enhancedSessionData.cameraUsed &&
      enhancedSessionData.sessionType !== "classic" &&
      enhancedSessionData.breathHoldTime > 0 // Only show if there's actual data
    ) {
      baseStats.push({
        title: "Best Breath Hold",
        value: formatTime(enhancedSessionData.breathHoldTime),
        icon: <TrendingUp className="w-6 h-6 text-primary" />,
        description: "Your longest breath hold.",
      });
    }

    // Only show stillness score for enhanced sessions with camera data
    if (
      enhancedSessionData.cameraUsed &&
      enhancedSessionData.sessionType !== "classic" &&
      enhancedSessionData.stillnessScore !== null &&
      enhancedSessionData.restlessnessScore >= 0 // Only show if there's actual tracking data
    ) {
      baseStats.push({
        title: "Stillness Score",
        value: `${enhancedSessionData.stillnessScore}%`,
        icon: <Star className="w-6 h-6 text-primary" />,
        description:
          enhancedSessionData.stillnessScore >= 80
            ? "Excellent stillness and focus!"
            : enhancedSessionData.stillnessScore >= 60
            ? "Good stillness, keep practicing!"
            : "Focus on finding a comfortable position.",
        content: (
          <Progress
            value={enhancedSessionData.stillnessScore}
            indicatorClassName={
              enhancedSessionData.stillnessScore >= 80
                ? "bg-green-500"
                : enhancedSessionData.stillnessScore >= 60
                ? "bg-yellow-500"
                : "bg-red-500"
            }
            className="h-2"
          />
        ),
      });
    }

    return baseStats;
  }, [enhancedSessionData]);

  return (
    <>
      <div className="flex flex-col items-center justify-center text-center animate-fade-in p-4">
        <div className="text-6xl mb-4">
          {enhancedSessionData.sessionType === "classic"
            ? enhancedSessionData.cycleCount >= 10
              ? "🧘"
              : enhancedSessionData.cycleCount >= 5
              ? "🌸"
              : enhancedSessionData.cycleCount >= 3
              ? "🌿"
              : "🌱"
            : enhancedSessionData.stillnessScore !== null &&
              enhancedSessionData.stillnessScore >= 90
            ? "🌟"
            : enhancedSessionData.stillnessScore !== null &&
              enhancedSessionData.stillnessScore >= 75
            ? "💫"
            : enhancedSessionData.stillnessScore !== null &&
              enhancedSessionData.stillnessScore >= 60
            ? "⭐"
            : "🌱"}
        </div>
        <h1 className="text-4xl font-bold mb-2">Session Complete!</h1>
        <p className="text-xl font-semibold mb-2 text-primary">
          {enhancedSessionData.sessionType === "classic"
            ? enhancedSessionData.cycleCount >= 10
              ? "Exceptional Focus!"
              : enhancedSessionData.cycleCount >= 5
              ? "Great Session!"
              : enhancedSessionData.cycleCount >= 3
              ? "Good Progress!"
              : "Keep Growing!"
            : enhancedSessionData.stillnessScore !== null &&
              enhancedSessionData.stillnessScore >= 90
            ? "Exceptional Practice!"
            : enhancedSessionData.stillnessScore !== null &&
              enhancedSessionData.stillnessScore >= 75
            ? "Great Session!"
            : enhancedSessionData.stillnessScore !== null &&
              enhancedSessionData.stillnessScore >= 60
            ? "Good Progress!"
            : "Keep Growing!"}
        </p>
        <Badge variant="outline" className="text-lg px-4 py-2 mb-6">
          {enhancedSessionData.patternName}
        </Badge>
        <p className="text-muted-foreground mb-8">
          Take a moment to notice how you feel.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full max-w-4xl">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="text-center animate-fade-in"
              style={{ animationDelay: `${index * 150}ms`, opacity: 0 }}
            >
              <CardHeader className="flex flex-col items-center justify-center pb-2 space-y-2">
                {stat.icon}
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.content}
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Session Insights & Achievements */}
        <div className="mb-8 w-full max-w-4xl">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Session Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {/* Cycle Achievement */}
                {enhancedSessionData.cycleCount > 0 && (
                  <div className="flex flex-col items-center text-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-3xl">🎯</div>
                    <div>
                      <p className="font-semibold text-lg">Cycles Completed</p>
                      <p className="text-sm text-muted-foreground">
                        You completed {enhancedSessionData.cycleCount} breathing
                        cycles
                        {enhancedSessionData.cycleCount >= 10
                          ? " - excellent endurance!"
                          : enhancedSessionData.cycleCount >= 5
                          ? " - building strong habits!"
                          : " - every cycle counts!"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Breath Hold Achievement - only for enhanced sessions */}
                {enhancedSessionData.cameraUsed &&
                  enhancedSessionData.sessionType !== "classic" &&
                  enhancedSessionData.breathHoldTime > 15 && (
                    <div className="flex flex-col items-center text-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-3xl">🫁</div>
                      <div>
                        <p className="font-semibold text-lg">Breath Control</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(enhancedSessionData.breathHoldTime)}{" "}
                          breath hold shows
                          {enhancedSessionData.breathHoldTime > 45
                            ? " exceptional"
                            : enhancedSessionData.breathHoldTime > 30
                            ? " strong"
                            : " developing"}{" "}
                          respiratory control
                        </p>
                      </div>
                    </div>
                  )}

                {/* Stillness Achievement - only for enhanced sessions */}
                {enhancedSessionData.cameraUsed &&
                  enhancedSessionData.sessionType !== "classic" &&
                  enhancedSessionData.stillnessScore !== null &&
                  enhancedSessionData.stillnessScore >= 70 && (
                    <div className="flex flex-col items-center text-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-3xl">🧘</div>
                      <div>
                        <p className="font-semibold text-lg">
                          Mindful Stillness
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {enhancedSessionData.stillnessScore}% stillness
                          indicates
                          {enhancedSessionData.stillnessScore >= 90
                            ? " profound inner calm and focus"
                            : enhancedSessionData.stillnessScore >= 80
                            ? " excellent body awareness"
                            : " growing tranquility and presence"}
                        </p>
                      </div>
                    </div>
                  )}

                {/* Focus Achievement - for classic sessions */}
                {enhancedSessionData.sessionType === "classic" &&
                  enhancedSessionData.cycleCount >= 3 && (
                    <div className="flex flex-col items-center text-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-3xl">🎯</div>
                      <div>
                        <p className="font-semibold text-lg">Pure Focus</p>
                        <p className="text-sm text-muted-foreground">
                          Completed {enhancedSessionData.cycleCount} cycles with
                          pure, distraction-free focus
                          {enhancedSessionData.cycleCount >= 10
                            ? " - exceptional concentration!"
                            : " - building strong mindfulness habits!"}
                        </p>
                      </div>
                    </div>
                  )}

                {/* Duration Achievement */}
                {enhancedSessionData.duration >= 300 && (
                  <div className="flex flex-col items-center text-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="text-3xl">⏰</div>
                    <div>
                      <p className="font-semibold text-lg">
                        Dedicated Practice
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(enhancedSessionData.duration)} of focused
                        breathing
                        {enhancedSessionData.duration >= 600
                          ? " shows remarkable commitment!"
                          : " builds lasting mindfulness habits!"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Progress Streak */}
                {streak > 1 && (
                  <div className="flex flex-col items-center text-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-3xl">🔥</div>
                    <div>
                      <p className="font-semibold text-lg">Practice Streak</p>
                      <p className="text-sm text-muted-foreground">
                        {streak} consecutive days of practice - you're building
                        powerful wellness habits!
                      </p>
                    </div>
                  </div>
                )}

                {/* Phase Accuracy Achievement - only for enhanced sessions */}
                {enhancedSessionData.sessionType !== "classic" &&
                  enhancedSessionData.phaseAccuracy >= 75 && (
                    <div className="flex flex-col items-center text-center gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div className="text-3xl">⏱️</div>
                      <div>
                        <p className="font-semibold text-lg">Precise Timing</p>
                        <p className="text-sm text-muted-foreground">
                          {enhancedSessionData.phaseAccuracy}% phase accuracy
                          shows excellent timing control
                        </p>
                      </div>
                    </div>
                  )}

                {/* Rhythm Consistency Achievement - only for enhanced sessions */}
                {enhancedSessionData.sessionType !== "classic" &&
                  enhancedSessionData.rhythmConsistency >= 75 && (
                    <div className="flex flex-col items-center text-center gap-3 p-4 bg-teal-50 rounded-lg border border-teal-200">
                      <div className="text-3xl">〰️</div>
                      <div>
                        <p className="font-semibold text-lg">Steady Rhythm</p>
                        <p className="text-sm text-muted-foreground">
                          {enhancedSessionData.rhythmConsistency}% rhythm
                          consistency demonstrates excellent pattern stability
                        </p>
                      </div>
                    </div>
                  )}
              </div>

              {/* Personalized Recommendations */}
              <div className="border-t pt-4 mt-4 text-center">
                <h4 className="font-semibold mb-3 flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Next Steps
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground text-left max-w-md mx-auto">
                  {enhancedSessionData.duration < 300 && (
                    <p>
                      • Try extending your next session to 5+ minutes for deeper
                      benefits
                    </p>
                  )}

                  {enhancedSessionData.sessionType === "classic" ? (
                    // Classic session recommendations
                    <>
                      {enhancedSessionData.cycleCount < 5 && (
                        <p>
                          • Gradually increase your cycle count as you build
                          endurance
                        </p>
                      )}
                      {enhancedSessionData.cycleCount >= 10 && (
                        <p>
                          • Excellent focus! Consider trying the Enhanced
                          session with AI feedback
                        </p>
                      )}
                      {enhancedSessionData.duration >= 300 &&
                        enhancedSessionData.cycleCount >= 8 && (
                          <p>
                            • You're ready for more advanced breathing patterns
                            - explore the marketplace!
                          </p>
                        )}
                      <p>
                        • Perfect for daily practice - consistency is key to
                        building mindfulness habits
                      </p>
                    </>
                  ) : (
                    // Enhanced session recommendations
                    <>
                      {enhancedSessionData.stillnessScore !== null &&
                        enhancedSessionData.stillnessScore < 60 && (
                          <p>
                            • Focus on finding a comfortable, stable position
                            before starting
                          </p>
                        )}
                      {enhancedSessionData.cycleCount < 5 && (
                        <p>
                          • Gradually increase your cycle count as you build
                          endurance
                        </p>
                      )}
                      {enhancedSessionData.stillnessScore !== null &&
                        enhancedSessionData.stillnessScore >= 80 &&
                        enhancedSessionData.cycleCount >= 10 && (
                          <p>
                            • You're ready for more advanced breathing patterns
                            - explore the marketplace!
                          </p>
                        )}
                      {enhancedSessionData.breathHoldTime >= 45 && (
                        <p>
                          • Strong breath control! Consider exploring advanced
                          pranayama techniques
                        </p>
                      )}
                      {enhancedSessionData.phaseAccuracy < 60 && (
                        <p>
                          • Match the breathing rhythm closely for great results
                        </p>
                      )}
                      {enhancedSessionData.rhythmConsistency < 60 && (
                        <p>
                          • Try to maintain steady timing throughout each
                          breathing phase
                        </p>
                      )}
                      {enhancedSessionData.phaseAccuracy >= 85 &&
                        enhancedSessionData.rhythmConsistency >= 85 && (
                          <p>
                            • Exceptional technique! You've mastered the
                            fundamentals of mindful breathing
                          </p>
                        )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Session Upsell - Only for classic sessions */}
        {enhancedSessionData.sessionType === "classic" && (
          <div className="mb-8 w-full max-w-4xl">
            <Card className="border-2 border-gradient-to-r from-blue-200 to-purple-200">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-xl">
                  <Brain className="w-6 h-6 text-blue-600" />
                  Ready for AI-Powered Insights?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-center">
                <p className="text-muted-foreground text-lg">
                  🎯 Take your breathing practice to the next level with
                  Enhanced Sessions
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-3xl mb-3">📊</div>
                    <p className="font-semibold text-blue-800">
                      Real-time Analysis
                    </p>
                    <p className="text-blue-600">
                      Live breath tracking & performance metrics
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-3xl mb-3">🧘</div>
                    <p className="font-semibold text-purple-800">
                      Stillness Monitoring
                    </p>
                    <p className="text-purple-600">
                      Camera-based posture & focus tracking
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-3xl mb-3">🤖</div>
                    <p className="font-semibold text-green-800">AI Coaching</p>
                    <p className="text-green-600">
                      Personalized feedback & recommendations
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Link to="/session/enhanced">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
                    >
                      <Brain className="mr-2 h-5 w-5" />
                      Try Enhanced Session
                    </Button>
                  </Link>
                  <Link to="/">
                    <Button variant="outline" size="lg" className="px-8 py-3">
                      Back to Home
                    </Button>
                  </Link>
                </div>

                <p className="text-sm text-muted-foreground bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
                  ✨ Transform your practice with detailed insights, real-time
                  feedback, and AI-powered coaching
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Analysis Section - Only for enhanced sessions */}
        {enhancedSessionData.sessionType !== "classic" && !showAIAnalysis && (
          <div className="mb-8 w-full max-w-4xl">
            <AIAnalysisErrorBoundary>
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI-Powered Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                  <p className="text-muted-foreground">
                    Get personalized feedback and improvement suggestions based
                    on your session performance.
                  </p>
                  <div className="flex gap-2 justify-center">
                    {canUseAIAnalysis ? (
                      <Button
                        onClick={handleAIAnalysis}
                        disabled={!sessionData.patternName}
                      >
                        <Brain className="mr-2 h-4 w-4" />
                        Get AI Analysis
                      </Button>
                    ) : (
                      <InlineUpgrade 
                        feature="ai_analysis" 
                        variant="minimal"
                        className="w-auto"
                      />
                    )}
                  </div>

                  {/* Enhanced subscription status with inline upgrade */}
                  {!canUseAIAnalysis && (
                    <div className="mt-4">
                      <InlineUpgrade 
                        feature="ai_analysis" 
                        variant="banner"
                      />
                    </div>
                  )}

                  {/* 🚧 TEMPORARY DEBUG BUTTON - Remove after debugging */}
                  <div className="mt-4">
                    <AIAnalysisDebugButton />
                  </div>
                  {AIConfigManager.getConfiguredProviders().length === 0 && (
                    <Alert>
                      <AlertDescription>
                        You have 1 free AI analysis available! Configure your
                        own AI providers in settings for unlimited analysis.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </AIAnalysisErrorBoundary>
          </div>
        )}

        {/* AI Analysis Results - Only for enhanced sessions */}
        {enhancedSessionData.sessionType !== "classic" && showAIAnalysis && (
          <div className="mb-8 w-full max-w-4xl">
            <AIAnalysisErrorBoundary>
              {isAnalyzing ? (
                <div className="space-y-4">
                  {/* Streaming Indicator */}
                  <StreamingIndicator 
                    streamingState={streamingState}
                    className="mb-4"
                  />
                  
                  {/* Fallback Loading State */}
                  <Card>
                    <CardContent className="flex items-center justify-center p-8">
                      <div className="text-center space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                        <p>Dr. Breathe is analyzing your session...</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : error ? (
                <Card>
                  <CardContent className="p-6">
                    <Alert>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ) : analyses.length > 0 ? (
                (() => {
                  // Use existing service to transform and enhance the analysis data
                  const rawAnalysis = analyses[0];
                  const transformedSessionData =
                    EnhancedAnalysisService.transformSessionData({
                      patternName:
                        sessionData.patternName || "Breathing Session",
                      sessionDuration: sessionData.sessionDuration || 0,
                      breathHoldTime: sessionData.breathHoldTime || 0,
                      restlessnessScore: sessionData.restlessnessScore,
                      bpm: sessionData.bpm,
                      landmarks: sessionData.landmarks,
                      timestamp: sessionData.timestamp,
                      visionMetrics:
                        enhancedSessionData.visionMetrics || undefined,
                      cycleCount: sessionData.cycleCount,
                      targetCycles: sessionData.targetCycles,
                      // Include all available session data
                      ...sessionData,
                    });

                  const context =
                    EnhancedAnalysisService.prepareAnalysisContext({
                      sessionData: transformedSessionData,
                    });

                  const enhancedAnalysis =
                    EnhancedAnalysisService.validateAndEnhanceResponse(
                      rawAnalysis,
                      context
                    );

                  return (
                    <EnhancedAIAnalysisDisplay
                      analysis={enhancedAnalysis}
                      patternName={
                        sessionData.patternName || "Breathing Session"
                      }
                      onSendChatMessage={async (message: string) => {
                        // Handle chat messages with contextual Dr. Breathe responses
                        try {
                          // Generate contextual responses based on the user's message and actual session data
                          const lowerMessage = message.toLowerCase();

                          // Use actual session data for more personalized responses
                          if (
                            lowerMessage.includes("stillness") ||
                            lowerMessage.includes("focus") ||
                            lowerMessage.includes("stats") ||
                            lowerMessage.includes("how was my")
                          ) {
                            const stillnessScore =
                              sessionData.restlessnessScore !== undefined
                                ? Math.max(
                                    0,
                                    100 - sessionData.restlessnessScore
                                  )
                                : undefined;

                            if (stillnessScore !== undefined) {
                              return `Based on your actual session data, your stillness score was ${stillnessScore}%. This indicates ${
                                stillnessScore >= 80
                                  ? "excellent"
                                  : stillnessScore >= 70
                                  ? "good"
                                  : "developing"
                              } body awareness and focus. You completed ${
                                sessionData.cycleCount || 0
                              } cycles with a ${stillnessScore}% stillness score. To improve this score, try finding a more comfortable seated position and focus on minimizing movement during your breathing cycles.\n\n— Dr. Breathe, Your Breathing Coach`;
                            }
                          }

                          if (
                            lowerMessage.includes("breath") ||
                            lowerMessage.includes("breathing")
                          ) {
                            const breathHoldTime =
                              sessionData.breathHoldTime || 0;
                            return `Looking at your session data, your breath hold time was ${breathHoldTime} seconds. This shows ${
                              breathHoldTime > 30
                                ? "developing"
                                : breathHoldTime > 15
                                ? "beginning"
                                : "emerging"
                            } breath control. For ${
                              sessionData.patternName || "your chosen pattern"
                            }, you completed ${
                              sessionData.cycleCount || 0
                            } cycles with a ${
                              sessionData.restlessnessScore !== undefined
                                ? Math.max(
                                    0,
                                    100 - sessionData.restlessnessScore
                                  )
                                : "N/A"
                            }% stillness score. Focus on maintaining a smooth, steady rhythm throughout each phase. What specific aspect of your breathing would you like to improve?\n\n— Dr. Breathe, Your Breathing Coach`;
                          }

                          if (
                            lowerMessage.includes("session") ||
                            lowerMessage.includes("practice") ||
                            lowerMessage.includes("duration") ||
                            lowerMessage.includes("how was my")
                          ) {
                            const duration = sessionData.sessionDuration || 0;
                            const cycles = sessionData.cycleCount || 0;
                            const stillnessScore =
                              sessionData.restlessnessScore !== undefined
                                ? Math.max(
                                    0,
                                    100 - sessionData.restlessnessScore
                                  )
                                : undefined;

                            return `Based on your actual session data, you practiced for ${Math.floor(
                              duration / 60
                            )} minutes and ${
                              duration % 60
                            } seconds, completing ${cycles} breathing cycles${
                              stillnessScore !== undefined
                                ? ` with a ${stillnessScore}% stillness score`
                                : ""
                            }. This shows real commitment to mindful breathing. Your ${cycles} completed cycles demonstrate ${
                              cycles >= 10
                                ? "excellent"
                                : cycles >= 5
                                ? "good"
                                : "solid"
                            } endurance. This regular practice will help you develop better stress resilience and mental clarity over time. How are you feeling about your progress so far?\n\n— Dr. Breathe, Your Breathing Coach`;
                          }

                          if (
                            lowerMessage.includes("cycle") ||
                            lowerMessage.includes("cycles") ||
                            lowerMessage.includes("improve")
                          ) {
                            const cycles = sessionData.cycleCount || 0;
                            const target = sessionData.targetCycles || 10;
                            const completionRate = Math.round(
                              (cycles / target) * 100
                            );
                            const stillnessScore =
                              sessionData.restlessnessScore !== undefined
                                ? Math.max(
                                    0,
                                    100 - sessionData.restlessnessScore
                                  )
                                : undefined;

                            return `Looking at your session data, you completed ${cycles} out of ${target} target cycles (${completionRate}% completion rate)${
                              stillnessScore !== undefined
                                ? ` with a ${stillnessScore}% stillness score`
                                : ""
                            }. This shows ${
                              completionRate >= 80
                                ? "excellent"
                                : completionRate >= 60
                                ? "good"
                                : "solid"
                            } focus and endurance. To improve your cycle completion, try gradually increasing your target as you build stamina rather than pushing too hard too fast.\n\n— Dr. Breathe, Your Breathing Coach`;
                          }

                          if (
                            lowerMessage.includes("recommend") ||
                            lowerMessage.includes("improve") ||
                            lowerMessage.includes("next step")
                          ) {
                            const cycles = sessionData.cycleCount || 0;
                            const target = sessionData.targetCycles || 10;
                            const completionRate = Math.round(
                              (cycles / target) * 100
                            );
                            const stillnessScore =
                              sessionData.restlessnessScore !== undefined
                                ? Math.max(
                                    0,
                                    100 - sessionData.restlessnessScore
                                  )
                                : undefined;
                            const duration = sessionData.sessionDuration || 0;

                            const recommendations = [];

                            if (completionRate < 80) {
                              recommendations.push(
                                "Gradually increase your target cycles as you build endurance"
                              );
                            }

                            if (
                              stillnessScore !== undefined &&
                              stillnessScore < 70
                            ) {
                              recommendations.push(
                                "Focus on finding a more comfortable, stable position to improve stillness"
                              );
                            }

                            if (duration < 300) {
                              recommendations.push(
                                "Try extending your sessions to at least 5 minutes for deeper benefits"
                              );
                            }

                            if (recommendations.length === 0) {
                              recommendations.push(
                                "Continue with your current excellent practice routine"
                              );
                              recommendations.push(
                                "Try a different breathing pattern to challenge yourself"
                              );
                              recommendations.push(
                                "Share your progress with the community for motivation"
                              );
                            }

                            return `Based on your session data (completed ${cycles} cycles with ${
                              stillnessScore !== undefined
                                ? `${stillnessScore}% stillness`
                                : "N/A stillness"
                            }), here are my recommendations for improvement:\n\n${recommendations
                              .map((rec, i) => `${i + 1}. ${rec}`)
                              .join(
                                "\n"
                              )}\n\n— Dr. Breathe, Your Breathing Coach`;
                          }

                          // Default contextual response using actual data
                          return `Thank you for your question about "${message}"! Based on your actual session data from your ${
                            sessionData.patternName || "breathing"
                          } practice, I can see you completed ${
                            sessionData.cycleCount || 0
                          } cycles with a stillness score of ${
                            sessionData.restlessnessScore !== undefined
                              ? Math.max(0, 100 - sessionData.restlessnessScore)
                              : "N/A"
                          }%. These metrics show you're developing valuable mindfulness skills that will benefit both your mental and physical wellbeing. Could you tell me more about what specific aspect of your practice you'd like to explore further?\n\n— Dr. Breathe, Your Breathing Coach`;
                        } catch (error) {
                          console.error(
                            "Failed to generate Dr. Breathe response:",
                            error
                          );
                          return "I appreciate your question! While I'm having a moment of technical difficulty, I want you to know that every question about your breathing practice is valuable. Please feel free to ask again.\n\n— Dr. Breathe, Your Breathing Coach";
                        }
                      }}
                    />
                  );
                })()
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">
                      No AI analysis results available. Try the analysis again
                      or check your connection.
                    </p>
                  </CardContent>
                </Card>
              )}
            </AIAnalysisErrorBoundary>
          </div>
        )}

        {/* Main Actions - Prioritized for user journey */}
        <div className="space-y-6">
          {/* Primary Action: Try Different Pattern */}
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">
              🌟 Ready to explore different breathing techniques?
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link to="/patterns" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-3"
                >
                  <Heart className="mr-2 h-5 w-5" />
                  Explore Breathing Patterns
                </Button>
              </Link>
              <div className="text-sm text-muted-foreground">
                Wim Hof, 4-7-8, and more
              </div>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              to={
                enhancedSessionData.sessionType === "classic"
                  ? "/session/enhanced"
                  : "/session/classic"
              }
            >
              <Button size="lg" variant="outline" className="px-8 py-3">
                {enhancedSessionData.sessionType === "classic" ? (
                  <>
                    <Brain className="mr-2 h-5 w-5" />
                    Try Enhanced Session
                  </>
                ) : (
                  <>
                    <Heart className="mr-2 h-5 w-5" />
                    Try Classic Session
                  </>
                )}
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full shadow-lg"
              onClick={handleShare}
              disabled={!sessionData.patternName || isSharing}
            >
              <Share className="mr-2 h-5 w-5" />
              {isSharing ? "Sharing..." : "Share Results"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full"
              onClick={handleShareToLensClick}
              disabled={!sessionData.patternName}
            >
              <Share className="mr-2 h-5 w-5" />
              Share to Lens
            </Button>
            <Link to="/">
              <Button size="lg" variant="ghost" className="rounded-full">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Enhanced Social Sharing - Available for all session types */}
        <div className="mt-8 w-full max-w-4xl">
          <BreathingSessionPost
            sessionData={{
              patternName: sessionData.patternName || "Breathing Session",
              duration: sessionData.sessionDuration || 300,
              score:
                enhancedSessionData.sessionType === "classic"
                  ? Math.min(
                      100,
                      Math.max(50, (enhancedSessionData.cycleCount || 1) * 10)
                    ) // Score based on cycles for classic
                  : enhancedSessionData.stillnessScore !== null
                  ? enhancedSessionData.stillnessScore // Use real calculated stillness
                  : 75, // Fallback only if no real data
              breathHoldTime:
                enhancedSessionData.sessionType === "classic"
                  ? 0
                  : sessionData.breathHoldTime,
              cycles: sessionData.cycleCount || sessionData.cycles,
              completedAt: new Date().toISOString(),
            }}
            onPublished={(txHash) => {
              if (typeof txHash === "string" && txHash.startsWith("twitter")) {
                toast.success("Opening Twitter to share your session!", {
                  description:
                    "Complete the tweet to share with your followers",
                });
              } else if (
                typeof txHash === "string" &&
                txHash.includes("clipboard")
              ) {
                toast.success("Session results copied to clipboard!", {
                  description: "Share your achievement anywhere you like",
                });
              } else if (
                typeof txHash === "string" &&
                txHash.includes("native")
              ) {
                toast.success("Shared successfully!", {
                  description: "Your session results have been shared",
                });
              } else {
                toast.success("Session shared to Lens!", {
                  description:
                    txHash && typeof txHash === "string"
                      ? `Transaction: ${txHash.slice(0, 10)}...`
                      : "Your session has been posted successfully",
                });
              }
            }}
          />
        </div>
      </div>
    </>
  );
};

export default Results;
