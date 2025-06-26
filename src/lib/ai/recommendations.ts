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
    // Placeholder for actual AI recommendation logic
    console.log("Fetching personalized recommendations for user:", userId);
    
    // Mock data for development
    return [
      {
        id: `recommended-${Date.now()}-1`,
        name: "Morning Calm",
        description: "A gentle start to your day",
        phases: [
          { name: "inhale", duration: 4, text: "Breathe in" },
          { name: "hold", duration: 2, text: "Hold" },
          { name: "exhale", duration: 6, text: "Breathe out" }
        ],
        category: 'stress',
        difficulty: 'beginner',
        duration: 120,
        creator: "AI Recommendation"
      },
      {
        id: `recommended-${Date.now()}-2`,
        name: "Focus Boost",
        description: "Sharpen your concentration",
        phases: [
          { name: "inhale", duration: 5, text: "Breathe in deeply" },
          { name: "hold", duration: 3, text: "Hold steady" },
          { name: "exhale", duration: 5, text: "Release slowly" }
        ],
        category: 'focus',
        difficulty: 'intermediate',
        duration: 180,
        creator: "AI Recommendation"
      }
    ];
  }

  async analyzePatternEffectiveness(patternId: string, sessionData: SessionData[]): Promise<EffectivenessReport> {
    // Placeholder for actual analysis logic
    console.log("Analyzing effectiveness of pattern:", patternId, "with session data:", sessionData);
    
    // Mock analysis for development
    let restlessnessReduction = 0;
    let breathHoldImprovement = 0;
    let completionRate = 0;
    
    if (sessionData.length > 0) {
      const avgRestlessness = sessionData.reduce((sum, s) => sum + s.restlessness_score, 0) / sessionData.length;
      const avgBreathHold = sessionData.reduce((sum, s) => sum + s.breath_hold_time, 0) / sessionData.length;
      const completedSessions = sessionData.filter(s => s.session_duration > 60).length;
      
      restlessnessReduction = 100 - (avgRestlessness * 100);
      breathHoldImprovement = avgBreathHold * 10;
      completionRate = (completedSessions / sessionData.length) * 100;
    }
    
    return {
      patternId,
      effectivenessScore: Math.min(100, Math.round((restlessnessReduction + breathHoldImprovement + completionRate) / 3)),
      keyMetrics: {
        restlessnessReduction,
        breathHoldImprovement,
        sessionCompletionRate: completionRate
      },
      insights: [
        sessionData.length > 0 ? "Pattern shows consistent usage over time" : "Limited data available for analysis",
        restlessnessReduction > 50 ? "Significant reduction in restlessness detected" : "Minimal impact on restlessness"
      ],
      recommendations: [
        restlessnessReduction < 30 ? "Consider adjusting phase durations for better calming effect" : "Maintain current pattern structure",
        breathHoldImprovement < 20 ? "Incorporate more breath hold phases if appropriate" : "Breath hold components are effective"
      ]
    };
  }

  async suggestOptimizations(pattern: CustomPattern, userFeedback: UserFeedback[]): Promise<OptimizationSuggestions> {
    // Placeholder for actual optimization logic
    console.log("Suggesting optimizations for pattern:", pattern, "based on feedback:", userFeedback);
    
    // Mock optimization for development
    const suggestedChanges: OptimizationSuggestions['suggestedChanges'] = {};
    let reasoning = "Based on user feedback analysis";
    let expectedImprovement = 10;
    
    if (userFeedback.length > 0) {
      const avgRating = userFeedback.reduce((sum, f) => sum + f.rating, 0) / userFeedback.length;
      const commonComments = userFeedback.map(f => f.comment.toLowerCase());
      
      if (avgRating < 3) {
        suggestedChanges.duration = pattern.duration + 30;
        reasoning += ", low ratings suggest the pattern may be too short or rushed";
        expectedImprovement = 20;
      }
      
      if (commonComments.some(c => c.includes("too fast"))) {
        suggestedChanges.phases = pattern.phases.map(p => ({ ...p, duration: p.duration + 1 }));
        reasoning += ", feedback indicates breathing pace is too fast";
        expectedImprovement += 15;
      } else if (commonComments.some(c => c.includes("too slow"))) {
        suggestedChanges.phases = pattern.phases.map(p => ({ ...p, duration: Math.max(1, p.duration - 1) }));
        reasoning += ", feedback indicates breathing pace is too slow";
        expectedImprovement += 15;
      }
    }
    
    return {
      patternId: pattern.id,
      suggestedChanges,
      reasoning,
      expectedImprovement
    };
  }
}
