/**
 * Desktop Adaptive Session Flow - Desktop-Optimized Session Experience
 *
 * ENHANCEMENT FIRST: Builds on AdaptiveSessionFlow with desktop-specific layouts
 * CLEAN: Separates desktop session logic from mobile touch interactions
 * MODULAR: Reuses SmartPatternRecommendations and session components
 * PERFORMANT: Leverages desktop capabilities for enhanced UX
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Heart,
  Brain,
  Target,
  Clock,
  Zap,
  Users,
  Trophy,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Calendar,
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  Settings,
  BarChart3,
  Monitor,
  Maximize2,
  Eye,
  Timer,
  Award,
  Star,
  Lightbulb,
  Activity,
  Focus,
  Moon,
  Sun,
  Coffee,
} from "lucide-react";
import {
  SmartPatternRecommendations,
  type RecommendationContext,
} from "../../lib/recommendations/SmartPatternRecommendations";
import { BREATHING_PATTERNS } from "../../lib/breathingPatterns";
import { useAuth } from "../../hooks/useAuth";
import { useSessionHistory } from "../../hooks/useSessionHistory";
import { DesktopSessionOptimizations } from "./DesktopSessionOptimizations";

interface DesktopAdaptiveSessionFlowProps {
  onPatternSelect?: (patternId: string) => void;
  onSessionStart?: () => void;
  className?: string;
}

interface SessionGoal {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  patterns: string[];
  timeOfDay?: "morning" | "afternoon" | "evening" | "any";
}

export const DesktopAdaptiveSessionFlow: React.FC<
  DesktopAdaptiveSessionFlowProps
> = ({ onPatternSelect, onSessionStart, className }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { history } = useSessionHistory();

  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [selectedPattern, setSelectedPattern] = useState<string>("");
  const [activeTab, setActiveTab] = useState("goals");
  const [showOptimizations, setShowOptimizations] = useState(false);
  const [sessionMode, setSessionMode] = useState<"classic" | "enhanced">(
    "enhanced"
  );

  // Get current time context for recommendations
  const currentHour = new Date().getHours();
  const timeOfDay =
    currentHour < 12 ? "morning" : currentHour < 17 ? "afternoon" : "evening";

  const sessionGoals: SessionGoal[] = [
    {
      id: "stress-relief",
      title: "Reduce Stress",
      description: "Quick stress relief in 2-5 minutes",
      icon: Heart,
      color: "bg-red-50 border-red-200 text-red-800",
      patterns: ["box", "relaxation"],
      timeOfDay: "any",
    },
    {
      id: "focus-boost",
      title: "Boost Focus",
      description: "Enhance concentration and mental clarity",
      icon: Brain,
      color: "bg-blue-50 border-blue-200 text-blue-800",
      patterns: ["box", "energizing"],
      timeOfDay: "morning",
    },
    {
      id: "energy-boost",
      title: "Increase Energy",
      description: "Natural energy boost without caffeine",
      icon: Zap,
      color: "bg-yellow-50 border-yellow-200 text-yellow-800",
      patterns: ["energizing", "wim_hof"],
      timeOfDay: "morning",
    },
    {
      id: "better-sleep",
      title: "Better Sleep",
      description: "Prepare your body and mind for rest",
      icon: Moon,
      color: "bg-purple-50 border-purple-200 text-purple-800",
      patterns: ["relaxation", "sleep"],
      timeOfDay: "evening",
    },
    {
      id: "lung-capacity",
      title: "Build Lung Capacity",
      description: "Strengthen breathing muscles and increase breath hold",
      icon: Activity,
      color: "bg-orange-50 border-orange-200 text-orange-800",
      patterns: ["wim_hof", "coherent"],
      timeOfDay: "morning",
    },
    {
      id: "general-wellness",
      title: "General Wellness",
      description: "Overall health and mindfulness practice",
      icon: Sparkles,
      color: "bg-green-50 border-green-200 text-green-800",
      patterns: ["box", "relaxation", "coherent"],
      timeOfDay: "any",
    },
  ];

  // Get smart recommendations based on context
  const recommendationContext: RecommendationContext = {
    timeOfDay: currentHour,
    userGoal: selectedGoal as any,
    sessionHistory: history.map((h) => h.pattern_name),
    userLevel:
      history.length < 5
        ? "beginner"
        : history.length < 20
        ? "intermediate"
        : "advanced",
    sessionType: sessionMode,
    isFirstSession: history.length === 0,
  };

  const smartRecommendations = SmartPatternRecommendations.getRecommendations(
    recommendationContext
  );

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId);
    setActiveTab("patterns");

    // Auto-select best pattern for goal if available
    const goal = sessionGoals.find((g) => g.id === goalId);
    if (goal && goal.patterns.length > 0) {
      const recommendedPattern = smartRecommendations.find((r) =>
        goal.patterns.includes(r.patternId)
      );
      if (recommendedPattern) {
        setSelectedPattern(recommendedPattern.patternId);
      } else {
        setSelectedPattern(goal.patterns[0]);
      }
    }
  };

  const handlePatternSelect = (patternId: string) => {
    setSelectedPattern(patternId);
    onPatternSelect?.(patternId);
  };

  const handleStartSession = () => {
    if (selectedPattern) {
      onSessionStart?.();
      navigate(`/session/${sessionMode}?pattern=${selectedPattern}`);
    }
  };

  const getTimeBasedGreeting = () => {
    if (timeOfDay === "morning")
      return "Good morning! Ready to start your day mindfully?";
    if (timeOfDay === "afternoon")
      return "Good afternoon! Time for a mindful break?";
    return "Good evening! Let's wind down together.";
  };

  const getTimeBasedIcon = () => {
    if (timeOfDay === "morning") return Sun;
    if (timeOfDay === "afternoon") return Coffee;
    return Moon;
  };

  const TimeIcon = getTimeBasedIcon();

  return (
    <div className={`max-w-7xl mx-auto space-y-6 ${className}`}>
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-blue-50 via-white to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <TimeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{getTimeBasedGreeting()}</h1>
                <p className="text-muted-foreground">
                  {user
                    ? `Welcome back, ${user.name}`
                    : "Choose your breathing goal to get started"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={sessionMode === "classic" ? "default" : "outline"}
                size="sm"
                onClick={() => setSessionMode("classic")}
              >
                Classic
              </Button>
              <Button
                variant={sessionMode === "enhanced" ? "default" : "outline"}
                size="sm"
                onClick={() => setSessionMode("enhanced")}
              >
                Enhanced
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOptimizations(!showOptimizations)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Optimizations Panel */}
      {showOptimizations && (
        <DesktopSessionOptimizations
          isSessionActive={false}
          onOptimizationChange={(opt, enabled) =>
            console.log(`${opt}: ${enabled}`)
          }
        />
      )}

      {/* Main Content - Side by Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Goals & Patterns */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="goals">Choose Goal</TabsTrigger>
              <TabsTrigger value="patterns">Select Pattern</TabsTrigger>
              <TabsTrigger value="recommendations">Smart Picks</TabsTrigger>
            </TabsList>

            <TabsContent value="goals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>What would you like to achieve?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sessionGoals.map((goal) => {
                      const Icon = goal.icon;
                      const isSelected = selectedGoal === goal.id;
                      const isOptimalTime =
                        goal.timeOfDay === "any" ||
                        goal.timeOfDay === timeOfDay;

                      return (
                        <Card
                          key={goal.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            isSelected
                              ? goal.color
                              : "bg-white hover:bg-gray-50"
                          }`}
                          onClick={() => handleGoalSelect(goal.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-12 h-12 rounded-full ${goal.color} flex items-center justify-center`}
                              >
                                <Icon className="h-6 w-6" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">{goal.title}</h3>
                                  {isOptimalTime && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Optimal Time
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {goal.description}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                  {goal.patterns
                                    .slice(0, 2)
                                    .map((patternId) => (
                                      <Badge
                                        key={patternId}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {BREATHING_PATTERNS[patternId]?.name ||
                                          patternId}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="patterns" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedGoal
                      ? `Patterns for ${
                          sessionGoals.find((g) => g.id === selectedGoal)?.title
                        }`
                      : "Choose a Breathing Pattern"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(BREATHING_PATTERNS)
                      .filter(([id]) => {
                        if (!selectedGoal) return true;
                        const goal = sessionGoals.find(
                          (g) => g.id === selectedGoal
                        );
                        return goal?.patterns.includes(id);
                      })
                      .map(([id, pattern]) => {
                        const isSelected = selectedPattern === id;
                        const recommendation = smartRecommendations.find(
                          (r) => r.patternId === id
                        );

                        return (
                          <Card
                            key={id}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              isSelected
                                ? "bg-blue-50 border-blue-200"
                                : "bg-white hover:bg-gray-50"
                            }`}
                            onClick={() => handlePatternSelect(id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium">{pattern.name}</h3>
                                {recommendation && (
                                  <Badge variant="outline" className="text-xs">
                                    {recommendation.confidence}% match
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {pattern.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {pattern.inhale +
                                      pattern.hold +
                                      pattern.exhale}
                                    s cycle
                                  </span>
                                </div>
                                {isSelected && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Smart Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {smartRecommendations.slice(0, 3).map((rec) => {
                      const pattern = BREATHING_PATTERNS[rec.patternId];
                      if (!pattern) return null;

                      return (
                        <Card
                          key={rec.patternId}
                          className="cursor-pointer transition-all hover:shadow-md"
                          onClick={() => handlePatternSelect(rec.patternId)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium">{pattern.name}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {rec.confidence}% match
                                </Badge>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < Math.floor(rec.confidence / 20)
                                          ? "text-yellow-400 fill-current"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {rec.reason}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {pattern.inhale +
                                    pattern.hold +
                                    pattern.exhale}
                                  s cycle
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                <span>{rec.expectedBenefit}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Session Preview & Controls */}
        <div className="space-y-6">
          {/* Session Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Session Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPattern ? (
                <div className="space-y-4">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                    <h3 className="font-medium mb-2">
                      {BREATHING_PATTERNS[selectedPattern]?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {BREATHING_PATTERNS[selectedPattern]?.description}
                    </p>
                    <div className="flex justify-center items-center gap-2 text-sm">
                      <span className="px-2 py-1 bg-blue-100 rounded">
                        Inhale {BREATHING_PATTERNS[selectedPattern]?.inhale}s
                      </span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="px-2 py-1 bg-green-100 rounded">
                        Hold {BREATHING_PATTERNS[selectedPattern]?.hold}s
                      </span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="px-2 py-1 bg-purple-100 rounded">
                        Exhale {BREATHING_PATTERNS[selectedPattern]?.exhale}s
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleStartSession}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    size="lg"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start {sessionMode === "enhanced"
                      ? "Enhanced"
                      : "Classic"}{" "}
                    Session
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a goal and pattern to preview your session</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {user && history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Sessions
                    </span>
                    <span className="font-medium">{history.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      This Week
                    </span>
                    <span className="font-medium">
                      {
                        history.filter((h) => {
                          const sessionDate = new Date(h.timestamp);
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return sessionDate > weekAgo;
                        }).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Favorite Pattern
                    </span>
                    <span className="font-medium">
                      {history.reduce((acc, h) => {
                        acc[h.patternName] = (acc[h.patternName] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesktopAdaptiveSessionFlow;
