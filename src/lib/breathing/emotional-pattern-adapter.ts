/**
 * Emotional Pattern Adapter
 * 
 * Intelligently recommends breathing patterns based on real-time emotional analysis
 * Enhances existing breathing patterns with emotional context
 * 
 * Core Principles:
 * - ENHANCEMENT FIRST: Works with existing breathing patterns
 * - PERFORMANT: Client-side recommendations, no server dependency
 * - CLEAN: Clear separation between emotional analysis and pattern logic
 * - MODULAR: Can be enabled/disabled independently
 */

import { BreathingPattern } from '../breathingPatterns';

export interface EmotionalContext {
  dominantEmotion: 'joy' | 'calm' | 'tension' | 'neutral';
  relaxationScore: number; // 0-100
  isDuchenneActive: boolean;
  browTension: number;
  confidence: number;
  sessionProgress: number;
}

export interface PatternRecommendation {
  patternId: string;
  reason: string;
  confidence: number;
  adaptations?: {
    inhaleRatio?: number;
    holdRatio?: number;
    exhaleRatio?: number;
    pauseRatio?: number;
    tempo?: number; // BPM adjustment
  };
  visualCues?: {
    color?: string;
    intensity?: number;
    emphasis?: 'inhale' | 'exhale' | 'hold' | 'balanced';
  };
}

export class EmotionalPatternAdapter {
  private static instance: EmotionalPatternAdapter;
  private recommendationHistory: PatternRecommendation[] = [];
  
  static getInstance(): EmotionalPatternAdapter {
    if (!EmotionalPatternAdapter.instance) {
      EmotionalPatternAdapter.instance = new EmotionalPatternAdapter();
    }
    return EmotionalPatternAdapter.instance;
  }

  /**
   * Get pattern recommendation based on emotional state
   */
  getRecommendation(
    emotionalContext: EmotionalContext,
    currentPatternId?: string,
    availablePatterns?: BreathingPattern[]
  ): PatternRecommendation | null {
    
    // Don't recommend too frequently
    if (this.recommendationHistory.length > 0) {
      const lastRecommendation = this.recommendationHistory[this.recommendationHistory.length - 1];
      // Wait at least 30 seconds between recommendations
      // (This would need timestamp tracking in real implementation)
    }

    const recommendation = this.analyzeEmotionalNeeds(emotionalContext, currentPatternId);
    
    if (recommendation && recommendation.confidence > 70) {
      this.recommendationHistory.push(recommendation);
      return recommendation;
    }

    return null;
  }

  /**
   * Adapt current pattern based on emotional state
   */
  adaptCurrentPattern(
    currentPattern: BreathingPattern,
    emotionalContext: EmotionalContext
  ): BreathingPattern {
    const adaptations = this.getPatternAdaptations(emotionalContext);
    
    if (!adaptations) return currentPattern;

    // Create adapted pattern without mutating original
    return {
      ...currentPattern,
      phases: currentPattern.phases.map(phase => ({
        ...phase,
        duration: this.adaptPhaseDuration(phase.duration, adaptations, phase.type),
      })),
      metadata: {
        ...currentPattern.metadata,
        adaptedForEmotion: emotionalContext.dominantEmotion,
        originalPattern: currentPattern.id,
      }
    };
  }

  /**
   * Get visual adaptations for breathing animation based on emotion
   */
  getVisualAdaptations(emotionalContext: EmotionalContext) {
    const { dominantEmotion, relaxationScore, isDuchenneActive } = emotionalContext;

    switch (dominantEmotion) {
      case 'tension':
        return {
          color: '#FF6B6B', // Warm red for energy release
          intensity: 0.8,
          emphasis: 'exhale' as const,
          animationStyle: 'gentle-release',
          message: 'Focus on releasing tension with each exhale'
        };

      case 'joy':
        return {
          color: isDuchenneActive ? '#4ECDC4' : '#45B7D1', // Bright teal for joy
          intensity: 0.9,
          emphasis: 'balanced' as const,
          animationStyle: 'celebratory',
          message: 'Beautiful! Maintain this peaceful state'
        };

      case 'calm':
        return {
          color: '#96CEB4', // Soft green for calm
          intensity: 0.6,
          emphasis: 'inhale' as const,
          animationStyle: 'flowing',
          message: 'Excellent relaxation - continue this rhythm'
        };

      default:
        return {
          color: '#A8A8A8', // Neutral gray
          intensity: 0.7,
          emphasis: 'balanced' as const,
          animationStyle: 'steady',
          message: 'Finding your rhythm...'
        };
    }
  }

