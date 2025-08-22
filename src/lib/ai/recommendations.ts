import { CustomPattern } from "../patternStorage";
import { BreathingPhase } from "../breathingPatterns";
import { apiClient } from '../api/unified-client';

export interface SessionData {
  id: string;
  user_id: string;
  created_at: string;
  session_duration: number;
  breath_hold_time: number;
  restlessness_score: number;
  pattern_name: string;
}

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
  async getPersonalizedRecommendations(userId: string): Promise<CustomPattern[]> {
    const response = await apiClient.request('ai', `/api/recommendations/personalized/${userId}`);
    
    if (!response.success) {
      throw new Error(response.error || `Failed to get personalized recommendations for user ${userId}`);
    }
    
    return response.data;
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
