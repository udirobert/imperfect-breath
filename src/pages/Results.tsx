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
} from "lucide-react";
import { BREATHING_PATTERNS } from "../lib/breathingPatterns";
import { useSessionHistory } from "../hooks/useSessionHistory";
import { useAIAnalysis } from "../hooks/useAIAnalysis";
import { AI_PROVIDERS, AIConfigManager, SessionData } from "../lib/ai/config";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useStory } from "../hooks/useStory";
import { createStoryProtocolMethods } from "../lib/storyProtocolIntegration";
import { EnhancedCustomPattern } from "../types/patterns";
import { IntegratedSocialFlow } from "../components/social/IntegratedSocialFlow";
import { SessionCompleteModal } from "../components/unified/SessionCompleteModal";

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

const Results = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { streak, totalMinutes, saveSession, history } = useSessionHistory();
  const { analyzeSession, analyses, isAnalyzing, error } = useAIAnalysis();
  const hasSavedRef = useRef(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [ipRegistered, setIpRegistered] = useState(false);
  const [isRegisteringIP, setIsRegisteringIP] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(true);
  const [ipAssetId, setIpAssetId] = useState<string | null>(null);

  const sessionData = useMemo(() => location.state || {}, [location.state]);
  const storyHook = useStory();

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

    const configuredProviders = AIConfigManager.getConfiguredProviders();
    if (configuredProviders.length === 0) {
      toast.error("Please configure AI providers in settings first");
      return;
    }

    const currentSession: SessionData = {
      breathHoldTime: sessionData.breathHoldTime || 0,
      restlessnessScore: sessionData.restlessnessScore || 0,
      patternName: sessionData.patternName,
      sessionDuration: sessionData.sessionDuration || 0,
      timestamp: new Date().toISOString(),
      landmarks: 68, // Assuming 68-point face model
    };

    // Create previous sessions array with proper typing
    const previousSessions = history
      ? history.slice(-10).map((session) => ({
          breathHoldTime: session.breath_hold_time,
          restlessnessScore: session.restlessness_score,
          patternName: session.pattern_name,
          sessionDuration: session.session_duration,
          timestamp: session.created_at || new Date().toISOString(),
        }))
      : [];

    setShowAIAnalysis(true);
    await analyzeSession(currentSession);
  };

  const handleRegisterIP = async () => {
    if (!sessionData.patternName) {
      toast.error("No session data available for IP registration");
      return;
    }

    setIsRegisteringIP(true);
    try {
      // Find the breathing pattern from the built-in patterns or create a temporary one
      // BREATHING_PATTERNS is a Record<string, BreathingPattern>, not an array
      const patternName = sessionData.patternName;
      const patternToRegister = Object.values(BREATHING_PATTERNS).find(
        (pattern) => pattern.name === patternName
      );

      if (!patternToRegister) {
        toast.error("Pattern not found for registration");
        return;
      }

      // Create a temporary enhanced pattern for registration
      const enhancedPattern: EnhancedCustomPattern = {
        id: patternToRegister.id || `pattern_${Date.now()}`,
        name: patternToRegister.name,
        description:
          patternToRegister.description ||
          `Session recorded on ${new Date().toLocaleDateString()}`,
        category: "performance",
        difficulty: "intermediate",
        duration: sessionData.sessionDuration || 0,
        creator: user?.profile?.username || "anonymous",
        phases: patternToRegister.phases,
        tags: [],
        targetAudience: [],
        primaryBenefits: [],
        secondaryBenefits: [],
        instructorName: user?.profile?.username || "anonymous",
        instructorCredentials: [],
        licenseSettings: {
          isCommercial: false,
          price: 0,
          currency: "ETH",
          allowDerivatives: true,
          attribution: true,
          commercialUse: false,
          royaltyPercentage: 5,
        },
      };

      // Create blockchain methods for this pattern
      const blockchainMethods = createStoryProtocolMethods(
        enhancedPattern,
        storyHook
      );

      // Register the pattern as an IP asset
      const registrationResult = await blockchainMethods.register();

      if (registrationResult && registrationResult.ipId) {
        setIpAssetId(registrationResult.ipId);
        setIpRegistered(true);
        toast.success(
          `Session data registered as IP Asset: ${registrationResult.ipId}`
        );
      } else {
        throw new Error("Registration did not return a valid IP ID");
      }
    } catch (error) {
      console.error("Failed to register IP:", error);
      toast.error(
        `Failed to register session as IP asset: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsRegisteringIP(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  const restlessnessValue = Math.round(sessionData.restlessnessScore || 0);
  const restlessnessColor =
    restlessnessValue < 20
      ? "bg-green-500"
      : restlessnessValue < 50
      ? "bg-yellow-500"
      : "bg-red-500";

  const handleShare = async () => {
    const summary = `I just completed a mindful breathing session!
- Max Breath Hold: ${formatTime(sessionData.breathHoldTime || 0)}
- Restlessness Score: ${restlessnessValue}/100
Check out Mindful Breath!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Mindful Breath Results",
          text: summary,
          url: window.location.origin,
        });
      } catch (error) {
        console.error("Error sharing:", error);
        toast.error("Could not share results.");
      }
    } else {
      navigator.clipboard.writeText(summary);
      toast.success("Results copied to clipboard!");
    }
  };

  const stats = [
    {
      title: "Max Breath Hold",
      value: sessionData?.breathHoldTime
        ? formatTime(sessionData.breathHoldTime)
        : "N/A",
      icon: <Clock className="w-6 h-6 text-primary" />,
      description: "Your longest hold in this session.",
    },
    {
      title: "Restlessness Score",
      value:
        typeof sessionData.restlessnessScore === "number"
          ? `${restlessnessValue}/100`
          : "N/A",
      icon: <Activity className="w-6 h-6 text-primary" />,
      description: "Lower is calmer. Great job staying still!",
      content: typeof sessionData.restlessnessScore === "number" && (
        <Progress
          value={restlessnessValue}
          indicatorClassName={restlessnessColor}
          className="h-2"
        />
      ),
    },
    {
      title: "Consecutive Days",
      value: `${streak} Day${streak === 1 ? "" : "s"}`,
      icon: <Star className="w-6 h-6 text-primary" />,
      description: "You're building a healthy habit!",
    },
    {
      title: "Total Mindful Minutes",
      value: `${totalMinutes} min`,
      icon: <Clock className="w-6 h-6 text-primary" />,
      description: "Total time invested in your wellbeing.",
    },
  ];

  return (
    <>
      <SessionCompleteModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        sessionData={{
          patternName: sessionData.patternName || "Custom Pattern",
          duration: sessionData.sessionDuration || 0,
          score: sessionData.restlessnessScore
            ? Math.max(0, 100 - sessionData.restlessnessScore)
            : 75, // Convert restlessness to a score (lower restlessness = higher score)
          breathHoldTime: sessionData.breathHoldTime || 0,
          restlessnessScore: sessionData.restlessnessScore || 0,
        }}
      />

      <div className="flex flex-col items-center justify-center text-center animate-fade-in p-4">
        <h1 className="text-4xl font-bold mb-2">Session Complete</h1>
        <p className="text-muted-foreground mb-8">
          Take a moment to notice how you feel.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full max-w-4xl">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="text-left animate-fade-in"
              style={{ animationDelay: `${index * 150}ms`, opacity: 0 }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.content}
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Story Protocol IP Registration Section */}
        <div className="mb-8 w-full max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                IP Protection with Story Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Register your breathing session data as intellectual property on
                Story Protocol. Protect your wellness journey and contribute to
                the breathing exercise ecosystem.
              </p>
              <div className="flex gap-2">
                {!ipRegistered ? (
                  <Button
                    onClick={handleRegisterIP}
                    disabled={!sessionData.patternName || isRegisteringIP}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isRegisteringIP ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering IP...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Register as IP Asset
                      </>
                    )}
                  </Button>
                ) : (
                  <Button disabled className="bg-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    IP Asset Registered
                  </Button>
                )}
              </div>
              {ipRegistered && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your session data has been successfully registered as an IP
                    asset on Story Protocol with ID: {ipAssetId}. This creates a
                    permanent, verifiable record of your breathing session
                    performance.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis Section */}
        {!showAIAnalysis ? (
          <div className="mb-8 w-full max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Get personalized feedback and improvement suggestions based on
                  your session performance.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAIAnalysis}
                    disabled={!sessionData.patternName}
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    Get AI Analysis
                  </Button>
                  <Link to="/ai-settings">
                    <Button variant="outline">
                      <Settings className="mr-2 h-4 w-4" />
                      Configure AI
                    </Button>
                  </Link>
                </div>
                {AIConfigManager.getConfiguredProviders().length === 0 && (
                  <Alert>
                    <AlertDescription>
                      Configure AI providers in settings to get personalized
                      insights on your sessions.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
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

        <div className="flex gap-4">
          <Link to="/">
            <Button size="lg" className="rounded-full shadow-lg">
              Back to Home
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full shadow-lg"
            onClick={handleShare}
            disabled={!sessionData.patternName}
          >
            <Share className="mr-2 h-5 w-5" />
            Share Results
          </Button>
          {analyses.length > 0 && (
            <IntegratedSocialFlow
              phase="completion"
              sessionData={{
                ...sessionData,
                score: sessionData.restlessnessScore
                  ? Math.max(0, 100 - sessionData.restlessnessScore)
                  : 75, // Convert restlessness to a score
              }}
              onSocialAction={(action, data) => {
                console.log("Social action:", action, data);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Results;
