/**
 * Enhanced AI Prompt System
 * 
 * Sophisticated prompt engineering for personalized, data-driven,
 * and scientifically-backed breathing coaching analysis.
 */

import { SessionData } from './config';
import { getPatternExpertise, assessExperienceLevel, BreathingPatternExpertise } from './breathing-expertise';

export interface EnhancedSessionData extends SessionData {
  cycleCount?: number;
  targetCycles?: number;
  stillnessScore?: number;
  consistencyScore?: number;
  phaseAccuracy?: number;
  rhythmConsistency?: number;
}

export interface AnalysisContext {
  sessionData: EnhancedSessionData;
  patternExpertise: BreathingPatternExpertise | null;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  previousSessions?: EnhancedSessionData[];
  userGoals?: string[];
}

/**
 * Generate comprehensive system prompt for AI breathing coach
 */
export function generateEnhancedSystemPrompt(): string {
  return `You are Dr. Breathe, a world-renowned breathwork expert, meditation teacher, and wellness coach with deep expertise in:

🧠 SCIENTIFIC FOUNDATION:
- Respiratory physiology and autonomic nervous system regulation
- Heart rate variability (HRV) and vagal tone optimization
- Neuroscience of breathing and its effects on brain function
- Evidence-based breathing interventions for health and performance

🫁 BREATHING EXPERTISE:
- Traditional pranayama techniques and modern breathing methods
- Pattern-specific physiological effects and optimal applications
- Progressive skill development and adaptation strategies
- Common mistakes and how to correct them

🎯 COACHING PHILOSOPHY:
- Data-driven analysis using actual session metrics
- Personalized guidance based on individual performance
- Encouraging yet honest feedback with specific improvement strategies
- Scientific explanations that educate while motivating

📊 ANALYSIS APPROACH:
You will receive detailed session data including:
- Specific breathing pattern used and its scientific basis
- Performance metrics (stillness, consistency, completion rates)
- Vision-based behavioral analysis (posture, movement)
- Historical progress data when available

ALWAYS:
✅ Reference specific numbers and metrics from the session
✅ Explain the science behind the breathing pattern used
✅ Provide targeted advice based on actual performance data
✅ Include progressive next steps for skill development
✅ Maintain an encouraging yet educational tone

NEVER:
❌ Give generic advice that could apply to any session
❌ Ignore the specific breathing pattern's unique benefits
❌ Provide suggestions without referencing actual data
❌ Use vague language when specific metrics are available

Your goal is to provide insights so personalized and valuable that users feel they have a world-class breathing coach analyzing their every session.`;
}

/**
 * Generate detailed session analysis prompt with all available data
 */
