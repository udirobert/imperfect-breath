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

  // Handle mood selection
  const handleMoodSelect = async (moodOption: MoodOption) => {
    setSelectedMood(moodOption.id);
    setIsLoading(true);

    try {
      // Create recommendation context based on user's mood
      const context: RecommendationContext = {
        timeOfDay: new Date().getHours(),
        userGoal: moodOption.goal,
        currentMood: moodOption.mood,
        userLevel: "beginner", // Could be made dynamic
        sessionType: "classic",
      };

      // Get personalized recommendations
      const newRecommendations =
        SmartPatternRecommendations.getRecommendations(context);

      // Add match percentages for display
      const enhancedRecommendations = newRecommendations.map((rec, index) => ({
        ...rec,
        matchPercentage: Math.round(rec.confidence * 100 - index * 5), // Slight decrease for ranking
        explanation: `${rec.reason} • ${rec.timeToEffect} to effect`,
        badge:
          index === 0
            ? "optimal time"
            : `${Math.round(rec.confidence * 100 - index * 5)}% match`,
      }));

      setRecommendations(enhancedRecommendations);
      onRecommendationsUpdate(enhancedRecommendations);
    } catch (error) {
      console.error("Failed to get recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset selection
  const handleReset = () => {
    setSelectedMood(null);
    setRecommendations([]);
    onRecommendationsUpdate([]);
  };

  if (variant === "compact") {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {getTimeGreeting()}! How are you feeling?
          </div>
          {selectedMood && (
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
        {!selectedMood ? (
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
        ) : (
          /* Selected Mood Display */
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
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
                      "w-4 h-4 rounded-full flex items-center justify-center text-white",
                      selectedMoodOption.color,
                    )}
                  >
                    <Icon className="h-2.5 w-2.5" />
                  </div>
                  <span className="text-sm font-medium">
                    {selectedMoodOption.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    • {selectedMoodOption.description}
                  </span>
                  {recommendations.length > 0 && (
                    <Badge variant="secondary" className="text-xs ml-auto">
                      <Sparkles className="h-2.5 w-2.5 mr-1" />
                      {recommendations.length} matches
                    </Badge>
                  )}
                </>
              );
            })()}
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
              Tell us how you're feeling to get personalized breathing
              recommendations
            </p>
          </div>

          {/* Mood Selection Grid */}
          {!selectedMood ? (
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

              {/* Recommendations */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Finding perfect patterns...
                  </p>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium">Recommended for you</span>
                    <Badge variant="secondary" className="text-xs">
                      {recommendations.length} matches
                    </Badge>
                  </div>
                  <div className="grid gap-3">
                    {recommendations.map((rec, index) => (
                      <div
                        key={rec.patternId}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {rec.pattern.name}
                            </span>
                            <Badge
                              variant={index === 0 ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {rec.badge}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {rec.explanation}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
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
