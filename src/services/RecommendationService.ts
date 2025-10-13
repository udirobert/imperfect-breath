/**
 * Unified Recommendation Service - Single Source of Truth
 * 
 * DRY: Centralizes all recommendation logic
 * CLEAN: Clear API for all recommendation needs
 * PERFORMANT: Caching and optimization built-in
 * MODULAR: Composable service for different contexts
 */

import { SmartPatternRecommendations, type RecommendationContext, type PatternRecommendation } from "@/lib/recommendations/SmartPatternRecommendations";
import { getCache } from "@/lib/utils/cache-utils";
import { getPremiumConfidence, getContextualBadge } from "@/lib/design/premium-language";

export interface UserMood {
  id: string;
  label: string;
  goal: "stress" | "energy" | "sleep" | "focus" | "general";
  mood: "stressed" | "tired" | "anxious" | "energetic" | "calm";
}

export interface EnhancedRecommendation extends PatternRecommendation {
  badge: string;
  explanation: string;
  matchPercentage: number;
}

/**
 * PERFORMANT: Cached recommendation service
 */
export class RecommendationService {
  protected static cache = getCache();
  
  /**
   * Get recommendations based on user mood (ENHANCEMENT FIRST)
   */
  static async getRecommendationsForMood(
    userMood: UserMood,
    userLevel: "beginner" | "intermediate" | "advanced" = "beginner"
  ): Promise<EnhancedRecommendation[]> {
    const cacheKey = `mood-recommendations:${userMood.id}:${userLevel}`;
    
    return await this.cache.getOrCompute(
      cacheKey,
      async () => {
        const context: RecommendationContext = {
          timeOfDay: new Date().getHours(),
          userGoal: userMood.goal,
          currentMood: userMood.mood,
          userLevel,
          sessionType: "classic"
        };
        
        const recommendations = SmartPatternRecommendations.getRecommendations(context);
        
        // CLEAN: Transform to enhanced format with clear badges
        return recommendations.map((rec, index) => ({
          ...rec,
          matchPercentage: Math.round((rec.confidence * 100) - (index * 3)),
          badge: this.generateClearBadge(rec, index, userMood),
          explanation: this.generateClearExplanation(rec)
        }));
      },
      300000 // 5 minutes cache
    );
  }
  
  /**
   * Get time-based recommendations (fallback)
   */
  static async getTimeBasedRecommendations(
    userLevel: "beginner" | "intermediate" | "advanced" = "beginner"
  ): Promise<EnhancedRecommendation[]> {
    const hour = new Date().getHours();
    const cacheKey = `time-recommendations:${hour}:${userLevel}`;
    
    return await this.cache.getOrCompute(
      cacheKey,
      async () => {
        const context: RecommendationContext = {
          timeOfDay: hour,
          userLevel,
          sessionType: "classic"
        };
        
        const recommendations = SmartPatternRecommendations.getRecommendations(context);
        
        return recommendations.map((rec, index) => ({
          ...rec,
          matchPercentage: Math.round((rec.confidence * 100) - (index * 3)),
          badge: this.generateClearBadge(rec, index),
          explanation: this.generateClearExplanation(rec)
        }));
      },
      300000 // 5 minutes cache
    );
  }
  
  /**
   * PREMIUM: Generate luxury badges using premium language system
   * ENHANCEMENT FIRST: Now supports enhanced context for better badges
   */
  private static generateClearBadge(rec: PatternRecommendation, index: number, context?: any): string {
    // PREMIUM: Use centralized premium language system
    if (context) {
      return getContextualBadge({
        timeOfDay: context.timeOfDay,
        mood: context.mood,
        goal: context.goal,
        activity: context.recentActivity,
        energyLevel: context.energyLevel,
        stressLevel: context.stressLevel
      }, rec.patternId);
    }
    
    // Fallback to confidence-based premium language
    return getPremiumConfidence(rec.confidence, index);
  }
  
  /**
   * CLEAN: Generate clear explanations
   */
  private static generateClearExplanation(rec: PatternRecommendation): string {
    const parts = [];
    
    if (rec.reason) {
      parts.push(rec.reason);
    }
    
    if (rec.timeToEffect) {
      parts.push(`${rec.timeToEffect} to effect`);
    }
    
    if (rec.bestFor && rec.bestFor.length > 0) {
      parts.push(`Best for ${rec.bestFor[0].toLowerCase()}`);
    }
    
    return parts.join(" • ") || "Great for your wellness goals";
  }
  
  /**
   * PERFORMANT: Clear cache when needed
   */
  static clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get time-based greeting for user delight
   */
  static getTimeGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Good night";
  }
}

export default RecommendationService;
