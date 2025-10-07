/**
 * AI Pattern Recommendations
 * 
 * Intelligent pattern recommendation system that analyzes user session data,
 * preferences, and performance to suggest personalized breathing patterns.
 * Integrates with the enhanced AI analysis system for comprehensive insights.
 */

import { CustomPattern } from "../patternStorage";
import { BreathingPhase } from "../breathingPatterns";
import { apiClient } from '../api/unified-client';
import { SessionData } from './config'; // DRY: Use unified SessionData interface
import { EnhancedAnalysisService } from './enhanced-analysis-service';
import { getPatternExpertise, assessExperienceLevel } from './breathing-expertise';

export interface EffectivenessReport {
  patternId: string;
  effectivenessScore: number;
  keyMetrics: {
    restlessnessReduction: number;
    breathHoldImprovement: number;
    sessionCompletionRate: number;
  };
  insights: string[];
  recommendations: string[];
}

export interface OptimizationSuggestions {
  patternId: string;
  suggestedChanges: {
    duration?: number;
    phases?: Partial<BreathingPhase>[];
    category?: 'stress' | 'sleep' | 'energy' | 'focus' | 'performance';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  };
  reasoning: string;
  expectedImprovement: number; // percentage
}

export interface UserFeedback {
  patternId: string;
  userId: string;
  rating: number; // 1-5
  comment: string;
  timestamp: string;
}

