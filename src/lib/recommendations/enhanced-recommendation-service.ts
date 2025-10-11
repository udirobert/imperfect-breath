/**
 * Enhanced Recommendation Service - Context-Aware Pattern Matching
 * 
 * ENHANCEMENT FIRST: Builds on existing RecommendationService with enhanced context
 * DRY: Consolidates all recommendation logic in one place
 * CLEAN: Clear separation between context collection and recommendation generation
 * PERFORMANT: Intelligent caching and fallback strategies
 */

import { RecommendationService, type UserMood, type EnhancedRecommendation } from "@/services/RecommendationService";
import { SmartPatternRecommendations, type RecommendationContext } from "./SmartPatternRecommendations";
import type { UserContext } from "@/components/context/ContextCollector";

export interface EnhancedUserContext {
  // Base UserContext properties
  mood?: string;
  moodGoal?: string;
  energyLevel?: number;
  sleepQuality?: string;
  stressLevel?: number;
  availableTime?: number;
  timeOfDay?: number;
  recentActivity?: string;
  
  // Enhanced properties
  sessionHistory?: any[];
  userPreferences?: {
    favoritePatterns: string[];
    effectivenessRatings: Record<string, number>;
    difficultyPreference: "beginner" | "intermediate" | "advanced";
  };
}

/**
 * ENHANCEMENT FIRST: Enhanced recommendation service with full context awareness
 */
export class EnhancedRecommendationService extends RecommendationService {
  
  /**
   * Get recommendations with enhanced context from progressive collection
   */
  static async getContextualRecommendations(
    context: EnhancedUserContext,
    userLevel: "beginner" | "intermediate" | "advanced" = "beginner"
  ): Promise<EnhancedRecommendation[]> {
    const cacheKey = `enhanced-recommendations:${JSON.stringify(context)}:${userLevel}`;
    
    return await this.cache.getOrCompute(
      cacheKey,
      async () => {
        // Create enhanced recommendation context
        const recommendationContext: RecommendationContext = {
          timeOfDay: context.timeOfDay || new Date().getHours(),
          userGoal: context.moodGoal as "focus" | "energy" | "sleep" | "stress" | "general" | undefined,
          currentMood: context.mood as any,
          userLevel,
          sessionType: "enhanced", // Enhanced because we have rich context
        };
        
        const recommendations = SmartPatternRecommendations.getRecommendations(recommendationContext);
        
        // CLEAN: Transform with enhanced context-aware badges and explanations
        return recommendations.map((rec, index) => ({
          ...rec,
          matchPercentage: this.calculateEnhancedMatchPercentage(rec, context, index),
          badge: this.generateContextAwareBadge(rec, index, context),
          explanation: this.generateEnhancedExplanation(rec, context)
        }));
      },
      300000 // 5 minutes cache
    );
  }
  
  /**
   * CLEAN: Calculate match percentage with enhanced context
   */
  private static calculateEnhancedMatchPercentage(
    rec: any, 
    context: EnhancedUserContext, 
    index: number
  ): number {
    let baseScore = Math.round(rec.confidence * 100);
    
    // Context bonuses
    if (context.energyLevel && context.energyLevel <= 2 && rec.patternId === "energy") {
      baseScore += 10;
    }
    
    if (context.stressLevel && context.stressLevel >= 4 && rec.patternId === "box") {
      baseScore += 15;
    }
    
    if (context.sleepQuality === "poorly" && rec.patternId === "relaxation") {
      baseScore += 12;
    }
    
    if (context.availableTime) {
      const timeNum = parseInt(context.availableTime.toString());
      if (timeNum <= 2 && rec.timeToEffect.includes("30 seconds")) {
        baseScore += 8;
      }
    }
    
    // Slight decrease for ranking (but less aggressive than before)
    baseScore -= (index * 2);
    
    return Math.min(100, Math.max(60, baseScore)); // Keep between 60-100
  }
  