  private analyzeEmotionalNeeds(
    emotionalContext: EmotionalContext,
    currentPatternId?: string
  ): PatternRecommendation | null {
    const { dominantEmotion, relaxationScore, browTension, confidence } = emotionalContext;

    // High tension detected
    if (dominantEmotion === 'tension' && browTension > 0.1 && confidence > 75) {
      if (currentPatternId !== '4-7-8-calming') {
        return {
          patternId: '4-7-8-calming',
          reason: 'Facial tension detected. This pattern helps release stress through extended exhales.',
          confidence: 85,
          adaptations: {
            exhaleRatio: 2.5, // Extra emphasis on exhale
            tempo: -10, // Slightly slower
          },
          visualCues: {
            color: '#FF6B6B',
            intensity: 0.8,
            emphasis: 'exhale'
          }
        };
      }
    }

    // Very relaxed state - maintain it
    if (relaxationScore > 80 && dominantEmotion === 'calm') {
      if (currentPatternId !== 'box-breathing') {
        return {
          patternId: 'box-breathing',
          reason: 'Great relaxation achieved! This steady pattern will help maintain your calm state.',
          confidence: 80,
          adaptations: {
            tempo: -5, // Slightly slower to maintain calm
          },
          visualCues: {
            color: '#96CEB4',
            intensity: 0.6,
            emphasis: 'balanced'
          }
        };
      }
    }

    // Joy state - enhance with energizing pattern
    if (dominantEmotion === 'joy' && emotionalContext.isDuchenneActive) {
      if (currentPatternId !== 'energizing-breath') {
        return {
          patternId: 'energizing-breath',
          reason: 'Wonderful mood detected! This pattern will enhance your positive energy.',
          confidence: 75,
          adaptations: {
            tempo: 5, // Slightly faster
          },
          visualCues: {
            color: '#4ECDC4',
            intensity: 0.9,
            emphasis: 'inhale'
          }
        };
      }
    }

    // Beginner guidance based on session progress
    if (emotionalContext.sessionProgress < 30 && relaxationScore < 50) {
      return {
        patternId: 'simple-breathing',
        reason: 'Starting with basics to help you settle into the session.',
        confidence: 70,
        adaptations: {
          tempo: -15, // Much slower for beginners
        },
        visualCues: {
          color: '#A8A8A8',
          intensity: 0.5,
          emphasis: 'balanced'
        }
      };
    }

    return null;
  }

  private getPatternAdaptations(emotionalContext: EmotionalContext) {
    const { dominantEmotion, relaxationScore } = emotionalContext;

    // Adapt timing based on emotional state
    switch (dominantEmotion) {
      case 'tension':
        return {
          exhaleRatio: 1.5, // Longer exhales for stress relief
          tempo: -10, // Slower overall
        };

      case 'joy':
        return {
          tempo: 5, // Slightly more energetic
          inhaleRatio: 1.1, // Emphasis on taking in positive energy
        };

      case 'calm':
        return {
          tempo: -5, // Maintain slower pace
        };

      default:
        return null;
    }
  }

  private adaptPhaseDuration(
    originalDuration: number,
    adaptations: any,
    phaseType: 'inhale' | 'hold' | 'exhale' | 'pause'
  ): number {
    let duration = originalDuration;

    // Apply specific phase adaptations
    if (adaptations.inhaleRatio && phaseType === 'inhale') {
      duration *= adaptations.inhaleRatio;
    }
    if (adaptations.exhaleRatio && phaseType === 'exhale') {
      duration *= adaptations.exhaleRatio;
    }
    if (adaptations.holdRatio && phaseType === 'hold') {
      duration *= adaptations.holdRatio;
    }
    if (adaptations.pauseRatio && phaseType === 'pause') {
      duration *= adaptations.pauseRatio;
    }

    // Apply tempo adjustments (percentage change)
    if (adaptations.tempo) {
      const tempoMultiplier = 1 + (adaptations.tempo / 100);
      duration *= tempoMultiplier;
    }

    return Math.max(1000, duration); // Minimum 1 second
  }

