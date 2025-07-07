import { CustomPattern } from "../patternStorage";
import { BreathingPhase } from "../breathingPatterns";

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
    try {
      console.log("Fetching personalized recommendations for user:", userId);
      
      const response = await fetch(`/api/recommendations/personalized/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch personalized recommendations: ${response.statusText}`);
      }
      
      const recommendations = await response.json();
      return recommendations;
    } catch (error) {
      console.error("Error fetching personalized recommendations:", error);
      throw new Error(`Failed to get personalized recommendations for user ${userId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async analyzePatternEffectiveness(patternId: string, sessionData: SessionData[]): Promise<EffectivenessReport> {
    try {
      console.log("Analyzing effectiveness of pattern:", patternId, "with session data count:", sessionData.length);
      
      const response = await fetch(`/api/recommendations/analysis/${patternId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionData }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to analyze pattern effectiveness: ${response.statusText}`);
      }
      
      const report = await response.json();
      return report;
    } catch (error) {
      console.error("Error analyzing pattern effectiveness:", error);
      throw new Error(`Failed to analyze effectiveness for pattern ${patternId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async suggestOptimizations(pattern: CustomPattern, userFeedback: UserFeedback[]): Promise<OptimizationSuggestions> {
    try {
      console.log("Suggesting optimizations for pattern:", pattern.id, "based on feedback count:", userFeedback.length);
      
      const response = await fetch(`/api/recommendations/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pattern,
          userFeedback
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get optimization suggestions: ${response.statusText}`);
      }
      
      const suggestions = await response.json();
      return suggestions;
    } catch (error) {
      console.error("Error suggesting optimizations:", error);
      throw new Error(`Failed to suggest optimizations for pattern ${pattern.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
