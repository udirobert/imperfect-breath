/**
 * Mood-Based Recommendations - User-Driven Pattern Selection
 *
 * ENHANCEMENT: Improves recommendation accuracy through user input
 * UX: Simple, intuitive mood selection for better pattern matching
 * CLEAN: Compact design that fits naturally in the session flow
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Heart,
  Moon,
  Focus,
  Coffee,
  Frown,
  Smile,
  Battery,
  Brain,
  Bed,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SmartPatternRecommendations,
  type RecommendationContext,
} from "@/lib/recommendations/SmartPatternRecommendations";
import { ContextCollector, type UserContext } from "@/components/context/ContextCollector";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";

interface MoodOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  goal: "stress" | "energy" | "sleep" | "focus" | "general";
  mood: "stressed" | "tired" | "anxious" | "energetic" | "calm";
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    id: "stressed",
    label: "Stressed",
    icon: Frown,
    color: "bg-red-500",
    description: "Need to calm down",
    goal: "stress",
    mood: "stressed",
  },
  {
    id: "tired",
    label: "Tired",
    icon: Battery,
    color: "bg-orange-500",
    description: "Need energy boost",
    goal: "energy",
    mood: "tired",
  },
  {
    id: "anxious",
    label: "Anxious",
    icon: Heart,
    color: "bg-purple-500",
    description: "Need to relax",
    goal: "stress",
    mood: "anxious",
  },
  {
    id: "unfocused",
    label: "Unfocused",
    icon: Brain,
    color: "bg-blue-500",
    description: "Need mental clarity",
    goal: "focus",
    mood: "stressed",
  },
  {
    id: "restless",
    label: "Restless",
    icon: Zap,
    color: "bg-yellow-500",
    description: "Need to wind down",
    goal: "sleep",
    mood: "anxious",
  },
  {
    id: "good",
    label: "Good",
    icon: Smile,
    color: "bg-green-500",
    description: "General wellness",
    goal: "general",
    mood: "calm",
  },
];

interface RecommendationItem {
  patternId: string;
  pattern: { name: string };
  confidence: number;
  reason: string;
  timeToEffect: string;
  matchPercentage: number;
  explanation: string;
  badge: string;
}

interface MoodBasedRecommendationsProps {
  onRecommendationsUpdate: (recommendations: RecommendationItem[]) => void;
  className?: string;
  variant?: "compact" | "full";
}

export const MoodBasedRecommendations: React.FC<
  MoodBasedRecommendationsProps
> = ({ onRecommendationsUpdate, className, variant = "compact" }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showContextCollector, setShowContextCollector] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);

  // Get time-based greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Good night";
  };

  // Handle mood selection - now triggers context collection
  const handleMoodSelect = (moodOption: MoodOption) => {
    setSelectedMood(moodOption.id);
    setShowContextCollector(true);
  };

  // ENHANCEMENT FIRST: Handle enhanced context completion
  const handleContextComplete = async (context: UserContext) => {
    setUserContext(context);
    setShowContextCollector(false);
    setIsLoading(true);

    try {
      // Create enhanced recommendation context
      const enhancedContext: RecommendationContext = {
        timeOfDay: context.timeOfDay || new Date().getHours(),
        userGoal: context.moodGoal,
        currentMood: context.mood as any,
        userLevel: "beginner", // Could be made dynamic based on session history
        sessionType: "enhanced", // Enhanced because we have more context
      };

      // Get personalized recommendations with enhanced context
      const newRecommendations =
        SmartPatternRecommendations.getRecommendations(enhancedContext);

      // CLEAN: Generate contextual badges with enhanced context
      const enhancedRecommendations = newRecommendations.map((rec, index) => ({
        ...rec,
        matchPercentage: Math.round(rec.confidence * 100 - index * 2), // Better scoring with more context
        explanation: generateEnhancedExplanation(rec, context),
        badge: generateEnhancedBadge(rec, index, context),
      }));

      setRecommendations(enhancedRecommendations);
      onRecommendationsUpdate(enhancedRecommendations);
    } catch (error) {
      console.error("Failed to get recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // CLEAN: Generate enhanced badges with full context
  const generateEnhancedBadge = (rec: any, index: number, context: UserContext): string => {
    if (index === 0 && rec.confidence >= 0.9) {
      return "Perfect for you";
    }
    
    // Context-aware badges
    if (context.energyLevel && context.energyLevel <= 2 && rec.patternId === "energy") {
      return "Energy boost";
    }
    
    if (context.stressLevel && context.stressLevel >= 4 && rec.patternId === "box") {
      return "Stress relief";
    }
    
    if (context.sleepQuality === "poorly" && rec.patternId === "relaxation") {
      return "Rest & restore";
    }
    
    if (context.availableTime && parseInt(context.availableTime.toString()) <= 2 && rec.timeToEffect.includes("30 seconds")) {
      return "Quick relief";
    }
    
    // Time-based badges
    const hour = context.timeOfDay || new Date().getHours();
    if (hour >= 6 && hour < 12 && rec.patternId === "energy") {
      return "Morning boost";
    }
    if (hour >= 18 && rec.patternId === "relaxation") {
      return "Evening calm";
    }
    
    // Confidence-based fallback
    if (rec.confidence >= 0.85) {
      return "Great match";
    }
    if (rec.confidence >= 0.7) {
      return "Good option";
    }
    
    return "Recommended";
  };

  // CLEAN: Generate enhanced explanations with context
  const generateEnhancedExplanation = (rec: any, context: UserContext): string => {
    const parts = [rec.reason];
    
    if (context.energyLevel && context.energyLevel <= 2 && rec.patternId === "energy") {
      parts.push("Perfect for low energy");
    }
    
    if (context.stressLevel && context.stressLevel >= 4) {
      parts.push("Designed for high stress");
    }
    
    if (context.availableTime) {
      const timeNum = parseInt(context.availableTime.toString());
      if (timeNum <= 2) {
        parts.push("Fits your time");
      } else if (timeNum >= 10) {
        parts.push("Deep session available");
      }
    }
    
    parts.push(`${rec.timeToEffect} to effect`);
    
    return parts.join(" • ");
  };

  // Reset selection
  const handleReset = () => {
    setSelectedMood(null);
    setShowContextCollector(false);
    setUserContext(null);
    setRecommendations([]);
    onRecommendationsUpdate([]);
  };

  // Handle back from context collector
  const handleBackFromContext = () => {
    setShowContextCollector(false);
    setSelectedMood(null);
  };

  // ENHANCEMENT FIRST: Show context collector when needed
  if (showContextCollector && selectedMood) {
    const selectedMoodOption = MOOD_OPTIONS.find(m => m.id === selectedMood);
    return (
      <ContextCollector
        initialMood={selectedMood}
        onContextComplete={(context) => {
          const enhancedContext = {
            ...context,
            mood: selectedMood,
            moodGoal: selectedMoodOption?.goal,
          };
          handleContextComplete(enhancedContext);
        }}
        onBack={handleBackFromContext}
        className={className}
      />
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {getTimeGreeting()}! How are you feeling?
          </div>
          {(selectedMood || recommendations.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs h-6 px-2"
            >
              Change
            </Button>
          )}
        </div>

        {/* Mood Selection - Compact */}
        {!selectedMood && recommendations.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((mood) => {
              const Icon = mood.icon;
              return (
                <Button
                  key={mood.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleMoodSelect(mood)}
                  className="flex items-center gap-1 h-8 px-3 text-xs"
                  disabled={isLoading}
                >
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full flex items-center justify-center text-white",
                      mood.color,
                    )}
                  >
                    <Icon className="h-2 w-2" />
                  </div>
                  {mood.label}
                </Button>
              );
            })}
          </div>
        ) : null}

        {/* ENHANCEMENT FIRST: Show recommendations with new RecommendationCard */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Perfect for you</span>
              <Badge variant="secondary" className="text-xs">
                {recommendations.length} matches
              </Badge>
            </div>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <RecommendationCard
                  key={rec.patternId}
                  patternId={rec.patternId}
                  pattern={rec.pattern}
                  confidence={rec.confidence}
                  reason={rec.reason}
                  timeToEffect={rec.timeToEffect}
                  badge={rec.badge}
                  explanation={rec.explanation}
                  priority={index === 0 ? "high" : "medium"}
                  variant="compact"
                  onClick={() => {
                    // Handle pattern selection - could emit event or navigate
                    console.log("Selected pattern:", rec.patternId);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Finding your perfect patterns...
            </p>
          </div>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">
              {getTimeGreeting()}! How are you feeling?
            </h3>
            <p className="text-sm text-muted-foreground">
              {recommendations.length > 0 
                ? "Here are your personalized recommendations"
                : "Tell us how you're feeling to get personalized breathing recommendations"
              }
            </p>
          </div>

          {/* Mood Selection Grid */}
          {!selectedMood && recommendations.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {MOOD_OPTIONS.map((mood) => {
                const Icon = mood.icon;
                return (
                  <Button
                    key={mood.id}
                    variant="outline"
                    onClick={() => handleMoodSelect(mood)}
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-muted/50"
                    disabled={isLoading}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white",
                        mood.color,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-sm">{mood.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {mood.description}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          ) : (
            /* Selected Mood and Recommendations */
            <div className="space-y-4">
              {/* Selected Mood Display */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {(() => {
                    const selectedMoodOption = MOOD_OPTIONS.find(
                      (m) => m.id === selectedMood,
                    );
                    if (!selectedMoodOption) return null;
                    const Icon = selectedMoodOption.icon;
                    return (
                      <>
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-white",
                            selectedMoodOption.color,
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {selectedMoodOption.label}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {selectedMoodOption.description}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-sm"
                >
                  Change
                </Button>
              </div>

              {/* ENHANCEMENT FIRST: Enhanced Recommendations Display */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Analyzing your context for perfect matches...
                  </p>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="font-medium">Perfect for you</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {recommendations.length} personalized matches
                    </Badge>
                  </div>
                  <div className="grid gap-3">
                    {recommendations.map((rec, index) => (
                      <RecommendationCard
                        key={rec.patternId}
                        patternId={rec.patternId}
                        pattern={rec.pattern}
                        confidence={rec.confidence}
                        reason={rec.reason}
                        timeToEffect={rec.timeToEffect}
                        badge={rec.badge}
                        explanation={rec.explanation}
                        bestFor={rec.pattern.benefits?.slice(0, 2)}
                        priority={index === 0 ? "high" : index === 1 ? "medium" : "low"}
                        variant="detailed"
                        onClick={() => {
                          // Handle pattern selection
                          console.log("Selected pattern:", rec.patternId);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodBasedRecommendations;