  /**
   * CLEAN: Generate context-aware badges
   */
  private static generateContextAwareBadge(
    rec: any, 
    index: number, 
    context: EnhancedUserContext
  ): string {
    // Perfect match conditions
    if (index === 0 && rec.confidence >= 0.9) {
      return "Perfect for you";
    }
    
    // Context-specific badges
    if (context.energyLevel && context.energyLevel <= 2 && rec.patternId === "energy") {
      return "Energy boost";
    }
    
    if (context.stressLevel && context.stressLevel >= 4 && rec.patternId === "box") {
      return "Stress relief";
    }
    
    if (context.sleepQuality === "poorly" && rec.patternId === "relaxation") {
      return "Rest & restore";
    }
    
    if (context.availableTime) {
      const timeNum = parseInt(context.availableTime.toString());
      if (timeNum <= 2 && rec.timeToEffect.includes("30 seconds")) {
        return "Quick relief";
      }
      if (timeNum >= 10 && rec.timeToEffect.includes("5 minutes")) {
        return "Deep session";
      }
    }
    
    // Time-based badges
    const hour = context.timeOfDay || new Date().getHours();
    if (hour >= 6 && hour < 12 && rec.patternId === "energy") {
      return "Morning boost";
    }
    if (hour >= 18 && rec.patternId === "relaxation") {
      return "Evening calm";
    }
    if (hour >= 22 && rec.patternId === "sleep") {
      return "Sleep ready";
    }
    
    // Recent activity context
    if (context.recentActivity === "work" && rec.patternId === "box") {
      return "Work break";
    }
    if (context.recentActivity === "exercise" && rec.patternId === "relaxation") {
      return "Cool down";
    }
    
    // Confidence-based fallback
    if (rec.confidence >= 0.85) {
      return "Great match";
    }
    if (rec.confidence >= 0.7) {
      return "Good option";
    }
    
    return "Recommended";
  }
  
  /**
   * CLEAN: Generate enhanced explanations with full context
   */
  private static generateEnhancedExplanation(
    rec: any, 
    context: EnhancedUserContext
  ): string {
    const parts = [rec.reason];
    
    // Add context-specific insights
    if (context.energyLevel && context.energyLevel <= 2) {
      parts.push("Perfect for low energy");
    }
    
    if (context.stressLevel && context.stressLevel >= 4) {
      parts.push("Designed for high stress");
    }
    
    if (context.sleepQuality === "poorly") {
      parts.push("Helps with sleep recovery");
    }
    
    if (context.availableTime) {
      const timeNum = parseInt(context.availableTime.toString());
      if (timeNum <= 2) {
        parts.push("Fits your time perfectly");
      } else if (timeNum >= 10) {
        parts.push("Deep session available");
      }
    }
    
    if (context.recentActivity) {
      switch (context.recentActivity) {
        case "work":
          parts.push("Great work break");
          break;
        case "exercise":
          parts.push("Perfect cool down");
          break;
        case "eating":
          parts.push("Good for digestion");
          break;
      }
    }
    
    // Always include time to effect
    parts.push(`${rec.timeToEffect} to effect`);
    
    return parts.join(" • ");
  }
  
  /**
   * PERFORMANT: Get quick recommendations without full context collection
   */
  static async getQuickRecommendations(
    mood?: string,
    timeConstraint?: number
  ): Promise<EnhancedRecommendation[]> {
    const context: EnhancedUserContext = {
      mood,
      timeOfDay: new Date().getHours(),
      availableTime: timeConstraint,
    } as EnhancedUserContext;
    
    return this.getContextualRecommendations(context);
  }
  
  /**
   * CLEAN: Get recommendations for returning users with history
   */
  static async getPersonalizedRecommendations(
    userId: string,
    context?: Partial<EnhancedUserContext>
  ): Promise<EnhancedRecommendation[]> {
    // In a real app, this would fetch user preferences and history
    // For now, we'll use the enhanced context system
    const enhancedContext: EnhancedUserContext = {
      ...context,
      timeOfDay: new Date().getHours(),
      userPreferences: {
        favoritePatterns: [], // Would be fetched from user data
        effectivenessRatings: {},
        difficultyPreference: "beginner"
      }
    } as EnhancedUserContext;
    
    return this.getContextualRecommendations(enhancedContext);
  }
}

export default EnhancedRecommendationService;