export function generateSessionAnalysisPrompt(context: AnalysisContext): string {
  const { sessionData, patternExpertise, experienceLevel, previousSessions } = context;
  
  // Calculate derived metrics
  const stillnessScore = sessionData.stillnessScore ?? 
    (sessionData.restlessnessScore ? Math.max(0, 100 - sessionData.restlessnessScore) : null);
  
  const completionRate = sessionData.targetCycles ? 
    Math.round(((sessionData.cycleCount || 0) / sessionData.targetCycles) * 100) : null;

  // Build comprehensive prompt
  let prompt = `BREATHING SESSION ANALYSIS REQUEST

📋 SESSION OVERVIEW:
Pattern: ${sessionData.patternName}
Duration: ${Math.round(sessionData.sessionDuration / 60)} minutes ${sessionData.sessionDuration % 60} seconds
Experience Level: ${experienceLevel.toUpperCase()}
Timestamp: ${sessionData.timestamp || 'Current session'}

📊 PERFORMANCE METRICS:`;

  // Core metrics
  if (sessionData.cycleCount !== undefined) {
    prompt += `\n• Cycles Completed: ${sessionData.cycleCount}${sessionData.targetCycles ? `/${sessionData.targetCycles}` : ''}`;
    if (completionRate !== null) {
      prompt += ` (${completionRate}% completion rate)`;
    }
  }

  if (stillnessScore !== null) {
    prompt += `\n• Stillness Score: ${stillnessScore}% (${getStillnessAssessment(stillnessScore)})`;
  }

  if (sessionData.breathHoldTime > 0) {
    prompt += `\n• Best Breath Hold: ${sessionData.breathHoldTime} seconds`;
  }

  // Vision metrics if available
  if (sessionData.visionMetrics) {
    const vm = sessionData.visionMetrics;
    prompt += `\n\n🎥 VISION ANALYSIS:
• Posture Score: ${Math.round(vm.postureScore * 100)}% (${getPostureAssessment(vm.postureScore)})
• Movement Level: ${Math.round(vm.movementLevel * 100)}% (${getMovementAssessment(vm.movementLevel)})
• Consistency: ${Math.round(vm.consistencyScore * 100)}% (${getConsistencyAssessment(vm.consistencyScore)})
• Detection Confidence: ${Math.round(vm.confidence * 100)}%`;
  }

  // Performance metrics
  if (sessionData.phaseAccuracy !== undefined) {
    prompt += `\n• Phase Accuracy: ${sessionData.phaseAccuracy}% (timing precision)`;
  }

  if (sessionData.rhythmConsistency !== undefined) {
    prompt += `\n• Rhythm Consistency: ${sessionData.rhythmConsistency}% (pattern stability)`;
  }

  // Pattern expertise
  if (patternExpertise) {
    prompt += `\n\n🧬 PATTERN SCIENCE - ${patternExpertise.name}:
Scientific Basis: ${patternExpertise.scientificBasis}

Key Benefits:
${patternExpertise.physiologicalEffects.map(effect => `• ${effect}`).join('\n')}

Optimal Use: ${patternExpertise.optimalUseCase}

Target Metrics for ${experienceLevel}s:
• Minimum Duration: ${Math.round(patternExpertise.targetMetrics.minDuration / 60)} minutes
• Optimal Cycles: ${patternExpertise.targetMetrics.optimalCycles}
• Stillness Target: ${patternExpertise.targetMetrics.stillnessThreshold}%
• Consistency Target: ${patternExpertise.targetMetrics.consistencyTarget}%

${experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)} Adaptation: ${patternExpertise.adaptations[experienceLevel]}`;

    // Add common mistakes if performance suggests them
    if (shouldHighlightMistakes(sessionData, patternExpertise)) {
      prompt += `\n\nCommon Mistakes to Avoid:
${patternExpertise.commonMistakes.map(mistake => `• ${mistake}`).join('\n')}`;
    }
  }

  // Historical context
  if (previousSessions && previousSessions.length > 0) {
    prompt += `\n\n📈 PROGRESS CONTEXT:
Previous Sessions (last ${previousSessions.length}):`;
    
    previousSessions.slice(-3).forEach((session, index) => {
      const prevStillness = session.stillnessScore ?? 
        (session.restlessnessScore ? Math.max(0, 100 - session.restlessnessScore) : null);
      
      prompt += `\n${index + 1}. ${session.patternName}: ${Math.round(session.sessionDuration / 60)}min, ${session.cycleCount || 0} cycles`;
      if (prevStillness !== null) {
        prompt += `, ${prevStillness}% stillness`;
      }
    });

    // Calculate trends
    const trends = calculateProgressTrends(sessionData, previousSessions);
    if (trends.length > 0) {
      prompt += `\n\nProgress Trends: ${trends.join(', ')}`;
    }
  }

  prompt += `\n\n🎯 ANALYSIS REQUEST:
Provide a comprehensive analysis that:

1. PERFORMANCE ASSESSMENT: Analyze the specific metrics above, explaining what they mean and how they compare to targets for this pattern and experience level.

2. PATTERN-SPECIFIC INSIGHTS: Explain how well the user utilized ${sessionData.patternName} based on the science and their performance data.

3. TARGETED IMPROVEMENTS: Give specific, actionable advice based on the actual metrics (not generic suggestions).

4. PROGRESSIVE GUIDANCE: Recommend next steps that build on current performance level.

5. SCIENTIFIC EDUCATION: Briefly explain the physiological benefits they're gaining from this practice.

Be specific, reference the actual numbers, and make every suggestion directly relevant to their performance data.`;

  return prompt;
}

/**
 * Helper functions for assessment
 */
function getStillnessAssessment(score: number): string {
  if (score >= 90) return 'exceptional stillness';
  if (score >= 80) return 'excellent stability';
  if (score >= 70) return 'good control';
  if (score >= 60) return 'developing stability';
  if (score >= 50) return 'moderate movement';
  return 'significant movement detected';
}

function getPostureAssessment(score: number): string {
  if (score >= 0.9) return 'excellent posture';
  if (score >= 0.8) return 'good alignment';
  if (score >= 0.7) return 'decent posture';
  if (score >= 0.6) return 'needs improvement';
  return 'poor alignment';
}

function getMovementAssessment(level: number): string {
  if (level <= 0.2) return 'very still';
  if (level <= 0.4) return 'minimal movement';
  if (level <= 0.6) return 'moderate movement';
  if (level <= 0.8) return 'noticeable movement';
  return 'significant movement';
}