  /**
   * Get emotional insights for post-session analysis
   */
  getSessionInsights(emotionalHistory: EmotionalContext[]): {
    averageRelaxation: number;
    emotionalJourney: string[];
    improvements: string[];
    recommendations: string[];
  } {
    if (emotionalHistory.length === 0) {
      return {
        averageRelaxation: 0,
        emotionalJourney: [],
        improvements: [],
        recommendations: []
      };
    }

    const avgRelaxation = emotionalHistory.reduce(
      (sum, ctx) => sum + ctx.relaxationScore, 0
    ) / emotionalHistory.length;

    const emotionalJourney = this.analyzeEmotionalJourney(emotionalHistory);
    const improvements = this.identifyImprovements(emotionalHistory);
    const recommendations = this.generateFutureRecommendations(emotionalHistory);

    return {
      averageRelaxation: Math.round(avgRelaxation),
      emotionalJourney,
      improvements,
      recommendations
    };
  }

  private analyzeEmotionalJourney(history: EmotionalContext[]): string[] {
    const journey: string[] = [];
    
    // Analyze trends in chunks
    const chunkSize = Math.max(1, Math.floor(history.length / 4));
    for (let i = 0; i < history.length; i += chunkSize) {
      const chunk = history.slice(i, i + chunkSize);
      const avgRelaxation = chunk.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / chunk.length;
      const dominantEmotion = this.getMostFrequentEmotion(chunk);
      
      if (avgRelaxation > 70) {
        journey.push(`Deep relaxation (${dominantEmotion})`);
      } else if (avgRelaxation > 50) {
        journey.push(`Settling in (${dominantEmotion})`);
      } else {
        journey.push(`Finding rhythm (${dominantEmotion})`);
      }
    }

    return journey;
  }

  private getMostFrequentEmotion(contexts: EmotionalContext[]): string {
    const emotionCounts: Record<string, number> = {};
    contexts.forEach(ctx => {
      emotionCounts[ctx.dominantEmotion] = (emotionCounts[ctx.dominantEmotion] || 0) + 1;
    });
    
    return Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';
  }

  private identifyImprovements(history: EmotionalContext[]): string[] {
    const improvements: string[] = [];
    
    if (history.length < 3) return improvements;

    const start = history.slice(0, 3);
    const end = history.slice(-3);
    
    const startAvg = start.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / start.length;
    const endAvg = end.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / end.length;
    
    if (endAvg > startAvg + 10) {
      improvements.push('Significant relaxation improvement throughout session');
    }
    
    const duchenneDetected = history.some(ctx => ctx.isDuchenneActive);
    if (duchenneDetected) {
      improvements.push('Genuine happiness detected during breathing');
    }

    const tensionReduced = start.some(ctx => ctx.dominantEmotion === 'tension') && 
                          end.every(ctx => ctx.dominantEmotion !== 'tension');
    if (tensionReduced) {
      improvements.push('Successfully released facial tension');
    }

    return improvements;
  }

  private generateFutureRecommendations(history: EmotionalContext[]): string[] {
    const recommendations: string[] = [];
    
    const avgRelaxation = history.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / history.length;
    
    if (avgRelaxation < 60) {
      recommendations.push('Try longer sessions to allow more time for relaxation');
      recommendations.push('Consider starting with simpler breathing patterns');
    }
    
    const hasHighTension = history.some(ctx => ctx.browTension > 0.1);
    if (hasHighTension) {
      recommendations.push('Focus on releasing facial muscles before starting');
      recommendations.push('Try the 4-7-8 pattern for stress relief');
    }

    const hasJoyfulMoments = history.some(ctx => ctx.isDuchenneActive);
    if (hasJoyfulMoments) {
      recommendations.push('Your positive response suggests breathing meditation suits you well');
    }

    return recommendations;
  }
}