export class PatternRecommendationEngine {
  /**
   * Get personalized pattern recommendations for a user
   * Uses enhanced AI analysis and intelligent fallbacks
   */
  async getPersonalizedRecommendations(userId: string): Promise<CustomPattern[]> {
    try {
      // Try to get AI-powered recommendations from backend
      const response = await apiClient.request('ai', `/api/recommendations/personalized/${userId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.warn('AI recommendations unavailable, using intelligent fallback:', error);
    }

    // INTELLIGENT FALLBACK: Generate recommendations based on user data and expertise
    return this.generateIntelligentFallbackRecommendations(userId);
  }

  /**
   * Generate intelligent fallback recommendations using our expertise system
   */
  private async generateIntelligentFallbackRecommendations(userId: string): Promise<CustomPattern[]> {
    // Get user's recent session data to understand preferences
    const userSessions = await this.getUserRecentSessions(userId);
    
    if (userSessions.length === 0) {
      // New user - provide beginner-friendly recommendations
      return this.getBeginnerRecommendations();
    }

    // Analyze user's experience level and preferences
    const latestSession = userSessions[0];
    const experienceLevel = assessExperienceLevel({
      sessionDuration: latestSession.sessionDuration,
      stillnessScore: latestSession.restlessnessScore ? 
        Math.max(0, 100 - latestSession.restlessnessScore) : undefined,
    });

    // Get patterns based on experience level and past preferences
    return this.getRecommendationsForExperienceLevel(experienceLevel, userSessions);
  }

  /**
   * Get user's recent sessions for analysis
   */
  private async getUserRecentSessions(userId: string): Promise<SessionData[]> {
    try {
      // This would typically come from a user session history service
      // For now, return empty array as fallback
      return [];
    } catch (error) {
      console.warn('Could not fetch user sessions:', error);
      return [];
    }
  }

  /**
   * Get beginner-friendly pattern recommendations
   */
  private getBeginnerRecommendations(): CustomPattern[] {
    return [
      {
        id: 'rec-box-breathing',
        name: 'Box Breathing for Beginners',
        description: 'Perfect introduction to structured breathing with equal timing for all phases.',
        creator: 'ai-recommender',
        phases: [
          { name: 'inhale', duration: 3 },
          { name: 'hold', duration: 3 },
          { name: 'exhale', duration: 3 },
          { name: 'hold_after_exhale', duration: 3 }
        ],
        duration: 300, // 5 minutes
        category: 'stress',
        difficulty: 'beginner',
        tags: ['recommended', 'beginner-friendly'],
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'rec-simple-relaxation',
        name: 'Simple Relaxation Breath',
        description: 'Gentle breathing pattern to help you unwind and reduce stress.',
        creator: 'ai-recommender',
        phases: [
          { name: 'inhale', duration: 4 },
          { name: 'hold', duration: 2 },
          { name: 'exhale', duration: 6 },
          { name: 'hold_after_exhale', duration: 0 }
        ],
        duration: 240, // 4 minutes
        category: 'stress',
        difficulty: 'beginner',
        tags: ['recommended', 'relaxation'],
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Get recommendations based on user's experience level
   */
  private getRecommendationsForExperienceLevel(
    experienceLevel: 'beginner' | 'intermediate' | 'advanced',
    userSessions: SessionData[]
  ): CustomPattern[] {
    // Analyze user's most used patterns
    const patternUsage = this.analyzePatternUsage(userSessions);
    const mostUsedPattern = patternUsage[0]?.patternName;
    
    // Get expertise for their preferred pattern
    const patternExpertise = mostUsedPattern ? getPatternExpertise(mostUsedPattern) : null;
    
    if (experienceLevel === 'beginner') {
      return this.getBeginnerRecommendations();
    } else if (experienceLevel === 'intermediate') {
      return this.getIntermediateRecommendations(patternExpertise);
    } else {
      return this.getAdvancedRecommendations(patternExpertise);
    }
  }

  /**
   * Analyze user's pattern usage to understand preferences
   */
  private analyzePatternUsage(sessions: SessionData[]): Array<{patternName: string, count: number}> {
    const usage = sessions.reduce((acc, session) => {
      acc[session.patternName] = (acc[session.patternName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(usage)
      .map(([patternName, count]) => ({ patternName, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get intermediate-level recommendations
   */
  private getIntermediateRecommendations(preferredExpertise: any): CustomPattern[] {
    return [
      {
        id: 'rec-intermediate-box',
        name: 'Enhanced Box Breathing',
        description: 'Step up your practice with longer holds and deeper focus.',
        creator: 'ai-recommender',
        phases: [
          { name: 'inhale', duration: 4 },
          { name: 'hold', duration: 4 },
          { name: 'exhale', duration: 4 },
          { name: 'hold_after_exhale', duration: 4 }
        ],
        duration: 600, // 10 minutes
        category: 'focus',
        difficulty: 'intermediate',
        tags: ['recommended', 'progression'],
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Get advanced-level recommendations
   */
  private getAdvancedRecommendations(preferredExpertise: any): CustomPattern[] {
    return [
      {
        id: 'rec-advanced-wim-hof',
        name: 'Advanced Wim Hof Technique',
        description: 'Master-level breathing for energy and resilience.',
        creator: 'ai-recommender',
        phases: [
          { name: 'inhale', duration: 6 },
          { name: 'hold', duration: 0 },
          { name: 'exhale', duration: 6 },
          { name: 'hold_after_exhale', duration: 0 }
        ],
        duration: 900, // 15 minutes
        category: 'energy',
        difficulty: 'advanced',
        tags: ['recommended', 'advanced'],
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  async analyzePatternEffectiveness(patternId: string, sessionData: SessionData[]): Promise<EffectivenessReport> {
    const response = await apiClient.request('ai', `/api/recommendations/analysis/${patternId}`, {
      method: 'POST',
      body: JSON.stringify({ sessionData }),
    });
    
    if (!response.success) {
      throw new Error(response.error || `Failed to analyze effectiveness for pattern ${patternId}`);
    }
    
    return response.data;
  }

  async suggestOptimizations(pattern: CustomPattern, userFeedback: UserFeedback[]): Promise<OptimizationSuggestions> {
    const response = await apiClient.request('ai', '/api/recommendations/optimize', {
      method: 'POST',
      body: JSON.stringify({ pattern, userFeedback }),
    });
    
    if (!response.success) {
      throw new Error(response.error || `Failed to suggest optimizations for pattern ${pattern.id}`);
    }
    
    return response.data;
  }
}
