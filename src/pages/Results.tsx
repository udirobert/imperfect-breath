import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
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
import { formatTime } from "../lib/utils/formatters";

import { EnhancedCustomPattern } from "../types/patterns";
import { BreathingSessionPost } from "../components/social/BreathingSessionPost";
import { SessionCompleteModal } from "../components/unified/SessionCompleteModal";

// Using consolidated formatTime from utils

const Results = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { isAuthenticated: isLensAuthenticated } = useLens();
  const { streak, totalMinutes, saveSession, history } = useSessionHistory();
  const {
    analyzeSession,
    results: analyses,
    isAnalyzing,
    error,
  } = useSecureAIAnalysis();
  const hasSavedRef = useRef(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  const [showSessionModal, setShowSessionModal] = useState(false); // Disable the redundant modal
  const [isSharing, setIsSharing] = useState(false); // Prevent multiple share attempts

  const sessionData = useMemo(() => location.state || {}, [location.state]);

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
    if (!sessionData.patternName) {
      toast.error("No session data available for analysis");
      return;
    }

    // UNIFIED DATA FLOW: Combine session + vision data (AGGRESSIVE CONSOLIDATION)
    let enhancedSessionData: SessionData = {
      breathHoldTime: sessionData.breathHoldTime || 0,
      restlessnessScore: sessionData.restlessnessScore || 0,
      patternName: sessionData.patternName,
      sessionDuration: sessionData.sessionDuration || 0,
      timestamp: new Date().toISOString(),
      landmarks: 68,
    };

    // If vision was used, get actual vision metrics from Hetzner server
    if (sessionData.visionSessionId && sessionData.cameraUsed !== false) {
      try {
        // PERFORMANT: Cache vision data fetches to avoid redundant requests
        const cacheKey = `vision_summary_${sessionData.visionSessionId}`;
        let visionData = sessionStorage.getItem(cacheKey);

        if (!visionData) {
          const visionSummary = await fetch(
            `${
              import.meta.env.VITE_HETZNER_SERVICE_URL ||
              "http://localhost:8001"
            }${createEndpoint.visionSessionSummary(sessionData.visionSessionId)}`
          );

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
            console.warn("Vision summary not found on server, using session data only");
            toast.warning("Vision data not available - using session data only");
          } else {
            throw new Error(`Vision API returned status ${visionSummary.status}`);
          }
        } else {
          // Check cache expiry (5 minutes)
          const timestamp = sessionStorage.getItem(`${cacheKey}_timestamp`);
          if (timestamp && Date.now() - parseInt(timestamp) > 300000) {
            sessionStorage.removeItem(cacheKey);
            sessionStorage.removeItem(`${cacheKey}_timestamp`);
            // Refetch
            const visionSummary = await fetch(
              `${
                import.meta.env.VITE_HETZNER_SERVICE_URL ||
                "http://localhost:8001"
              }${createEndpoint.visionSessionSummary(sessionData.visionSessionId)}`
            );
            if (visionSummary.ok) {
              visionData = await visionSummary.text();
              sessionStorage.setItem(cacheKey, visionData);
              sessionStorage.setItem(
                `${cacheKey}_timestamp`,
                Date.now().toString()
              );
            } else if (visionSummary.status === 404) {
              // Handle 404 gracefully without throwing an error that would trigger the error boundary
              console.warn("Vision summary not found on server, using session data only");
              toast.warning("Vision data not available - using session data only");
            } else {
              throw new Error(`Vision API returned status ${visionSummary.status}`);
            }
          }
        }

        if (visionData) {
          const parsedVisionData = JSON.parse(visionData);

          // Map vision metrics to AI analysis format (DRY: Single source of truth)
          enhancedSessionData = {
            ...enhancedSessionData,
            restlessnessScore: Math.round(
              (1 - parsedVisionData.avg_movement_level) * 100
            ),
            bpm:
              parsedVisionData.avg_breathing_rate ||
              enhancedSessionData.breathHoldTime,
            landmarks: parsedVisionData.total_frames,
            // Add vision-specific data for AI analysis
            visionMetrics: {
              confidence: parsedVisionData.avg_confidence,
              postureScore: parsedVisionData.avg_posture_score,
              movementLevel: parsedVisionData.avg_movement_level,
              stillnessPercentage: parsedVisionData.stillness_percentage,
              consistencyScore: parsedVisionData.consistency_score,
            },
          };

          console.log(
            "Enhanced session data with vision metrics:",
            enhancedSessionData
          );
        }
      } catch (error) {
        console.warn(
          "Failed to fetch vision data, using session data only:",
          error
        );
        toast.warning("Using session data only - vision metrics unavailable");
      }
    }

    setShowAIAnalysis(true);
    await analyzeSession(enhancedSessionData);
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
      const actualStillness = sessionData.restlessnessScore !== undefined 
        ? Math.max(0, 100 - sessionData.restlessnessScore)
        : null;
      
      const summary = `I just completed a mindful breathing session!
- Duration: ${formatTime(sessionData.sessionDuration || 0)}
- Cycles: ${sessionData.cycleCount || 0}${actualStillness !== null ? `
- Stillness: ${actualStillness}%` : ''}
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
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <p className="text-muted-foreground">
                  Get personalized feedback and improvement suggestions based on
                  your session performance.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleAIAnalysis}
                    disabled={!sessionData.patternName}
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    Get AI Analysis
                  </Button>
                </div>
                {AIConfigManager.getConfiguredProviders().length === 0 && (
                  <Alert>
                    <AlertDescription>
                      You have 1 free AI analysis available! Configure your own
                      AI providers in settings for unlimited analysis.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Analysis Results - Only for enhanced sessions */}
        {enhancedSessionData.sessionType !== "classic" && showAIAnalysis && (
          <div className="mb-8 w-full max-w-4xl">
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
                <TabsTrigger value="scores">Performance Scores</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="space-y-4">
                {isAnalyzing ? (
                  <Card>
                    <CardContent className="flex items-center justify-center p-8">
                      <div className="text-center space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                        <p>Analyzing your session with AI...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : error ? (
                  <Card>
                    <CardContent className="p-6">
                      <Alert>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {analyses.map((analysis, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Brain className="w-5 h-5" />
                            {
                              AI_PROVIDERS.find(
                                (p) => p.id === analysis.provider
                              )?.name
                            }{" "}
                            Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap">
                              {analysis.analysis}
                            </p>
                          </div>

                          {analysis.suggestions.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">
                                Suggestions:
                              </h4>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                {analysis.suggestions.map((suggestion, i) => (
                                  <li key={i}>{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {analysis.nextSteps.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">
                                Next Steps:
                              </h4>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                {analysis.nextSteps.map((step, i) => (
                                  <li key={i}>{step}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="scores" className="space-y-4">
                {analyses.length > 0 && (
                  <div className="grid gap-4">
                    {analyses.map((analysis, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            {
                              AI_PROVIDERS.find(
                                (p) => p.id === analysis.provider
                              )?.name
                            }{" "}
                            Scores
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center space-y-2">
                              <Badge
                                variant={getScoreBadgeVariant(
                                  analysis.score.overall
                                )}
                              >
                                {analysis.score.overall}/100
                              </Badge>
                              <p className="text-sm font-medium">Overall</p>
                            </div>
                            <div className="text-center space-y-2">
                              <Badge
                                variant={getScoreBadgeVariant(
                                  analysis.score.focus
                                )}
                              >
                                {analysis.score.focus}/100
                              </Badge>
                              <p className="text-sm font-medium">Focus</p>
                            </div>
                            <div className="text-center space-y-2">
                              <Badge
                                variant={getScoreBadgeVariant(
                                  analysis.score.consistency
                                )}
                              >
                                {analysis.score.consistency}/100
                              </Badge>
                              <p className="text-sm font-medium">Consistency</p>
                            </div>
                            <div className="text-center space-y-2">
                              <Badge
                                variant={getScoreBadgeVariant(
                                  analysis.score.progress
                                )}
                              >
                                {analysis.score.progress}/100
                              </Badge>
                              <p className="text-sm font-medium">Progress</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
              insights:
                enhancedSessionData.sessionType !== "classic" &&
                analyses.length > 0
                  ? analyses.map((a) => a.analysis)
                  : [],
              timestamp: new Date().toISOString(),
              id: `session-${Date.now()}`,
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
