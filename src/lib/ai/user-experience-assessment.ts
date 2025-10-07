/**
 * Enhanced User Experience Assessment
 * 
 * Sophisticated experience level assessment that combines session data,
 * historical patterns, account age, and Lens profile data for accurate
 * skill level determination and personalized coaching.
 */

import { differenceInDays, parseISO } from 'date-fns';

export interface UserProfile {
  id: string;
  email?: string;
  createdAt: string;
  wallet?: {
    address: string;
    chain: string;
  };
  lensProfile?: {
    handle: string;
    followers: number;
    following: number;
    posts: number;
    verified: boolean;
  };
}

export interface SessionHistory {
  history: Array<{
    session_duration: number;
    breath_hold_time: number;
    restlessness_score: number;
    pattern_name: string;
    created_at: string;
  }>;
  streak: number;
  totalMinutes: number;
  longestBreathHold: number;
  averageRestlessness: number;
  preferredPattern: string;
}

export interface ExperienceAssessment {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  confidence: number; // 0-100
  factors: {
    accountAge: number; // days
    totalSessions: number;
    totalPracticeTime: number; // minutes
    averageSessionLength: number; // minutes
    consistencyScore: number; // 0-100
    performanceScore: number; // 0-100
    patternDiversity: number; // unique patterns tried
    progressionRate: number; // improvement over time
  };
  recommendations: string[];
  nextMilestones: string[];
  strengths: string[];
  areasForImprovement: string[];
}

/**
 * Enhanced experience level assessment using comprehensive user data
 */
export function assessUserExperienceLevel(
  userProfile: UserProfile,
  sessionHistory: SessionHistory,
  currentSessionData?: {
    sessionDuration: number;
    cycleCount?: number;
    stillnessScore?: number;
    consistencyScore?: number;
  }
): ExperienceAssessment {
  
  // Calculate account age
  const accountAge = differenceInDays(new Date(), parseISO(userProfile.createdAt));
  
  // Analyze session history
  const totalSessions = sessionHistory.history.length;
  const totalPracticeTime = sessionHistory.totalMinutes;
  const averageSessionLength = totalSessions > 0 ? totalPracticeTime / totalSessions : 0;
  
  // Calculate consistency score (based on streak and frequency)
  const consistencyScore = calculateConsistencyScore(sessionHistory, accountAge);
  
  // Calculate performance score (based on metrics improvement)
  const performanceScore = calculatePerformanceScore(sessionHistory);
  
  // Calculate pattern diversity
  const uniquePatterns = new Set(sessionHistory.history.map(s => s.pattern_name)).size;
  const patternDiversity = Math.min(100, (uniquePatterns / 6) * 100); // 6 main patterns
  
  // Calculate progression rate
  const progressionRate = calculateProgressionRate(sessionHistory);
  
  // Determine experience level with confidence
  const { level, confidence } = determineExperienceLevel({
    accountAge,
    totalSessions,
    totalPracticeTime,
    averageSessionLength,
    consistencyScore,
    performanceScore,
    patternDiversity,
    progressionRate,
    currentSession: currentSessionData
  });
  
  // Generate personalized recommendations
  const recommendations = generateRecommendations(level, {
    accountAge,
    totalSessions,
    totalPracticeTime,
    averageSessionLength,
    consistencyScore,
    performanceScore,
    patternDiversity,
    progressionRate
  });
  
  // Generate next milestones
  const nextMilestones = generateNextMilestones(level, {
    accountAge,
    totalSessions,
    totalPracticeTime,
    averageSessionLength,
    consistencyScore,
    performanceScore,
    patternDiversity,
    progressionRate
  });
  
  // Identify strengths
  const strengths = identifyStrengths({
    accountAge,
    totalSessions,
    totalPracticeTime,
    averageSessionLength,
    consistencyScore,
    performanceScore,
    patternDiversity,
    progressionRate
  });
  
  // Identify areas for improvement
  const areasForImprovement = identifyAreasForImprovement({
    accountAge,
    totalSessions,
    totalPracticeTime,
    averageSessionLength,
    consistencyScore,
    performanceScore,
    patternDiversity,
    progressionRate
  });
  
  return {
    level,
    confidence,
    factors: {
      accountAge,
      totalSessions,
      totalPracticeTime,
      averageSessionLength,
      consistencyScore,
      performanceScore,
      patternDiversity,
      progressionRate
    },
    recommendations,
    nextMilestones,
    strengths,
    areasForImprovement
  };
}

