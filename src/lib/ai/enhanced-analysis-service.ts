/**
 * Enhanced AI Analysis Service
 * 
 * Integrates the enhanced prompt system with the existing AI infrastructure
 * to provide sophisticated, personalized breathing coaching analysis.
 */

import { SessionData } from './config';
import {
  generateEnhancedSystemPrompt,
  generateSessionAnalysisPrompt,
  generateFollowUpQuestions,
  EnhancedSessionData,
  AnalysisContext
} from './enhanced-prompts';
import {
  getPatternExpertise,
  assessExperienceLevel
} from './breathing-expertise';

export interface EnhancedAnalysisRequest {
  sessionData: EnhancedSessionData;
  previousSessions?: EnhancedSessionData[];
  userGoals?: string[];
  includeFollowUpQuestions?: boolean;
}

export interface EnhancedAnalysisResponse {
  provider: string;
  providerDisplayName?: string;
  analysis: string;
  suggestions: string[];
  score: {
    overall: number;
    focus: number;
    consistency: number;
    progress: number;
  };
  nextSteps: string[];
  scientificInsights: string;
  patternSpecificGuidance: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  encouragement?: string;
  followUpQuestions?: string[];
  progressTrends?: string[];
}

/**
 * Enhanced AI Analysis Service
 */
export class EnhancedAnalysisService {
  /**
   * Prepare enhanced analysis context from session data
   */
  static prepareAnalysisContext(request: EnhancedAnalysisRequest): AnalysisContext {
    const { sessionData, previousSessions, userGoals } = request;

    // Get pattern expertise
    const patternExpertise = getPatternExpertise(sessionData.patternName);

    // Assess experience level
    const experienceLevel = assessExperienceLevel({
      sessionDuration: sessionData.sessionDuration,
      cycleCount: sessionData.cycleCount,
      stillnessScore: sessionData.stillnessScore ??
        (sessionData.restlessnessScore ? Math.max(0, 100 - sessionData.restlessnessScore) : undefined),
      consistencyScore: sessionData.visionMetrics?.consistencyScore ?
        sessionData.visionMetrics.consistencyScore * 100 : undefined
    });

    return {
      sessionData,
      patternExpertise,
      experienceLevel,
      previousSessions,
      userGoals
    };
  }

  /**
   * Generate enhanced prompts for AI analysis
   */
  static generateEnhancedPrompts(context: AnalysisContext): {
    systemPrompt: string;
    analysisPrompt: string;
    followUpQuestions: string[];
  } {
    return {
      systemPrompt: generateEnhancedSystemPrompt(),
      analysisPrompt: generateSessionAnalysisPrompt(context),
      followUpQuestions: generateFollowUpQuestions(context)
    };
  }

  /**
   * Transform session data for enhanced analysis
   */
  static transformSessionData(sessionData: SessionData): EnhancedSessionData {
    // Calculate derived metrics
    const stillnessScore = sessionData.restlessnessScore !== undefined ?
      Math.max(0, 100 - sessionData.restlessnessScore) : undefined;

    return {
      ...sessionData,
      stillnessScore,
      consistencyScore: sessionData.visionMetrics?.consistencyScore ?
        sessionData.visionMetrics.consistencyScore * 100 : undefined,
      // Add any other derived metrics here
    };
  }

  /**
   * Validate and enhance AI response
   */
  static validateAndEnhanceResponse(
    rawResponse: any,
    context: AnalysisContext
  ): EnhancedAnalysisResponse {
    const { patternExpertise, experienceLevel } = context;
    const result = rawResponse.result || rawResponse;

    // Ensure response has all required fields
    const enhancedResponse: EnhancedAnalysisResponse = {
      provider: result.provider || 'openai',
      providerDisplayName: result.providerDisplayName || 'OpenAI',
      analysis: result.analysis || result.insights || 'Analysis completed successfully.',
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [
        'Continue practicing regularly',
        'Focus on maintaining steady rhythm',
        'Gradually increase session duration'
      ],
      score: {
        overall: result.score?.overall || 75,
        focus: result.score?.focus || 70,
        consistency: result.score?.consistency || 75,
        progress: result.score?.progress || 80
      },
      nextSteps: Array.isArray(result.nextSteps) ? result.nextSteps : [
        'Practice daily for 10-15 minutes',
        'Try different breathing patterns',
        'Track your progress over time'
      ],
      scientificInsights: result.scientificInsights ||
        (patternExpertise ? patternExpertise.scientificBasis :
          'Regular breathing practice supports nervous system regulation and stress reduction.'),
      patternSpecificGuidance: result.patternSpecificGuidance ||
        (patternExpertise ? patternExpertise.adaptations[experienceLevel] :
          'Focus on maintaining a comfortable, sustainable rhythm.'),
      experienceLevel,
      encouragement: result.encouragement || 'Great job on your breathing practice!',
      followUpQuestions: Array.isArray(result.followUpQuestions) ? result.followUpQuestions : generateFollowUpQuestions(context),
      progressTrends: result.progressTrends
    };

    return enhancedResponse;
  }

