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
  private static cache = getCache();
  
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
          badge: this.generateClearBadge(rec, index),
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
   * CLEAN: Generate clear, helpful badges instead of confusing percentages
   */
  private static generateClearBadge(rec: PatternRecommendation, index: number): string {
    if (index === 0 && rec.confidence >= 0.9) {
      return "Perfect match";
    }
    
    if (rec.confidence >= 0.85) {
      return "Great for you";
    }
    
    if (rec.confidence >= 0.7) {
      return "Good option";
    }
    
    // Fallback to time-based badges
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12 && rec.patternId === "energy") {
      return "Morning boost";
    }
    if (hour >= 18 && rec.patternId === "relaxation") {
      return "Evening calm";
    }
    
    return "Recommended";
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
