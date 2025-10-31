/** Post-Session Actions Component
 *
 * ENHANCEMENT FIRST: Transforms unclear post-session flow into engaging, actionable next steps
 * MODULAR: Reusable component for all session types with smart feature discovery
 * WELLNESS UX: Guides users naturally through their breathing journey
 * PROGRESSIVE: Shows appropriate actions based on user engagement level
 */

import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  ArrowRight,
  Trophy,
  TrendingUp,
  Users,
  Store,
  Heart,
  Brain,
  Share2,
  Target,
  Zap,
  Crown,
  Sparkles,
  RefreshCw,
  BarChart3,
  Coins,
  Award,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSessionHistory } from "../../hooks/useSessionHistory";
import { cn } from "../../lib/utils";

interface PostSessionActionsProps {
  sessionData: {
    patternName?: string;
    sessionDuration?: number;
    breathHoldTime?: number;
    restlessnessScore?: number;
    cycleCount?: number;
    targetCycles?: number;
    sessionType?: "classic" | "enhanced";
    stillnessScore?: number;
    phaseAccuracy?: number;
    rhythmConsistency?: number;
  };
  className?: string;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  priority: "high" | "medium" | "low";
  category: "practice" | "progress" | "social" | "monetize";
  requiresAuth?: boolean;
  badge?: string;
  progress?: number;
  estimatedTime?: string;
}