/**
 * Calculate consistency score based on practice frequency and streaks
 */
function calculateConsistencyScore(sessionHistory: SessionHistory, accountAge: number): number {
  const { streak, history } = sessionHistory;
  
  if (history.length === 0) return 0;
  
  // Calculate practice frequency (sessions per week)
  const weeksActive = Math.max(1, accountAge / 7);
  const sessionsPerWeek = history.length / weeksActive;
  
  // Ideal frequency is 3-5 sessions per week
  const frequencyScore = Math.min(100, (sessionsPerWeek / 4) * 100);
  
  // Streak bonus (up to 30 points)
  const streakBonus = Math.min(30, streak * 2);
  
  // Recent activity bonus (last 7 days)
  const recentSessions = history.filter(s => 
    differenceInDays(new Date(), parseISO(s.created_at)) <= 7
  ).length;
  const recentActivityBonus = Math.min(20, recentSessions * 5);
  
  return Math.min(100, frequencyScore + streakBonus + recentActivityBonus);
}

/**
 * Calculate performance score based on metrics improvement over time
 */
function calculatePerformanceScore(sessionHistory: SessionHistory): number {
  const { history, averageRestlessness, longestBreathHold } = sessionHistory;
  
  if (history.length < 3) return 50; // Not enough data
  
  // Analyze improvement trends
  const recentSessions = history.slice(0, Math.min(10, Math.floor(history.length / 3)));
  const olderSessions = history.slice(-Math.min(10, Math.floor(history.length / 3)));
  
  // Calculate average metrics for recent vs older sessions
  const recentAvgDuration = recentSessions.reduce((sum, s) => sum + s.session_duration, 0) / recentSessions.length;
  const olderAvgDuration = olderSessions.reduce((sum, s) => sum + s.session_duration, 0) / olderSessions.length;
  
  const recentAvgStillness = recentSessions.reduce((sum, s) => sum + (100 - s.restlessness_score), 0) / recentSessions.length;\n  const olderAvgStillness = olderSessions.reduce((sum, s) => sum + (100 - s.restlessness_score), 0) / olderSessions.length;\n  \n  // Calculate improvement scores\n  const durationImprovement = ((recentAvgDuration - olderAvgDuration) / olderAvgDuration) * 100;\n  const stillnessImprovement = ((recentAvgStillness - olderAvgStillness) / olderAvgStillness) * 100;\n  \n  // Base performance score\n  const baseScore = Math.min(100, (recentAvgStillness + (recentAvgDuration / 600 * 50)) / 1.5);\n  \n  // Improvement bonus\n  const improvementBonus = Math.max(0, Math.min(30, (durationImprovement + stillnessImprovement) / 2));\n  \n  return Math.min(100, baseScore + improvementBonus);\n}

/**\n * Calculate progression rate (how quickly user is improving)\n */\nfunction calculateProgressionRate(sessionHistory: SessionHistory): number {\n  const { history } = sessionHistory;\n  \n  if (history.length < 5) return 50; // Not enough data\n  \n  // Analyze progression over time (last 30 days vs previous 30 days)\n  const thirtyDaysAgo = new Date();\n  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);\n  \n  const sixtyDaysAgo = new Date();\n  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);\n  \n  const recentSessions = history.filter(s => parseISO(s.created_at) >= thirtyDaysAgo);\n  const previousSessions = history.filter(s => {\n    const date = parseISO(s.created_at);\n    return date >= sixtyDaysAgo && date < thirtyDaysAgo;\n  });\n  \n  if (recentSessions.length === 0 || previousSessions.length === 0) return 50;\n  \n  // Calculate average improvements\n  const recentAvgDuration = recentSessions.reduce((sum, s) => sum + s.session_duration, 0) / recentSessions.length;\n  const previousAvgDuration = previousSessions.reduce((sum, s) => sum + s.session_duration, 0) / previousSessions.length;\n  \n  const recentAvgStillness = recentSessions.reduce((sum, s) => sum + (100 - s.restlessness_score), 0) / recentSessions.length;\n  const previousAvgStillness = previousSessions.reduce((sum, s) => sum + (100 - s.restlessness_score), 0) / previousSessions.length;\n  \n  // Calculate progression rate\n  const durationProgression = previousAvgDuration > 0 ? ((recentAvgDuration - previousAvgDuration) / previousAvgDuration) * 100 : 0;\n  const stillnessProgression = previousAvgStillness > 0 ? ((recentAvgStillness - previousAvgStillness) / previousAvgStillness) * 100 : 0;\n  \n  const overallProgression = (durationProgression + stillnessProgression) / 2;\n  \n  // Convert to 0-100 scale (0% improvement = 50, positive improvement increases score)\n  return Math.max(0, Math.min(100, 50 + overallProgression * 2));\n}\n\n/**\n * Determine experience level with confidence score\n */\nfunction determineExperienceLevel(factors: {\n  accountAge: number;\n  totalSessions: number;\n  totalPracticeTime: number;\n  averageSessionLength: number;\n  consistencyScore: number;\n  performanceScore: number;\n  patternDiversity: number;\n  progressionRate: number;\n  currentSession?: any;\n}): { level: 'beginner' | 'intermediate' | 'advanced' | 'expert', confidence: number } {\n  \n  const {\n    accountAge,\n    totalSessions,\n    totalPracticeTime,\n    averageSessionLength,\n    consistencyScore,\n    performanceScore,\n    patternDiversity,\n    progressionRate\n  } = factors;\n  \n  // Calculate weighted scores for each level\n  const scores = {\n    beginner: 0,\n    intermediate: 0,\n    advanced: 0,\n    expert: 0\n  };\n  \n  // Account age factor\n  if (accountAge < 7) scores.beginner += 30;\n  else if (accountAge < 30) scores.intermediate += 20;\n  else if (accountAge < 90) scores.advanced += 20;\n  else scores.expert += 30;\n  \n  // Total sessions factor\n  if (totalSessions < 5) scores.beginner += 25;\n  else if (totalSessions < 20) scores.intermediate += 25;\n  else if (totalSessions < 50) scores.advanced += 25;\n  else scores.expert += 25;\n  \n  // Practice time factor\n  if (totalPracticeTime < 60) scores.beginner += 20; // < 1 hour\n  else if (totalPracticeTime < 300) scores.intermediate += 20; // < 5 hours\n  else if (totalPracticeTime < 1200) scores.advanced += 20; // < 20 hours\n  else scores.expert += 20;\n  \n  // Performance and consistency\n  if (performanceScore >= 80 && consistencyScore >= 80) scores.expert += 15;\n  else if (performanceScore >= 70 && consistencyScore >= 70) scores.advanced += 15;\n  else if (performanceScore >= 60 && consistencyScore >= 60) scores.intermediate += 15;\n  else scores.beginner += 15;\n  \n  // Pattern diversity\n  if (patternDiversity >= 80) scores.expert += 10;\n  else if (patternDiversity >= 60) scores.advanced += 10;\n  else if (patternDiversity >= 40) scores.intermediate += 10;\n  else scores.beginner += 10;\n  \n  // Find the highest scoring level\n  const maxScore = Math.max(...Object.values(scores));\n  const level = Object.keys(scores).find(key => scores[key as keyof typeof scores] === maxScore) as keyof typeof scores;\n  \n  // Calculate confidence based on score separation\n  const sortedScores = Object.values(scores).sort((a, b) => b - a);\n  const confidence = Math.min(100, Math.max(60, ((sortedScores[0] - sortedScores[1]) / sortedScores[0]) * 100 + 60));\n  \n  return { level, confidence };\n}\n\n/**\n * Generate personalized recommendations based on experience level and factors\n */\nfunction generateRecommendations(level: string, factors: any): string[] {\n  const recommendations: string[] = [];\n  \n  if (level === 'beginner') {\n    recommendations.push('Focus on building a consistent daily practice');\n    recommendations.push('Start with shorter 3-5 minute sessions');\n    recommendations.push('Master Box Breathing before trying advanced patterns');\n    if (factors.consistencyScore < 50) {\n      recommendations.push('Try to practice at the same time each day');\n    }\n  } else if (level === 'intermediate') {\n    recommendations.push('Gradually increase session duration to 10+ minutes');\n    recommendations.push('Explore different breathing patterns for variety');\n    recommendations.push('Focus on improving stillness and consistency');\n    if (factors.patternDiversity < 50) {\n      recommendations.push('Try new breathing patterns to expand your practice');\n    }\n  } else if (level === 'advanced') {\n    recommendations.push('Integrate breathing with meditation or yoga');\n    recommendations.push('Experiment with longer retention times');\n    recommendations.push('Consider teaching or sharing your practice');\n    if (factors.progressionRate < 70) {\n      recommendations.push('Set specific performance goals to continue improving');\n    }\n  } else {\n    recommendations.push('Develop your own breathing sequences');\n    recommendations.push('Mentor other practitioners');\n    recommendations.push('Explore advanced pranayama techniques');\n    recommendations.push('Consider breathwork facilitator training');\n  }\n  \n  return recommendations;\n}\n\n/**\n * Generate next milestones based on current level\n */\nfunction generateNextMilestones(level: string, factors: any): string[] {\n  const milestones: string[] = [];\n  \n  if (level === 'beginner') {\n    milestones.push('Complete 10 total sessions');\n    milestones.push('Achieve a 7-day practice streak');\n    milestones.push('Master 5-minute Box Breathing sessions');\n  } else if (level === 'intermediate') {\n    milestones.push('Complete 50 total sessions');\n    milestones.push('Achieve 80%+ stillness score consistently');\n    milestones.push('Try all 6 main breathing patterns');\n  } else if (level === 'advanced') {\n    milestones.push('Complete 100 total sessions');\n    milestones.push('Achieve 15+ minute sessions regularly');\n    milestones.push('Maintain 30+ day practice streak');\n  } else {\n    milestones.push('Complete 200+ total sessions');\n    milestones.push('Achieve expert-level consistency (90%+)');\n    milestones.push('Create and share custom breathing patterns');\n  }\n  \n  return milestones;\n}\n\n/**\n * Identify user strengths based on performance data\n */\nfunction identifyStrengths(factors: any): string[] {\n  const strengths: string[] = [];\n  \n  if (factors.consistencyScore >= 80) strengths.push('Excellent practice consistency');\n  if (factors.performanceScore >= 80) strengths.push('Strong breathing technique');\n  if (factors.patternDiversity >= 70) strengths.push('Great pattern exploration');\n  if (factors.progressionRate >= 70) strengths.push('Rapid skill development');\n  if (factors.averageSessionLength >= 10) strengths.push('Good session endurance');\n  \n  return strengths;\n}\n\n/**\n * Identify areas for improvement\n */\nfunction identifyAreasForImprovement(factors: any): string[] {\n  const areas: string[] = [];\n  \n  if (factors.consistencyScore < 60) areas.push('Practice consistency');\n  if (factors.performanceScore < 60) areas.push('Breathing technique refinement');\n  if (factors.patternDiversity < 40) areas.push('Pattern variety exploration');\n  if (factors.averageSessionLength < 5) areas.push('Session duration extension');\n  if (factors.progressionRate < 50) areas.push('Performance improvement focus');\n  \n  return areas;\n}\n\n/**\n * Enhanced assessment that includes Lens profile data\n */\nexport function assessWithLensProfile(\n  userProfile: UserProfile,\n  sessionHistory: SessionHistory,\n  lensData?: {\n    handle: string;\n    followers: number;\n    posts: number;\n    verified: boolean;\n    breathingRelatedPosts?: number;\n  },\n  currentSessionData?: any\n): ExperienceAssessment {\n  \n  const baseAssessment = assessUserExperienceLevel(userProfile, sessionHistory, currentSessionData);\n  \n  // Enhance with Lens profile data\n  if (lensData) {\n    // Verified users or those with breathing-related content get credibility boost\n    if (lensData.verified || (lensData.breathingRelatedPosts && lensData.breathingRelatedPosts > 5)) {\n      if (baseAssessment.level === 'intermediate') {\n        baseAssessment.level = 'advanced';\n      } else if (baseAssessment.level === 'advanced') {\n        baseAssessment.level = 'expert';\n      }\n      baseAssessment.confidence = Math.min(100, baseAssessment.confidence + 10);\n    }\n    \n    // High follower count suggests teaching/sharing experience\n    if (lensData.followers > 1000) {\n      baseAssessment.strengths.push('Community leadership and sharing');\n      baseAssessment.recommendations.push('Continue sharing your breathing journey with your community');\n    }\n  }\n  \n  return baseAssessment;\n}"