function getConsistencyAssessment(score: number): string {
  if (score >= 0.9) return 'highly consistent';
  if (score >= 0.8) return 'good consistency';
  if (score >= 0.7) return 'fairly consistent';
  if (score >= 0.6) return 'somewhat variable';
  return 'inconsistent pattern';
}

/**
 * Determine if common mistakes should be highlighted
 */
function shouldHighlightMistakes(sessionData: EnhancedSessionData, expertise: BreathingPatternExpertise): boolean {
  const stillnessScore = sessionData.stillnessScore ?? 
    (sessionData.restlessnessScore ? Math.max(0, 100 - sessionData.restlessnessScore) : null);
  
  // Highlight mistakes if performance is below targets
  return (
    (stillnessScore !== null && stillnessScore < expertise.targetMetrics.stillnessThreshold) ||
    (sessionData.consistencyScore !== undefined && sessionData.consistencyScore < expertise.targetMetrics.consistencyTarget) ||
    (sessionData.sessionDuration < expertise.targetMetrics.minDuration) ||
    (sessionData.cycleCount !== undefined && sessionData.cycleCount < expertise.targetMetrics.optimalCycles)
  );
}

/**
 * Calculate progress trends from historical data
 */
function calculateProgressTrends(current: EnhancedSessionData, previous: EnhancedSessionData[]): string[] {
  if (previous.length === 0) return [];
  
  const trends: string[] = [];
  const latest = previous[previous.length - 1];
  
  // Duration trend
  if (current.sessionDuration > latest.sessionDuration * 1.2) {
    trends.push('increasing session length');
  } else if (current.sessionDuration < latest.sessionDuration * 0.8) {
    trends.push('shorter sessions recently');
  }
  
  // Stillness trend
  const currentStillness = current.stillnessScore ?? 
    (current.restlessnessScore ? Math.max(0, 100 - current.restlessnessScore) : null);
  const latestStillness = latest.stillnessScore ?? 
    (latest.restlessnessScore ? Math.max(0, 100 - latest.restlessnessScore) : null);
  
  if (currentStillness !== null && latestStillness !== null) {
    if (currentStillness > latestStillness + 10) {
      trends.push('improving stillness');
    } else if (currentStillness < latestStillness - 10) {
      trends.push('declining stillness');
    }
  }
  
  // Cycle completion trend
  if (current.cycleCount !== undefined && latest.cycleCount !== undefined) {
    if (current.cycleCount > latest.cycleCount * 1.3) {
      trends.push('increasing endurance');
    }
  }
  
  return trends;
}

/**
 * Generate follow-up questions for interactive coaching
 */
export function generateFollowUpQuestions(context: AnalysisContext): string[] {
  const { sessionData, experienceLevel, patternExpertise } = context;
  const questions: string[] = [];
  
  // Pattern-specific questions
  if (patternExpertise) {
    if (sessionData.patternName === 'Box Breathing') {
      questions.push("Did you find the 4-count rhythm comfortable, or would you prefer to start with 3-counts?");
      questions.push("Were you able to maintain smooth transitions between inhale, hold, exhale, and pause?");
    } else if (sessionData.patternName === 'Wim Hof Method') {
      questions.push("How did you feel during the breath retention phase?");
      questions.push("Did you experience any tingling or energizing sensations?");
    } else if (sessionData.patternName.includes('Relaxation') || sessionData.patternName.includes('Sleep')) {
      questions.push("Did you notice a sense of relaxation building throughout the session?");
      questions.push("How did your body feel by the end of the practice?");
    }
  }
  
  // Performance-based questions
  const stillnessScore = sessionData.stillnessScore ?? 
    (sessionData.restlessnessScore ? Math.max(0, 100 - sessionData.restlessnessScore) : null);
  
  if (stillnessScore !== null && stillnessScore < 60) {
    questions.push("What do you think contributed to the movement during your session?");
    questions.push("Would you like tips for finding a more comfortable, stable position?");
  }
  
  if (sessionData.sessionDuration < 300) {
    questions.push("What made you decide to end the session when you did?");
    questions.push("Would you like strategies for gradually extending your practice time?");
  }
  
  // Experience level questions
  if (experienceLevel === 'beginner') {
    questions.push("How are you finding the breathing practice so far?");
    questions.push("Are there any aspects of the technique you'd like me to explain further?");
  } else if (experienceLevel === 'advanced') {
    questions.push("Are you interested in exploring more challenging variations of this pattern?");
    questions.push("Would you like to discuss integrating this practice with other wellness routines?");
  }
  
  return questions.slice(0, 3); // Limit to 3 most relevant questions
}