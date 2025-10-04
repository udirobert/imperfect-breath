/**
 * Post-Session Celebration - Smart Pattern Unlock & Progression
 *
 * ENHANCEMENT FIRST: Enhances existing session completion with adaptive next steps
 * CLEAN: Separates celebration logic from session mechanics
 * MODULAR: Reusable across different session types
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { RecommendationService } from "@/services/RecommendationService";
import { PremiumAIInsights } from './PremiumAIInsights';
import { Progress } from "../ui/progress";
import {
  Trophy,
  Heart,
  Brain,
  Zap,
  Sparkles,
  ArrowRight,
  Clock,
  Target,
  Unlock,
  Star,
  Calendar,
  Users,
} from "lucide-react";
import { BREATHING_PATTERNS } from "../../lib/breathingPatterns";
import { useFirstTimeUser } from "../../hooks/useFirstTimeUser";

interface SessionMetrics {
  patternName: string;
  duration: number;
  score: number;
  cycles?: number;
  sessionType: "classic" | "enhanced";
  isFirstSession?: boolean;
}

interface PostSessionCelebrationProps {
  metrics: SessionMetrics;
  onContinue?: () => void;
  onExplorePatterns?: () => void;
  onClose?: () => void;
}

export const PostSessionCelebration: React.FC<PostSessionCelebrationProps> = ({
  metrics,
  onContinue,
  onExplorePatterns,
  onClose,
}) => {
  const navigate = useNavigate();
  const { markSessionCompleted, isFirstTime } = useFirstTimeUser();
  const [celebrationStep, setCelebrationStep] = useState<
    "impact" | "unlock" | "next"
  >("impact");

  useEffect(() => {
    // Mark session as completed for first-time user tracking
    markSessionCompleted();
  }, [markSessionCompleted]);

  const getImpactMessage = () => {
    if (metrics.score >= 80) {
      return {
        title: "Outstanding! 🎉",
        message:
          "You just activated your parasympathetic nervous system - your body's natural relaxation response. You should feel noticeably calmer and more focused.",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      };
    }
    if (metrics.score >= 60) {
      return {
        title: "Excellent work! 👏",
        message:
          "You completed a full breathing session. Even imperfect practice brings real benefits - your stress hormones are already decreasing.",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      };
    }
    return {
      title: "You did it! 💪",
      message:
        "Every breath counts. You just took a powerful step toward better stress management and mental clarity.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    };
  };

  // CLEAN: Use centralized recommendation service
  const getSmartRecommendations = async () => {
    // First session - encourage exploration
    if (!sessionResults.sessionId) {
      return [
        {
          title: "Try Different Patterns",
          description: "Explore various breathing techniques to find what works best for you",
          action: () => navigate("/patterns"),
          icon: "🌟",
          priority: "high"
        },
        {
          title: "Learn the Basics",
          description: "Understand breathing fundamentals with our guided introduction",
          action: () => navigate("/learn"),
          icon: "📚",
          priority: "medium"
        }
      ];
    }

    // ENHANCEMENT FIRST: Get AI-powered insights if vision data available
  const getAIInsights = async () => {
    if (sessionData.visionSessionId && sessionData.visionMetrics) {
      try {
        const { api } = await import('../../lib/api/unified-client');
        
        // HACKATHON: Use enhanced analysis (hide technical details from user)
        const aiResponse = await api.ai.enhancedAnalysis({
          session_data: {
            ...sessionData,
            patternName: sessionData.patternName,
            difficulty: 'intermediate', // Could be derived from pattern
          },
          analysis_type: 'session'
        });
        
        if (aiResponse.success && aiResponse.data?.result) {
          return aiResponse.data.result;
        }
      } catch (error) {
        console.warn('Personalized insights unavailable, continuing with standard recommendations:', error);
      }
    }
    return null;
  };

  const getRecommendations = async () => {
    // ENHANCEMENT FIRST: Use centralized time-based recommendations
    try {
      // HACKATHON: Get AI insights first
      const aiInsights = await getAIInsights();
      
      const timeRecommendations = await RecommendationService.getTimeBasedRecommendations();
      const recommendations = [];
      
      // ENHANCEMENT: Prioritize AI insights if available
      if (aiInsights?.nextSteps) {
        recommendations.push(...aiInsights.nextSteps.map((step: string) => ({
          title: step,
          description: "Personalized guidance based on your session",
          icon: "✨",
          priority: "high"
        })));
      }
      
      if (timeRecommendations.length > 0) {
      
      if (timeRecommendations.length > 0) {
        const topRec = timeRecommendations[0];
        recommendations.push({
          title: `Try ${topRec.pattern.name}`,
          description: topRec.explanation,
          action: () => navigate(`/session?pattern=${topRec.patternId}`),
          icon: "🎯",
          priority: "high"
        });
      }

      recommendations.push({
        title: "Track Your Progress",
        description: "View your breathing journey and improvements over time",
        action: () => navigate("/progress"),
        icon: "📈",
        priority: "medium"
      });

      return recommendations;
    } catch (error) {
      console.error("Failed to get recommendations:", error);
      return [];
    }
  };

  const impact = getImpactMessage();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [aiInsights, setAIInsights] = useState<any>(null); // PREMIUM: AI insights state
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  
  useEffect(() => {
    getSmartRecommendations().then(setRecommendations).catch(console.error);
    
    // PREMIUM: Load AI insights seamlessly
    if (sessionData.visionSessionId && sessionData.visionMetrics) {
      setIsLoadingInsights(true);
      getAIInsights()
        .then(insights => {
          if (insights) setAIInsights(insights);
        })
        .catch(console.error)
        .finally(() => setIsLoadingInsights(false));
    }
  }, [sessionResults.sessionId]);
  const duration = Math.round(metrics.duration / 60);

  // ENHANCEMENT: Haptic feedback for step transitions (PERFORMANT)
  const triggerStepHaptic = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
  };

  const handleNext = () => {
    triggerStepHaptic(); // Add haptic feedback for step transitions

    if (celebrationStep === "impact") {
      setCelebrationStep(
        metrics.sessionType === "classic" && isFirstTime ? "unlock" : "next"
      );
    } else if (celebrationStep === "unlock") {
      setCelebrationStep("next");
    }
  };

  // Impact celebration step
  if (celebrationStep === "impact") {
    return (
      <div className="space-y-6">
        {/* Main impact message */}
        <Card className={`${impact.bgColor} ${impact.borderColor} border-2`}>
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className={`text-2xl font-bold mb-3 ${impact.color}`}>
              {impact.title}
            </h3>
            <p className={`${impact.color} leading-relaxed text-lg`}>
              {impact.message}
            </p>
          </CardContent>
        </Card>

        {/* Session stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-xl font-bold">{duration}min</div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-xl font-bold">{metrics.score}/100</div>
              <div className="text-sm text-muted-foreground">Consistency</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <div className="text-xl font-bold">{metrics.cycles || "N/A"}</div>
              <div className="text-sm text-muted-foreground">Cycles</div>
            </CardContent>
          </Card>
        </div>

        {/* Immediate physiological benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <Brain className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="font-medium text-blue-700">Stress Reduced</p>
              <p className="text-sm text-blue-600">Cortisol levels lowered</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 text-center">
              <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="font-medium text-red-700">Heart Rate Calmed</p>
              <p className="text-sm text-red-600">Nervous system balanced</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <Zap className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="font-medium text-green-700">Focus Enhanced</p>
              <p className="text-sm text-green-600">Mental clarity improved</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button onClick={handleNext} size="lg" className="px-8">
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Pattern unlock step (for classic first-time users)
  if (celebrationStep === "unlock") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
            <Unlock className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            You've Unlocked More Patterns!
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            You've proven that breathing works for you. Now explore our complete
            library of scientifically-backed patterns designed for different
            goals.
          </p>
        </div>

        {/* Pattern preview grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.values(BREATHING_PATTERNS)
            .slice(1, 7)
            .map((pattern, index) => (
              <Card
                key={pattern.id}
                className="hover:shadow-md transition-all cursor-pointer"
              >
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                  </div>
                  <h4 className="font-medium text-sm mb-1">{pattern.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {pattern.benefits[0]}
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>

        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">Research shows:</span>
          </div>
          <p className="text-green-700 text-sm">
            Regular breathing practice can reduce anxiety by up to 60% and
            improve sleep quality by 40%. You're on the right path!
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => onExplorePatterns?.()}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Explore All Patterns
          </Button>
          <Button onClick={handleNext} variant="outline" className="flex-1">
            Maybe Later
          </Button>
        </div>
      </div>
    );
  }

  // Next steps recommendations
  if (celebrationStep === "next") {
    return (
      <div className="space-y-6">
        {/* PREMIUM: AI Insights - Seamless integration */}
        {aiInsights && (
          <PremiumAIInsights
            insights={aiInsights}
            sessionGoal={sessionData.sessionGoal || 'general'}
            patternName={sessionData.patternName}
            className="mb-6"
          />
        )}
        
        {/* Loading state for AI insights */}
        {isLoadingInsights && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <div className="animate-pulse flex items-center justify-center gap-3">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <span className="text-blue-700 font-medium">Personalizing your insights...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Smart Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Continue Your Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.length > 0 ? (
              recommendations.slice(0, 3).map((rec, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={rec.action}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{rec.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      <p className="text-sm text-gray-600">{rec.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center py-4">
                Keep practicing to unlock personalized recommendations!
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setCelebrationStep("impact")}
            className="flex-1"
          >
            Back
          </Button>
          <Button onClick={onContinue} className="flex-1">
            Continue
          </Button>
        </div>
      </div>
    );
  }
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">Keep the Momentum Going!</h3>
          <p className="text-muted-foreground">
            You've proven breathing works for you. Here's how to build on this
            success:
          </p>
        </div>

        <div className="space-y-4">
          {recommendations.map((rec) => {
            const Icon = rec.icon;
            const isPriority = rec.priority === "high";

            return (
              <Card
                key={rec.id}
                className={`cursor-pointer hover:shadow-lg transition-all ${
                  isPriority
                    ? "border-2 border-green-300 bg-green-50"
                    : "border-2 border-gray-200"
                }`}
                onClick={rec.action}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isPriority ? "bg-green-100" : "bg-gray-100"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            isPriority ? "text-green-600" : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div>
                        <h4
                          className={`font-semibold ${
                            isPriority ? "text-green-800" : "text-gray-800"
                          }`}
                        >
                          {rec.title}
                        </h4>
                        <p
                          className={`text-sm ${
                            isPriority ? "text-green-700" : "text-gray-600"
                          }`}
                        >
                          {rec.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {rec.timeToValue} to benefits
                        </p>
                      </div>
                    </div>
                    <ArrowRight
                      className={`h-5 w-5 ${
                        isPriority ? "text-green-600" : "text-gray-400"
                      }`}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Close
          </Button>
          <Button
            onClick={() => recommendations[0]?.action()}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {recommendations[0]?.title || "Continue"}
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default PostSessionCelebration;
