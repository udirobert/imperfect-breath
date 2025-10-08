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
import {
  PersonaType,
  AIPersona,
  getPersona,
  getRecommendedPersona,
  generatePersonaSystemPrompt
} from './personas';
import {
  ScientificBackingService,
  ScientificBacking
} from './scientific-backing-service';

export interface EnhancedAnalysisRequest {
  sessionData: EnhancedSessionData;
  previousSessions?: EnhancedSessionData[];
  userGoals?: string[];
  includeFollowUpQuestions?: boolean;
  selectedPersona?: PersonaType;
  userTier?: 'free' | 'premium' | 'pro';
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
  // Persona-specific fields
  persona: AIPersona;
  personaSpecificInsights?: string[];
  scientificBacking?: {
    sources: Array<{
      title: string;
      url: string;
      authors?: string[];
      journal?: string;
      year?: number;
      relevanceScore: number;
      summary: string;
    }>;
    claims: string[];
    confidence?: number;
    lastUpdated?: string;
  };
}

/**
 * Enhanced AI Analysis Service
 */
export class EnhancedAnalysisService {
  /**
   * Prepare enhanced analysis context from session data
   */
  static prepareAnalysisContext(request: EnhancedAnalysisRequest): AnalysisContext & { persona: AIPersona; userTier: 'free' | 'premium' | 'pro' } {
    const { sessionData, previousSessions, userGoals, selectedPersona, userTier = 'free' } = request;

    // Determine the persona to use
    const personaId = selectedPersona || getRecommendedPersona(userGoals || [], sessionData, userTier);
    const persona = getPersona(personaId);

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
      userGoals,
      persona,
      userTier
    };
  }

  /**
   * Generate enhanced prompts for AI analysis
   */
  static generateEnhancedPrompts(context: AnalysisContext & { persona: AIPersona; userTier: 'free' | 'premium' | 'pro' }): {
    systemPrompt: string;
    analysisPrompt: string;
    followUpQuestions: string[];
  } {
    // Use persona-specific system prompt instead of generic one
    const systemPrompt = generatePersonaSystemPrompt(context.persona);
    
    return {
      systemPrompt,
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
    context: AnalysisContext & { persona: AIPersona; userTier: 'free' | 'premium' | 'pro' }
  ): EnhancedAnalysisResponse {
    const { patternExpertise, experienceLevel, sessionData, persona } = context;
    const result = rawResponse.result || rawResponse;

    // Calculate actual scores based on session data if not provided by AI
    const restlessnessScore = sessionData.restlessnessScore;
    const stillnessScore = restlessnessScore !== undefined ? 
      Math.max(0, 100 - restlessnessScore) : 70;
    
    const cycleCount = sessionData.cycleCount || 0;
    const targetCycles = sessionData.targetCycles || 10;
    const cycleCompletionRate = targetCycles > 0 ? 
      (cycleCount / targetCycles) * 100 : 0;
    
    const durationScore = sessionData.sessionDuration ? 
      Math.min(100, Math.max(30, (sessionData.sessionDuration / 600) * 100)) : 50;

    // Generate persona-specific insights
    const personaSpecificInsights = this.generatePersonaSpecificInsights(sessionData, context.persona);

    // Ensure response has all required fields with actual data
    const enhancedResponse: EnhancedAnalysisResponse = {
      provider: result.provider || 'openai',
      providerDisplayName: result.providerDisplayName || 'OpenAI',
      persona,
      analysis: result.analysis || result.insights || 
        `Based on your actual session data: You completed ${cycleCount} cycles with ${Math.round(stillnessScore)}% stillness. ${cycleCompletionRate >= 80 ? 'Excellent cycle completion!' : cycleCompletionRate >= 60 ? 'Good cycle completion with room for improvement.' : 'Focus on building endurance for better cycle completion.'}`,
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [
        stillnessScore >= 70 ? 'Maintain your good stillness' : 'Work on minimizing movement',
        durationScore >= 70 ? 'Keep up your good session length' : 'Try gradually extending sessions',
        cycleCompletionRate >= 70 ? 'Great cycle completion!' : 'Focus on completing more cycles'
      ],
      score: {
        overall: result.score?.overall || Math.min(100, Math.max(30, Math.round((stillnessScore + cycleCompletionRate + durationScore) / 3))),
        focus: result.score?.focus || Math.min(100, Math.max(30, Math.round(stillnessScore))),
        consistency: result.score?.consistency || Math.min(100, Math.max(30, Math.round(cycleCompletionRate))),
        progress: result.score?.progress || Math.min(100, Math.max(30, Math.round(cycleCount * 10)))
      },
      nextSteps: Array.isArray(result.nextSteps) ? result.nextSteps : [
        durationScore < 70 ? 'Practice daily for 10-15 minutes' : 'Maintain your consistent practice',
        cycleCompletionRate < 70 ? 'Try to complete more cycles' : 'Increase cycle targets gradually',
        stillnessScore < 70 ? 'Focus on posture and stillness' : 'Continue developing your stillness'
      ],
      scientificInsights: result.scientificInsights ||
        (patternExpertise ? patternExpertise.scientificBasis :
          'Regular breathing practice supports nervous system regulation and stress reduction.'),
      patternSpecificGuidance: result.patternSpecificGuidance ||
        (patternExpertise ? patternExpertise.adaptations[experienceLevel] :
          `Focus on maintaining a comfortable, sustainable rhythm for ${sessionData.patternName || 'your breathing pattern'}.`),
      experienceLevel,
      encouragement: result.encouragement || `Great job on your ${sessionData.patternName || 'breathing'} practice! Based on your actual data: ${Math.round(stillnessScore)}% stillness and ${cycleCount} cycles completed.`,
      followUpQuestions: Array.isArray(result.followUpQuestions) ? result.followUpQuestions : generateFollowUpQuestions(context),
      progressTrends: result.progressTrends
    };

    // Add persona-specific fields
    enhancedResponse.persona = context.persona;
    enhancedResponse.personaSpecificInsights = [this.generatePersonaSpecificInsights(sessionData, context.persona)];
    
    // Add basic scientific backing (Perplexity integration will be added separately)
    enhancedResponse.scientificBacking = {
      sources: [],
      claims: [enhancedResponse.scientificInsights],
      confidence: 75,
      lastUpdated: new Date().toISOString()
    };

    return enhancedResponse;
  }

  /**
   * Generate persona-specific insights based on the selected AI coach
   */
  static generatePersonaSpecificInsights(sessionData: EnhancedSessionData, persona: AIPersona): string {
     const { stillnessScore = 0, cycleCount = 0, patternName = 'breathing practice' } = sessionData;
     
     switch (persona.id) {
       case 'zen':
         return `🌸 From Zen's perspective: Your ${patternName} session shows beautiful harmony between breath and blockchain wellness. The ${Math.round(stillnessScore)}% stillness reflects your growing connection to the present moment. Each of your ${cycleCount} cycles is like minting a moment of peace on the wellness blockchain! 🧘‍♀️✨`;
         
       case 'dr_breathe':
         return `🔬 Dr. Breathe's clinical analysis: Your session demonstrates measurable physiological benefits. The ${Math.round(stillnessScore)}% stillness score indicates effective parasympathetic activation, while completing ${cycleCount} cycles suggests improved respiratory control and vagal tone regulation.`;
         
       case 'performance':
         return `🏆 Coach Peak's performance insight: Outstanding effort! Your ${Math.round(stillnessScore)}% stillness shows elite-level focus control. Those ${cycleCount} cycles are building your respiratory fitness foundation. You're training your breath like an athlete - keep pushing those performance boundaries!`;
         
       case 'mindful':
         return `🕯️ Sage Serenity's wisdom: In the gentle rhythm of your ${patternName}, I see the ancient dance of breath and consciousness. Your ${Math.round(stillnessScore)}% stillness speaks to a deepening awareness, while each of your ${cycleCount} cycles carries you closer to inner harmony. The path of mindful breathing unfolds naturally.`;
         
       default:
         return `Your ${patternName} practice shows meaningful progress with ${Math.round(stillnessScore)}% stillness and ${cycleCount} completed cycles.`;
     }
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
