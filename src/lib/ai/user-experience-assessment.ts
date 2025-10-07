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

  const recentAvgStillness = recentSessions.reduce((sum, s) => sum + (100 - s.restlessness_score), 0) / recentSessions.length;
  const olderAvgStillness = olderSessions.reduce((sum, s) => sum + (100 - s.restlessness_score), 0) / olderSessions.length;

  // Calculate improvement scores
  const durationImprovement = ((recentAvgDuration - olderAvgDuration) / olderAvgDuration) * 100;
  const stillnessImprovement = ((recentAvgStillness - olderAvgStillness) / olderAvgStillness) * 100;

  // Base performance score
  const baseScore = Math.min(100, (recentAvgStillness + (recentAvgDuration / 600 * 50)) / 1.5);

  // Improvement bonus
  const improvementBonus = Math.max(0, Math.min(30, (durationImprovement + stillnessImprovement) / 2));

  return Math.min(100, baseScore + improvementBonus);
}

/**
 * Calculate progression rate (how quickly user is improving)
 */
function calculateProgressionRate(sessionHistory: SessionHistory): number {
  const { history } = sessionHistory;

  if (history.length < 5) return 50; // Not enough data

  // Analyze progression over time (last 30 days vs previous 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const recentSessions = history.filter(s => parseISO(s.created_at) >= thirtyDaysAgo);
  const previousSessions = history.filter(s => {
    const date = parseISO(s.created_at);
    return date >= sixtyDaysAgo && date < thirtyDaysAgo;
  });

  if (recentSessions.length === 0 || previousSessions.length === 0) return 50;

  // Calculate average improvements
  const recentAvgDuration = recentSessions.reduce((sum, s) => sum + s.session_duration, 0) / recentSessions.length;
  const previousAvgDuration = previousSessions.reduce((sum, s) => sum + s.session_duration, 0) / previousSessions.length;

  const recentAvgStillness = recentSessions.reduce((sum, s) => sum + (100 - s.restlessness_score), 0) / recentSessions.length;
  const previousAvgStillness = previousSessions.reduce((sum, s) => sum + (100 - s.restlessness_score), 0) / previousSessions.length;

  // Calculate progression rate
  const durationProgression = previousAvgDuration > 0 ? ((recentAvgDuration - previousAvgDuration) / previousAvgDuration) * 100 : 0;
  const stillnessProgression = previousAvgStillness > 0 ? ((recentAvgStillness - previousAvgStillness) / previousAvgStillness) * 100 : 0;

  const overallProgression = (durationProgression + stillnessProgression) / 2;

  // Convert to 0-100 scale (0% improvement = 50, positive improvement increases score)
  return Math.max(0, Math.min(100, 50 + overallProgression * 2));
}

/**
 * Determine experience level with confidence score
 */
function determineExperienceLevel(factors: {
  accountAge: number;
  totalSessions: number;
  totalPracticeTime: number;
  averageSessionLength: number;
  consistencyScore: number;
  performanceScore: number;
  patternDiversity: number;
  progressionRate: number;
  currentSession?: any;
}): { level: 'beginner' | 'intermediate' | 'advanced' | 'expert', confidence: number } {

  const {
    accountAge,
    totalSessions,
    totalPracticeTime,
    averageSessionLength,
    consistencyScore,
    performanceScore,
    patternDiversity,
    progressionRate
  } = factors;

  // Calculate weighted scores for each level
  const scores = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
    expert: 0
  };

  // Account age factor
  if (accountAge < 7) scores.beginner += 30;
  else if (accountAge < 30) scores.intermediate += 20;
  else if (accountAge < 90) scores.advanced += 20;
  else scores.expert += 30;

  // Total sessions factor
  if (totalSessions < 5) scores.beginner += 25;
  else if (totalSessions < 20) scores.intermediate += 25;
  else if (totalSessions < 50) scores.advanced += 25;
  else scores.expert += 25;

  // Practice time factor
  if (totalPracticeTime < 60) scores.beginner += 20; // < 1 hour
  else if (totalPracticeTime < 300) scores.intermediate += 20; // < 5 hours
  else if (totalPracticeTime < 1200) scores.advanced += 20; // < 20 hours
  else scores.expert += 20;

  // Performance and consistency
  if (performanceScore >= 80 && consistencyScore >= 80) scores.expert += 15;
  else if (performanceScore >= 70 && consistencyScore >= 70) scores.advanced += 15;
  else if (performanceScore >= 60 && consistencyScore >= 60) scores.intermediate += 15;
  else scores.beginner += 15;

  // Pattern diversity
  if (patternDiversity >= 80) scores.expert += 10;
  else if (patternDiversity >= 60) scores.advanced += 10;
  else if (patternDiversity >= 40) scores.intermediate += 10;
  else scores.beginner += 10;

  // Find the highest scoring level
  const maxScore = Math.max(...Object.values(scores));
  const level = Object.keys(scores).find(key => scores[key as keyof typeof scores] === maxScore) as keyof typeof scores;

  // Calculate confidence based on score separation
  const sortedScores = Object.values(scores).sort((a, b) => b - a);
  const confidence = Math.min(100, Math.max(60, ((sortedScores[0] - sortedScores[1]) / sortedScores[0]) * 100 + 60));

  return { level, confidence };
}

