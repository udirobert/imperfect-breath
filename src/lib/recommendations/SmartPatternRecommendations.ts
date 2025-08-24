/**
 * Smart Pattern Recommendations - Intelligent Pattern Suggestions
 * 
 * DRY: Single source of truth for recommendation logic
 * CLEAN: Separates recommendation logic from UI components
 * MODULAR: Reusable across different contexts
 */

import { BREATHING_PATTERNS } from "../breathingPatterns";

export interface RecommendationContext {
  timeOfDay?: number; // 0-23 hour
  userGoal?: "stress" | "energy" | "sleep" | "focus" | "general";
  sessionHistory?: string[]; // Previously used pattern IDs
  userLevel?: "beginner" | "intermediate" | "advanced";
  currentMood?: "stressed" | "tired" | "anxious" | "energetic" | "calm";
  sessionType?: "classic" | "enhanced";
  isFirstSession?: boolean;
}

export interface PatternRecommendation {
  patternId: string;
  pattern: typeof BREATHING_PATTERNS[keyof typeof BREATHING_PATTERNS];
  reason: string;
  confidence: number; // 0-1 scale
  timeToEffect: string;
  bestFor: string[];
  priority: "high" | "medium" | "low";
}

/**
 * ENHANCEMENT FIRST: Builds on existing pattern data with smart recommendations
 */
export class SmartPatternRecommendations {
  