  /**
   * Generate performance insights based on metrics
   */
  static generatePerformanceInsights(sessionData: EnhancedSessionData): string[] {
    const insights: string[] = [];

    // Stillness insights
    if (sessionData.stillnessScore !== undefined) {
      if (sessionData.stillnessScore >= 90) {
        insights.push('Exceptional stillness demonstrates advanced body awareness and focus.');
      } else if (sessionData.stillnessScore >= 80) {
        insights.push('Excellent stability shows strong mind-body connection.');
      } else if (sessionData.stillnessScore >= 70) {
        insights.push('Good stillness control with room for refinement.');
      } else if (sessionData.stillnessScore >= 60) {
        insights.push('Developing stability - focus on finding a comfortable position.');
      } else {
        insights.push('Significant movement detected - consider posture adjustments.');
      }
    }

    // Duration insights
    if (sessionData.sessionDuration >= 600) {
      insights.push('Extended session duration shows strong commitment to practice.');
    } else if (sessionData.sessionDuration >= 300) {
      insights.push('Good session length for building consistent habits.');
    } else {
      insights.push('Short session - consider gradually extending practice time.');
    }

    // Cycle completion insights
    if (sessionData.cycleCount !== undefined && sessionData.targetCycles !== undefined) {
      const completionRate = (sessionData.cycleCount / sessionData.targetCycles) * 100;
      if (completionRate >= 100) {
        insights.push('Full cycle completion demonstrates excellent endurance.');
      } else if (completionRate >= 80) {
        insights.push('Strong cycle completion rate shows good focus.');
      } else if (completionRate >= 60) {
        insights.push('Moderate completion rate - work on building endurance.');
      } else {
        insights.push('Low completion rate suggests need for shorter initial targets.');
      }
    }

    // Vision metrics insights
    if (sessionData.visionMetrics) {
      const vm = sessionData.visionMetrics;
      if (vm.postureScore >= 0.9) {
        insights.push('Excellent posture alignment supports optimal breathing.');
      } else if (vm.postureScore >= 0.8) {
        insights.push('Good posture with minor alignment opportunities.');
      } else if (vm.postureScore < 0.7) {
        insights.push('Posture alignment could be improved for better breathing efficiency.');
      }

      if (vm.consistencyScore >= 0.9) {
        insights.push('Highly consistent breathing pattern demonstrates mastery.');
      } else if (vm.consistencyScore >= 0.8) {
        insights.push('Good pattern consistency with room for refinement.');
      } else if (vm.consistencyScore < 0.7) {
        insights.push('Pattern consistency needs work - focus on steady rhythm.');
      }
    }

    return insights;
  }

  /**
   * Generate progressive recommendations based on performance
   */
  static generateProgressiveRecommendations(
    sessionData: EnhancedSessionData,
    experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  ): string[] {
    const recommendations: string[] = [];

    // Experience-based recommendations
    if (experienceLevel === 'beginner') {
      recommendations.push('Focus on establishing a regular daily practice routine.');
      recommendations.push('Start with shorter sessions and gradually increase duration.');
      recommendations.push('Prioritize comfort and natural breathing over perfect technique.');
    } else if (experienceLevel === 'intermediate') {
      recommendations.push('Experiment with different breathing patterns to find your preferences.');
      recommendations.push('Work on maintaining consistency throughout longer sessions.');
      recommendations.push('Begin integrating breathing practice with other wellness activities.');
    } else {
      recommendations.push('Explore advanced variations and longer practice sessions.');
      recommendations.push('Consider teaching or sharing your practice with others.');
      recommendations.push('Integrate breathing work with meditation, yoga, or performance training.');
    }

    // Performance-based recommendations
    if (sessionData.stillnessScore !== undefined && sessionData.stillnessScore < 70) {
      recommendations.push('Experiment with different seated positions to find optimal stability.');
      recommendations.push('Try practicing against a wall for additional back support.');
    }

    if (sessionData.sessionDuration < 300) {
      recommendations.push('Gradually extend sessions by 1-2 minutes each week.');
      recommendations.push('Set a gentle timer to build awareness of practice duration.');
    }

    if (sessionData.cycleCount !== undefined && sessionData.targetCycles !== undefined) {
      const completionRate = (sessionData.cycleCount / sessionData.targetCycles) * 100;
      if (completionRate < 70) {
        recommendations.push('Reduce target cycles initially to build confidence and endurance.');
        recommendations.push('Focus on quality over quantity in your breathing cycles.');
      }
    }

    return recommendations;
  }
}

/**
 * Convenience function for enhanced analysis
 */
export async function performEnhancedAnalysis(
  request: EnhancedAnalysisRequest
): Promise<{
  context: AnalysisContext;
  prompts: ReturnType<typeof EnhancedAnalysisService.generateEnhancedPrompts>;
  insights: string[];
  recommendations: string[];
}> {
  // Prepare analysis context
  const context = EnhancedAnalysisService.prepareAnalysisContext(request);

  // Generate enhanced prompts
  const prompts = EnhancedAnalysisService.generateEnhancedPrompts(context);

  // Generate performance insights
  const insights = EnhancedAnalysisService.generatePerformanceInsights(request.sessionData);

  // Generate progressive recommendations
  const recommendations = EnhancedAnalysisService.generateProgressiveRecommendations(
    request.sessionData,
    context.experienceLevel
  );

  return {
    context,
    prompts,
    insights,
    recommendations
  };
}