/**
 * Generate personalized recommendations based on experience level and factors
 */
function generateRecommendations(level: string, factors: any): string[] {
  const recommendations: string[] = [];

  if (level === 'beginner') {
    recommendations.push('Focus on building a consistent daily practice');
    recommendations.push('Start with shorter 3-5 minute sessions');
    recommendations.push('Master Box Breathing before trying advanced patterns');
    if (factors.consistencyScore < 50) {
      recommendations.push('Try to practice at the same time each day');
    }
  } else if (level === 'intermediate') {
    recommendations.push('Gradually increase session duration to 10+ minutes');
    recommendations.push('Explore different breathing patterns for variety');
    recommendations.push('Focus on improving stillness and consistency');
    if (factors.patternDiversity < 50) {
      recommendations.push('Try new breathing patterns to expand your practice');
    }
  } else if (level === 'advanced') {
    recommendations.push('Integrate breathing with meditation or yoga');
    recommendations.push('Experiment with longer retention times');
    recommendations.push('Consider teaching or sharing your practice');
    if (factors.progressionRate < 70) {
      recommendations.push('Set specific performance goals to continue improving');
    }
  } else {
    recommendations.push('Develop your own breathing sequences');
    recommendations.push('Mentor other practitioners');
    recommendations.push('Explore advanced pranayama techniques');
    recommendations.push('Consider breathwork facilitator training');
  }

  return recommendations;
}

/**
 * Generate next milestones based on current level
 */
function generateNextMilestones(level: string, factors: any): string[] {
  const milestones: string[] = [];

  if (level === 'beginner') {
    milestones.push('Complete 10 total sessions');
    milestones.push('Achieve a 7-day practice streak');
    milestones.push('Master 5-minute Box Breathing sessions');
  } else if (level === 'intermediate') {
    milestones.push('Complete 50 total sessions');
    milestones.push('Achieve 80%+ stillness score consistently');
    milestones.push('Try all 6 main breathing patterns');
  } else if (level === 'advanced') {
    milestones.push('Complete 100 total sessions');
    milestones.push('Achieve 15+ minute sessions regularly');
    milestones.push('Maintain 30+ day practice streak');
  } else {
    milestones.push('Complete 200+ total sessions');
    milestones.push('Achieve expert-level consistency (90%+)');
    milestones.push('Create and share custom breathing patterns');
  }

  return milestones;
}

/**
 * Identify user strengths based on performance data
 */
function identifyStrengths(factors: any): string[] {
  const strengths: string[] = [];

  if (factors.consistencyScore >= 80) strengths.push('Excellent practice consistency');
  if (factors.performanceScore >= 80) strengths.push('Strong breathing technique');
  if (factors.patternDiversity >= 70) strengths.push('Great pattern exploration');
  if (factors.progressionRate >= 70) strengths.push('Rapid skill development');
  if (factors.averageSessionLength >= 10) strengths.push('Good session endurance');

  return strengths;
}

/**
 * Identify areas for improvement
 */
function identifyAreasForImprovement(factors: any): string[] {
  const areas: string[] = [];

  if (factors.consistencyScore < 60) areas.push('Practice consistency');
  if (factors.performanceScore < 60) areas.push('Breathing technique refinement');
  if (factors.patternDiversity < 40) areas.push('Pattern variety exploration');
  if (factors.averageSessionLength < 5) areas.push('Session duration extension');
  if (factors.progressionRate < 50) areas.push('Performance improvement focus');

  return areas;
}

/**
 * Enhanced assessment that includes Lens profile data
 */
export function assessWithLensProfile(
  userProfile: UserProfile,
  sessionHistory: SessionHistory,
  lensData?: {
    handle: string;
    followers: number;
    posts: number;
    verified: boolean;
    breathingRelatedPosts?: number;
  },
  currentSessionData?: any
): ExperienceAssessment {

  const baseAssessment = assessUserExperienceLevel(userProfile, sessionHistory, currentSessionData);

  // Enhance with Lens profile data
  if (lensData) {
    // Verified users or those with breathing-related content get credibility boost
    if (lensData.verified || (lensData.breathingRelatedPosts && lensData.breathingRelatedPosts > 5)) {
      if (baseAssessment.level === 'intermediate') {
        baseAssessment.level = 'advanced';
      } else if (baseAssessment.level === 'advanced') {
        baseAssessment.level = 'expert';
      }
      baseAssessment.confidence = Math.min(100, baseAssessment.confidence + 10);
    }

    // High follower count suggests teaching/sharing experience
    if (lensData.followers > 1000) {
      baseAssessment.strengths.push('Community leadership and sharing');
      baseAssessment.recommendations.push('Continue sharing your breathing journey with your community');
    }
  }

  return baseAssessment;
}