  /**
   * Get personalized pattern recommendations based on context
   */
  static getRecommendations(context: RecommendationContext): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];
    
    // First session - always recommend box breathing
    if (context.isFirstSession) {
      return [{
        patternId: "box",
        pattern: BREATHING_PATTERNS.box,
        reason: "Perfect for beginners - proven to work in 30 seconds",
        confidence: 1.0,
        timeToEffect: "30 seconds",
        bestFor: ["First-time users", "Immediate stress relief"],
        priority: "high"
      }];
    }

    // Time-based recommendations
    const timeRecommendations = this.getTimeBasedRecommendations(context.timeOfDay);
    recommendations.push(...timeRecommendations);

    // Goal-based recommendations
    if (context.userGoal) {
      const goalRecommendations = this.getGoalBasedRecommendations(context.userGoal);
      recommendations.push(...goalRecommendations);
    }

    // Mood-based recommendations
    if (context.currentMood) {
      const moodRecommendations = this.getMoodBasedRecommendations(context.currentMood);
      recommendations.push(...moodRecommendations);
    }

    // Level-based filtering
    const filteredRecommendations = this.filterByUserLevel(recommendations, context.userLevel);

    // Remove duplicates and sort by confidence
    const uniqueRecommendations = this.deduplicateAndSort(filteredRecommendations);

    // Limit to top 3-4 recommendations to prevent choice paralysis
    return uniqueRecommendations.slice(0, context.sessionType === "enhanced" ? 4 : 3);
  }

  /**
   * Time-aware recommendations based on circadian rhythms
   */
  private static getTimeBasedRecommendations(hour: number = new Date().getHours()): PatternRecommendation[] {
    if (hour >= 6 && hour < 10) {
      // Morning - energy and alertness
      return [
        {
          patternId: "energy",
          pattern: BREATHING_PATTERNS.energy,
          reason: "Perfect morning energizer to start your day strong",
          confidence: 0.9,
          timeToEffect: "2 minutes",
          bestFor: ["Morning activation", "Natural energy boost"],
          priority: "high"
        },
        {
          patternId: "box",
          pattern: BREATHING_PATTERNS.box,
          reason: "Reliable morning stress relief and mental clarity",
          confidence: 0.8,
          timeToEffect: "30 seconds",
          bestFor: ["Morning anxiety", "Pre-work preparation"],
          priority: "medium"
        }
      ];
    }

    if (hour >= 10 && hour < 14) {
      // Mid-morning to early afternoon - focus and productivity
      return [
        {
          patternId: "box",
          pattern: BREATHING_PATTERNS.box,
          reason: "Enhance focus and productivity during peak hours",
          confidence: 0.9,
          timeToEffect: "30 seconds",
          bestFor: ["Work focus", "Mental clarity"],
          priority: "high"
        },
        {
          patternId: "mindfulness",
          pattern: BREATHING_PATTERNS.mindfulness,
          reason: "Maintain present-moment awareness during busy periods",
          confidence: 0.7,
          timeToEffect: "2 minutes",
          bestFor: ["Mindful productivity", "Stress prevention"],
          priority: "medium"
        }
      ];
    }

    if (hour >= 14 && hour < 18) {
      // Afternoon - combat afternoon slump
      return [
        {
          patternId: "energy",
          pattern: BREATHING_PATTERNS.energy,
          reason: "Combat afternoon energy dip naturally",
          confidence: 0.8,
          timeToEffect: "2 minutes",
          bestFor: ["Afternoon slump", "Natural energy"],
          priority: "high"
        },
        {
          patternId: "wim_hof",
          pattern: BREATHING_PATTERNS.wim_hof,
          reason: "Powerful afternoon reset for advanced practitioners",
          confidence: 0.6,
          timeToEffect: "3 minutes",
          bestFor: ["Energy boost", "Mental reset"],
          priority: "medium"
        }
      ];
    }

    if (hour >= 18 && hour < 22) {
      // Evening - transition and relaxation
      return [
        {
          patternId: "relaxation",
          pattern: BREATHING_PATTERNS.relaxation,
          reason: "Perfect evening wind-down after a busy day",
          confidence: 0.9,
          timeToEffect: "3 minutes",
          bestFor: ["Evening relaxation", "Stress release"],
          priority: "high"
        },
        {
          patternId: "box",
          pattern: BREATHING_PATTERNS.box,
          reason: "Gentle transition from work to personal time",
          confidence: 0.7,
          timeToEffect: "30 seconds",
          bestFor: ["Work-life transition", "Evening calm"],
          priority: "medium"
        }
      ];
    }

    // Night - sleep preparation
    return [
      {
        patternId: "sleep",
        pattern: BREATHING_PATTERNS.sleep,
        reason: "Scientifically designed to prepare your body for sleep",
        confidence: 0.9,
        timeToEffect: "5 minutes",
        bestFor: ["Sleep preparation", "Insomnia relief"],
        priority: "high"
      },
      {
        patternId: "relaxation",
        pattern: BREATHING_PATTERNS.relaxation,
        reason: "Deep relaxation to release the day's tension",
        confidence: 0.8,
        timeToEffect: "3 minutes",
        bestFor: ["Deep relaxation", "Bedtime routine"],
        priority: "medium"
      }
    ];
  }

  /**
   * Goal-based recommendations
   */
  private static getGoalBasedRecommendations(goal: string): PatternRecommendation[] {
    switch (goal) {
      case "stress":
        return [
          {
            patternId: "box",
            pattern: BREATHING_PATTERNS.box,
            reason: "Most effective for immediate stress relief",
            confidence: 0.95,
            timeToEffect: "30 seconds",
            bestFor: ["Acute stress", "Anxiety relief"],
            priority: "high"
          },
          {
            patternId: "relaxation",
            pattern: BREATHING_PATTERNS.relaxation,
            reason: "Deep stress release and nervous system reset",
            confidence: 0.9,
            timeToEffect: "3 minutes",
            bestFor: ["Chronic stress", "Deep relaxation"],
            priority: "high"
          }
        ];

      case "energy":
        return [
          {
            patternId: "energy",
            pattern: BREATHING_PATTERNS.energy,
            reason: "Specifically designed for natural energy boost",
            confidence: 0.9,
            timeToEffect: "2 minutes",
            bestFor: ["Natural energy", "Morning activation"],
            priority: "high"
          },
          {
            patternId: "wim_hof",
            pattern: BREATHING_PATTERNS.wim_hof,
            reason: "Powerful energizing technique for advanced users",
            confidence: 0.8,
            timeToEffect: "3 minutes",
            bestFor: ["High energy", "Cold tolerance"],
            priority: "medium"
          }
        ];

      case "sleep":
        return [
          {
            patternId: "sleep",
            pattern: BREATHING_PATTERNS.sleep,
            reason: "Scientifically optimized for sleep preparation",
            confidence: 0.95,
            timeToEffect: "5 minutes",
            bestFor: ["Sleep quality", "Insomnia"],
            priority: "high"
          },
          {
            patternId: "relaxation",
            pattern: BREATHING_PATTERNS.relaxation,
            reason: "Gentle relaxation to ease into sleep",
            confidence: 0.8,
            timeToEffect: "3 minutes",
            bestFor: ["Bedtime routine", "Anxiety relief"],
            priority: "medium"
          }
        ];

      case "focus":
        return [
          {
            patternId: "box",
            pattern: BREATHING_PATTERNS.box,
            reason: "Proven to enhance concentration and mental clarity",
            confidence: 0.9,
            timeToEffect: "30 seconds",
            bestFor: ["Work focus", "Study sessions"],
            priority: "high"
          },
          {
            patternId: "mindfulness",
            pattern: BREATHING_PATTERNS.mindfulness,
            reason: "Cultivates sustained attention and awareness",
            confidence: 0.8,
            timeToEffect: "2 minutes",
            bestFor: ["Meditation", "Present moment"],
            priority: "medium"
          }
        ];

      default:
        return [];
    }
  }

  /**
   * Mood-based recommendations
   */
  private static getMoodBasedRecommendations(mood: string): PatternRecommendation[] {
    switch (mood) {
      case "stressed":
        return [
          {
            patternId: "box",
            pattern: BREATHING_PATTERNS.box,
            reason: "Immediate stress relief in 30 seconds",
            confidence: 0.95,
            timeToEffect: "30 seconds",
            bestFor: ["Acute stress", "Emergency calm"],
            priority: "high"
          }
        ];

      case "tired":
        return [
          {
            patternId: "energy",
            pattern: BREATHING_PATTERNS.energy,
            reason: "Natural energy boost without caffeine",
            confidence: 0.9,
            timeToEffect: "2 minutes",
            bestFor: ["Fatigue", "Natural alertness"],
            priority: "high"
          }
        ];

      case "anxious":
        return [
          {
            patternId: "relaxation",
            pattern: BREATHING_PATTERNS.relaxation,
            reason: "Activates parasympathetic nervous system",
            confidence: 0.9,
            timeToEffect: "3 minutes",
            bestFor: ["Anxiety relief", "Nervous system reset"],
            priority: "high"
          }
        ];

      default:
        return [];
    }
  }

  /**
   * Filter recommendations by user experience level
   */
  private static filterByUserLevel(
    recommendations: PatternRecommendation[], 
    level: string = "beginner"
  ): PatternRecommendation[] {
    if (level === "beginner") {
      // Filter out advanced patterns for beginners
      return recommendations.filter(rec => 
        !["wim_hof"].includes(rec.patternId)
      );
    }
    return recommendations;
  }

  /**
   * Remove duplicates and sort by confidence and priority
   */
  private static deduplicateAndSort(recommendations: PatternRecommendation[]): PatternRecommendation[] {
    const seen = new Set<string>();
    const unique = recommendations.filter(rec => {
      if (seen.has(rec.patternId)) return false;
      seen.add(rec.patternId);
      return true;
    });

    return unique.sort((a, b) => {
      // Sort by priority first, then confidence
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return b.confidence - a.confidence;
    });
  }

  /**
   * Get quick recommendations for immediate use
   */
  static getQuickRecommendations(context: Partial<RecommendationContext> = {}): PatternRecommendation[] {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) {
      return [BREATHING_PATTERNS.energy, BREATHING_PATTERNS.box].map((pattern, index) => ({
        patternId: pattern.id,
        pattern,
        reason: index === 0 ? "Morning energy boost" : "Reliable stress relief",
        confidence: index === 0 ? 0.9 : 0.8,
        timeToEffect: index === 0 ? "2 minutes" : "30 seconds",
        bestFor: index === 0 ? ["Morning activation"] : ["Stress relief"],
        priority: "high" as const
      }));
    }
    
    if (hour >= 18) {
      return [BREATHING_PATTERNS.relaxation, BREATHING_PATTERNS.sleep].map((pattern, index) => ({
        patternId: pattern.id,
        pattern,
        reason: index === 0 ? "Evening wind-down" : "Sleep preparation",
        confidence: 0.9,
        timeToEffect: index === 0 ? "3 minutes" : "5 minutes",
        bestFor: index === 0 ? ["Evening relaxation"] : ["Better sleep"],
        priority: "high" as const
      }));
    }
    
    // Default to stress relief patterns
    return [{
      patternId: "box",
      pattern: BREATHING_PATTERNS.box,
      reason: "Most reliable for immediate stress relief",
      confidence: 0.95,
      timeToEffect: "30 seconds",
      bestFor: ["Stress relief", "Mental clarity"],
      priority: "high"
    }];
  }
}

export default SmartPatternRecommendations;