export const PostSessionActions: React.FC<PostSessionActionsProps> = ({
  sessionData,
  className,
}) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { user, hasWallet } = auth;
  const hasUser = auth.isAuthenticated || !!user;
  const { streak, totalMinutes, history } = useSessionHistory();

  // Calculate user progress and engagement level
  const userLevel = useMemo(() => {
    const totalSessions = history.length;
    const avgDuration = totalMinutes / Math.max(totalSessions, 1);

    if (totalSessions >= 10 && avgDuration >= 300 && streak >= 3)
      return "advanced";
    if (totalSessions >= 5 && avgDuration >= 180 && streak >= 1)
      return "intermediate";
    return "beginner";
  }, [history.length, totalMinutes, streak]);

  // Generate personalized action items based on session data and user level
  const actionItems = useMemo((): ActionItem[] => {
    const actions: ActionItem[] = [];
    const isEnhanced = sessionData.sessionType === "enhanced";
    const cycles = sessionData.cycleCount || 0;
    const duration = sessionData.sessionDuration || 0;
    const stillness = sessionData.stillnessScore;
    const breathHold = sessionData.breathHoldTime || 0;

    // IMMEDIATE NEXT PRACTICE ACTIONS
    if (duration < 300) {
      actions.push({
        id: "extend_session",
        title: "Extend Your Practice",
        description: "Try a 5-minute session for deeper relaxation benefits",
        icon: TrendingUp,
        action: () => navigate("/session/enhanced"),
        priority: "high",
        category: "practice",
        estimatedTime: "5 min",
        badge: "Recommended",
      });
    }

    if (!isEnhanced && cycles >= 5) {
      actions.push({
        id: "try_enhanced",
        title: "Experience AI Coaching",
        description: "Get real-time feedback and personalized insights",
        icon: Brain,
        action: () => navigate("/session/enhanced"),
        priority: "high",
        category: "practice",
        badge: "Upgrade",
      });
    }

    // SKILL IMPROVEMENT ACTIONS
    if (stillness !== undefined && stillness < 70) {
      actions.push({
        id: "improve_stillness",
        title: "Master Stillness",
        description: "Practice finding your optimal comfortable position",
        icon: Target,
        action: () => navigate("/session/enhanced"),
        priority: "medium",
        category: "practice",
        progress: stillness,
      });
    }

    if (breathHold < 30 && isEnhanced) {
      actions.push({
        id: "build_capacity",
        title: "Build Respiratory Capacity",
        description:
          "Gradually increase breath-hold times with guided practice",
        icon: Zap,
        action: () => navigate("/patterns"),
        priority: "medium",
        category: "practice",
      });
    }

    // PATTERN EXPLORATION
    actions.push({
      id: "explore_patterns",
      title: "Discover New Patterns",
      description: "Try Wim Hof, 4-7-8, or create your own custom pattern",
      icon: Sparkles,
      action: () => navigate("/patterns"),
      priority: "medium",
      category: "practice",
      badge: userLevel === "beginner" ? "Perfect for you" : undefined,
    });

    // SOCIAL & COMMUNITY ACTIONS
    if (hasUser) {
      actions.push({
        id: "share_progress",
        title: "Share Your Achievement",
        description: "Inspire others and celebrate your mindfulness journey",
        icon: Share2,
        action: () => {
          // Trigger Lens share flow
          const shareData = {
            patternName: sessionData.patternName,
            duration: sessionData.sessionDuration,
            score: stillness || Math.min(100, cycles * 10),
          };
          navigate("/lens/flow", {
            state: { focusTab: "share", session: shareData },
          });
        },
        priority: "medium",
        category: "social",
        requiresAuth: true,
      });
    }

    if (hasWallet && userLevel !== "beginner") {
      actions.push({
        id: "mint_nft",
        title: "Mint Your Session NFT",
        description:
          "Create a unique digital collectible of your breathing achievement",
        icon: Coins,
        action: () => navigate("/create"),
        priority: "low",
        category: "monetize",
        requiresAuth: true,
        badge: "Web3",
      });
    }

    // PROGRESS & ACHIEVEMENT ACTIONS
    if (hasUser) {
      actions.push({
        id: "view_progress",
        title: "Track Your Journey",
        description: "See your improvement over time with detailed analytics",
        icon: BarChart3,
        action: () => navigate("/progress"),
        priority: "low",
        category: "progress",
        progress: Math.min(100, (totalMinutes / 600) * 100), // 10 hours = 100%
      });
    }

    // ADVANCED USER ACTIONS
    if (userLevel === "advanced") {
      actions.push({
        id: "instructor_path",
        title: "Become a Breathing Instructor",
        description: "Share your knowledge and help others on their journey",
        icon: Crown,
        action: () => navigate("/instructor-onboarding"),
        priority: "low",
        category: "social",
        badge: "Advanced",
      });

      actions.push({
        id: "marketplace",
        title: "Explore Pattern Marketplace",
        description: "Discover premium patterns and monetize your creations",
        icon: Store,
        action: () => navigate("/marketplace"),
        priority: "low",
        category: "monetize",
      });
    }

    // STRENGTHEN HABIT ACTIONS
    if (streak < 7) {
      actions.push({
        id: "daily_streak",
        title: "Build Your Daily Habit",
        description: `Practice daily to reach a ${Math.min(7, streak + 1)}-day streak`,
        icon: Trophy,
        action: () => navigate("/session/classic"),
        priority: "high",
        category: "practice",
        progress: (streak / 7) * 100,
        badge: `${streak} day${streak !== 1 ? "s" : ""}`,
      });
    }

    // Sort by priority and add practice variety
    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [
    sessionData,
    userLevel,
    hasUser,
    hasWallet,
    navigate,
    streak,
    totalMinutes,
  ]);

  // Group actions by category for better organization
  const categorizedActions = useMemo(() => {
    const categories = {
      practice: actionItems.filter((item) => item.category === "practice"),
      progress: actionItems.filter((item) => item.category === "progress"),
      social: actionItems.filter((item) => item.category === "social"),
      monetize: actionItems.filter((item) => item.category === "monetize"),
    };
    return categories;
  }, [actionItems]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "practice":
        return Heart;
      case "progress":
        return BarChart3;
      case "social":
        return Users;
      case "monetize":
        return Coins;
      default:
        return Sparkles;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "practice":
        return "text-green-600 bg-green-50 border-green-200";
      case "progress":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "social":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "monetize":
        return "text-amber-600 bg-amber-50 border-amber-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className={cn("w-full max-w-6xl mx-auto space-y-8", className)}>
      {/* Session Achievement Summary */}
      <Card className="border-2 bg-gradient-to-r from-green-100 to-blue-100">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <CardTitle className="text-xl">Session Complete! 🎉</CardTitle>
          </div>
          <p className="text-muted-foreground">
            Great work on your {sessionData.patternName} practice! Here's what's
            next for your breathing journey.
          </p>
        </CardHeader>
      </Card>

      {/* High Priority Actions */}
      {categorizedActions.practice.slice(0, 2).map((action) => (
        <Card key={action.id} className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <action.icon className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{action.title}</h3>
                  {action.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-3">
                  {action.description}
                </p>
                {action.progress !== undefined && (
                  <div className="mb-3">
                    <Progress value={action.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(action.progress)}% complete
                    </p>
                  </div>
                )}
                <Button
                  onClick={action.action}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {action.title}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Categorized Action Sections */}
      {Object.entries(categorizedActions).map(([category, actions]) => {
        if (actions.length === 0) return null;
        const Icon = getCategoryIcon(category);
        const colorClass = getCategoryColor(category);

        return (
          <Card key={category} className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle
                className={cn("flex items-center gap-2 text-lg", colorClass)}
              >
                <Icon className="w-5 h-5" />
                {category === "practice" && "Continue Your Practice"}
                {category === "progress" && "Track Your Progress"}
                {category === "social" && "Connect & Share"}
                {category === "monetize" && "Advanced Features"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {actions.slice(category === "practice" ? 2 : 0).map((action) => (
                <div
                  key={action.id}
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={cn("p-2 rounded-full", colorClass.split(" ")[1])}
                  >
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{action.title}</h4>
                      {action.badge && (
                        <Badge variant="outline" className="text-xs">
                          {action.badge}
                        </Badge>
                      )}
                      {action.estimatedTime && (
                        <Badge variant="secondary" className="text-xs">
                          {action.estimatedTime}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                    {action.progress !== undefined && action.progress > 0 && (
                      <Progress value={action.progress} className="h-1 mt-2" />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={action.action}
                    className="shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Quick Actions Footer */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate("/session/classic")}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Practice Again
            </Button>
            <Button variant="outline" onClick={() => navigate("/patterns")}>
              <Sparkles className="w-4 h-4 mr-2" />
              New Pattern
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              <Heart className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
