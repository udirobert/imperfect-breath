/**
 * Engagement Orchestrator
 * 
 * Coordinates user delight moments and engagement optimization across the session lifecycle
 * Focuses on psychological triggers, progressive rewards, and personalized experiences
 * 
 * Core Principles:
 * - ENHANCEMENT FIRST: Builds on existing session flow
 * - PERFORMANT: Lightweight psychological triggers
 * - CLEAN: Clear separation of engagement logic
 * - MODULAR: Can be applied to any session type
 */

import { EmotionalContext } from '../breathing/emotional-pattern-adapter';

export type EngagementPhase = 'pre-session' | 'warming-up' | 'active' | 'peak-state' | 'winding-down' | 'post-session';
export type UserPersonality = 'achiever' | 'explorer' | 'socializer' | 'mindful' | 'data-driven';
export type EngagementLevel = 'low' | 'moderate' | 'high' | 'peak';

export interface UserDelightMoment {
  id: string;
  type: 'achievement' | 'discovery' | 'progress' | 'connection' | 'insight';
  trigger: string;
  message: string;
  visual?: {
    animation?: string;
    color?: string;
    duration?: number;
    sound?: string;
  };
  timing: {
    phase: EngagementPhase;
    condition: string;
    cooldown?: number; // ms
  };
  personalization: {
    personalities: UserPersonality[];
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
    sessionCount?: { min?: number; max?: number };
  };
}

export interface EngagementMetrics {
  sessionPhase: EngagementPhase;
  engagementLevel: EngagementLevel;
  delightMoments: number;
  progressMilestones: string[];
  personalityMatch: number; // 0-100
  retentionPrediction: number; // 0-100
  sessionSatisfaction: number; // 0-100
}

export interface SessionOptimization {
  recommendedDuration: number;
  idealBreakpoints: number[];
  progressiveRewards: string[];
  personalizedElements: {
    colorScheme: string;
    encouragementStyle: string;
    feedbackFrequency: string;
  };
}

export class EngagementOrchestrator {
  private static instance: EngagementOrchestrator;
  private delightMoments: Map<string, UserDelightMoment> = new Map();
  private userProfile: {
    personality: UserPersonality;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    sessionHistory: any[];
    preferences: any;
  };
  private sessionState: {
    phase: EngagementPhase;
    startTime: number;
    lastDelightMoment: number;
    milestones: string[];
    emotionalJourney: EmotionalContext[];
  };

  static getInstance(): EngagementOrchestrator {
    if (!EngagementOrchestrator.instance) {
      EngagementOrchestrator.instance = new EngagementOrchestrator();
    }
    return EngagementOrchestrator.instance;
  }

  constructor() {
    this.initializeDelightMoments();
    this.userProfile = {
      personality: 'mindful', // Default
      experienceLevel: 'beginner',
      sessionHistory: [],
      preferences: {}
    };
    this.sessionState = {
      phase: 'pre-session',
      startTime: 0,
      lastDelightMoment: 0,
      milestones: [],
      emotionalJourney: []
    };
  }

  /**
   * Initialize pre-defined delight moments
   */
  private initializeDelightMoments() {
    const delightMoments: UserDelightMoment[] = [
      // Pre-session delight moments
      {
        id: 'welcome-personalization',
        type: 'connection',
        trigger: 'session-start',
        message: 'Welcome back! I notice you prefer {pattern} - shall we continue your journey?',
        visual: { animation: 'gentle-glow', color: '#4ECDC4', duration: 2000 },
        timing: { phase: 'pre-session', condition: 'returning_user' },
        personalization: { personalities: ['achiever', 'mindful'], sessionCount: { min: 2 } }
      },
      {
        id: 'streak-celebration',
        type: 'achievement',
        trigger: 'session-start',
        message: '🔥 {streak} day streak! Your consistency is building powerful habits.',
        visual: { animation: 'confetti-burst', color: '#FF6B6B', duration: 3000 },
        timing: { phase: 'pre-session', condition: 'streak >= 3' },
        personalization: { personalities: ['achiever', 'data-driven'] }
      },
      {
        id: 'new-pattern-discovery',
        type: 'discovery',
        trigger: 'pattern-suggestion',
        message: '✨ Discovered a new pattern perfect for your current state!',
        visual: { animation: 'sparkle-reveal', color: '#9B59B6', duration: 2500 },
        timing: { phase: 'pre-session', condition: 'emotional_state_analysis', cooldown: 300000 },
        personalization: { personalities: ['explorer', 'data-driven'] }
      },

      // During session delight moments
      {
        id: 'first-duchenne',
        type: 'achievement',
        trigger: 'duchenne-detected',
        message: '😊 Beautiful! Your genuine smile shows the power of mindful breathing.',
        visual: { animation: 'heart-pulse', color: '#4ECDC4', duration: 2000 },
        timing: { phase: 'active', condition: 'duchenne_first_time', cooldown: 60000 },
        personalization: { personalities: ['mindful', 'achiever', 'socializer'] }
      },
      {
        id: 'tension-release',
        type: 'progress',
        trigger: 'stress-reduction',
        message: '🌊 Excellent! I can see the tension melting away from your face.',
        visual: { animation: 'wave-relief', color: '#96CEB4', duration: 2500 },
        timing: { phase: 'active', condition: 'tension_to_calm_transition', cooldown: 120000 },
        personalization: { personalities: ['mindful', 'data-driven'] }
      },
      {
        id: 'deep-state-achievement',
        type: 'achievement',
        trigger: 'relaxation-peak',
        message: '🧘 Incredible! You\'ve reached a deep meditative state. Stay present.',
        visual: { animation: 'zen-ripple', color: '#E8F5E8', duration: 3000 },
        timing: { phase: 'peak-state', condition: 'relaxation_score > 85', cooldown: 300000 },
        personalization: { personalities: ['mindful', 'achiever'] }
      },
      {
        id: 'consistency-micro-win',
        type: 'progress',
        trigger: 'rhythm-maintained',
        message: '🎯 Perfect rhythm! Your consistency is deepening the practice.',
        visual: { animation: 'gentle-pulse', color: '#3498DB', duration: 1500 },
        timing: { phase: 'active', condition: 'steady_breathing_3min', cooldown: 180000 },
        personalization: { personalities: ['achiever', 'data-driven'] }
      },

      // Post-session delight moments
      {
        id: 'improvement-celebration',
        type: 'achievement',
        trigger: 'session-complete',
        message: '📈 Amazing progress! {improvement}% improvement in relaxation today.',
        visual: { animation: 'growth-chart', color: '#2ECC71', duration: 3000 },
        timing: { phase: 'post-session', condition: 'significant_improvement' },
        personalization: { personalities: ['achiever', 'data-driven'] }
      },
      {
        id: 'emotional-insight',
        type: 'insight',
        trigger: 'session-analysis',
        message: '🌟 Insight: You find deepest peace with {pattern}. This is your signature style!',
        visual: { animation: 'insight-glow', color: '#F39C12', duration: 2500 },
        timing: { phase: 'post-session', condition: 'pattern_affinity_discovered' },
        personalization: { personalities: ['explorer', 'mindful', 'data-driven'] }
      },
      {
        id: 'social-encouragement',
        type: 'connection',
        trigger: 'session-complete',
        message: '🤝 You\'re part of {community_size} people who found peace today. Collective calm!',
        visual: { animation: 'community-ripple', color: '#8E44AD', duration: 2000 },
        timing: { phase: 'post-session', condition: 'community_engagement_enabled' },
        personalization: { personalities: ['socializer', 'achiever'] }
      }
    ];

    delightMoments.forEach(moment => {
      this.delightMoments.set(moment.id, moment);
    });
  }

  /**
   * Set user profile for personalized experiences
   */
  setUserProfile(profile: Partial<typeof this.userProfile>) {
    this.userProfile = { ...this.userProfile, ...profile };
  }

  /**
   * Detect user personality from behavior patterns
   */
  detectPersonality(sessionHistory: any[], preferences: any): UserPersonality {
    let scores = {
      achiever: 0,
      explorer: 0,
      socializer: 0,
      mindful: 0,
      'data-driven': 0
    };

    // Analyze session history patterns
    if (sessionHistory.length > 0) {
      const avgDuration = sessionHistory.reduce((sum, s) => sum + s.duration, 0) / sessionHistory.length;
      const patternVariety = new Set(sessionHistory.map(s => s.pattern)).size;
      const completionRate = sessionHistory.filter(s => s.completed).length / sessionHistory.length;

      // Achiever indicators
      if (completionRate > 0.8) scores.achiever += 20;
      if (sessionHistory.length > 10) scores.achiever += 15;
      if (avgDuration > 600) scores.achiever += 10; // 10+ minute sessions

      // Explorer indicators
      if (patternVariety > 3) scores.explorer += 25;
      if (sessionHistory.some(s => s.customPattern)) scores.explorer += 20;

      // Data-driven indicators
      if (preferences.detailedMetrics) scores['data-driven'] += 30;
      if (preferences.exportData) scores['data-driven'] += 20;

      // Mindful indicators
      if (avgDuration > 900) scores.mindful += 25; // 15+ minute sessions
      if (sessionHistory.some(s => s.emotionalImprovement > 30)) scores.mindful += 20;

      // Socializer indicators
      if (preferences.shareProgress) scores.socializer += 25;
      if (preferences.communityFeatures) scores.socializer += 20;
    }

    // Return highest scoring personality
    return Object.entries(scores).sort(([,a], [,b]) => b - a)[0][0] as UserPersonality;
  }

  /**
   * Update session phase and trigger appropriate delight moments
   */
  updateSessionPhase(
    phase: EngagementPhase, 
    context: {
      emotionalState?: EmotionalContext;
      sessionData?: any;
      milestones?: string[];
    }
  ): UserDelightMoment[] {
    this.sessionState.phase = phase;
    
    if (context.emotionalState) {
      this.sessionState.emotionalJourney.push(context.emotionalState);
    }

    const triggeredMoments: UserDelightMoment[] = [];
    const now = Date.now();

    // Check all delight moments for triggers
    this.delightMoments.forEach(moment => {
      if (this.shouldTriggerMoment(moment, context, now)) {
        triggeredMoments.push(moment);
        this.sessionState.lastDelightMoment = now;
        this.sessionState.milestones.push(moment.id);
      }
    });

    return triggeredMoments;
  }

  /**
   * Determine if a delight moment should be triggered
   */
  private shouldTriggerMoment(
    moment: UserDelightMoment, 
    context: any, 
    now: number
  ): boolean {
    // Check phase match
    if (moment.timing.phase !== this.sessionState.phase) return false;

    // Check cooldown
    if (moment.timing.cooldown && 
        now - this.sessionState.lastDelightMoment < moment.timing.cooldown) {
      return false;
    }

    // Check personalization match
    if (!this.matchesPersonalization(moment.personalization)) return false;

    // Check specific conditions
    return this.evaluateCondition(moment.timing.condition, context);
  }

  /**
   * Check if moment matches user personalization criteria
   */
  private matchesPersonalization(personalization: UserDelightMoment['personalization']): boolean {
    // Check personality match
    if (!personalization.personalities.includes(this.userProfile.personality)) {
      return false;
    }

    // Check experience level
    if (personalization.experienceLevel && 
        personalization.experienceLevel !== this.userProfile.experienceLevel) {
      return false;
    }

    // Check session count
    const sessionCount = this.userProfile.sessionHistory.length;
    if (personalization.sessionCount) {
      if (personalization.sessionCount.min && sessionCount < personalization.sessionCount.min) {
        return false;
      }
      if (personalization.sessionCount.max && sessionCount > personalization.sessionCount.max) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate trigger conditions
   */
  private evaluateCondition(condition: string, context: any): boolean {
    switch (condition) {
      case 'session-start':
        return true;
      
      case 'returning_user':
        return this.userProfile.sessionHistory.length > 1;
      
      case 'duchenne_first_time':
        return context.emotionalState?.isDuchenneActive && 
               !this.sessionState.milestones.includes('first-duchenne');
      
      case 'tension_to_calm_transition':
        const recentStates = this.sessionState.emotionalJourney.slice(-10);
        return recentStates.length >= 5 &&
               recentStates.slice(0, 3).every(s => s.dominantEmotion === 'tension') &&
               recentStates.slice(-3).every(s => s.dominantEmotion === 'calm');
      
      case 'significant_improvement':
        return context.sessionData?.improvementPercentage > 25;
      
      case 'steady_breathing_3min':
        return this.sessionState.emotionalJourney.length >= 360 && // 3min at 2fps
               this.sessionState.emotionalJourney.slice(-360).every(s => s.relaxationScore > 60);
      
      default:
        return false;
    }
  }

  /**
   * Get session optimization recommendations
   */
  getSessionOptimization(
    currentDuration: number,
    emotionalHistory: EmotionalContext[]
  ): SessionOptimization {
    const personality = this.userProfile.personality;
    const experience = this.userProfile.experienceLevel;

    // Base recommendations by personality
    let recommendedDuration = 600; // 10 minutes default
    let idealBreakpoints: number[] = [];
    let progressiveRewards: string[] = [];

    switch (personality) {
      case 'achiever':
        recommendedDuration = experience === 'beginner' ? 600 : 900; // 10-15 min
        idealBreakpoints = [300, 600, 900]; // 5, 10, 15 min milestones
        progressiveRewards = ['consistency-badge', 'duration-achievement', 'streak-milestone'];
        break;
      
      case 'explorer':
        recommendedDuration = 480; // 8 minutes - shorter for variety
        idealBreakpoints = [240, 480]; // 4, 8 min
        progressiveRewards = ['new-pattern-unlock', 'technique-mastery', 'variety-explorer'];
        break;
      
      case 'mindful':
        recommendedDuration = 1200; // 20 minutes - deeper practice
        idealBreakpoints = [600, 900, 1200]; // 10, 15, 20 min
        progressiveRewards = ['deep-state-achievement', 'mindful-presence', 'inner-peace'];
        break;
      
      case 'data-driven':
        recommendedDuration = 600; // Standard with rich feedback
        idealBreakpoints = [300, 600]; // Data checkpoints
        progressiveRewards = ['metric-milestone', 'improvement-tracked', 'data-insight'];
        break;
      
      case 'socializer':
        recommendedDuration = 420; // 7 minutes - social optimal
        idealBreakpoints = [210, 420]; // Social sharing points
        progressiveRewards = ['community-contribution', 'shared-achievement', 'group-harmony'];
        break;
    }

    // Adjust based on emotional response patterns
    if (emotionalHistory.length > 60) { // 30+ seconds of data
      const avgRelaxation = emotionalHistory.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / emotionalHistory.length;
      
      if (avgRelaxation < 40) {
        recommendedDuration *= 0.7; // Shorter sessions for struggling users
      } else if (avgRelaxation > 80) {
        recommendedDuration *= 1.3; // Longer sessions for successful users
      }
    }

    return {
      recommendedDuration: Math.round(recommendedDuration),
      idealBreakpoints,
      progressiveRewards,
      personalizedElements: {
        colorScheme: this.getPersonalizedColorScheme(personality),
        encouragementStyle: this.getEncouragementStyle(personality),
        feedbackFrequency: this.getFeedbackFrequency(personality)
      }
    };
  }

  private getPersonalizedColorScheme(personality: UserPersonality): string {
    const schemes = {
      achiever: 'energetic-blues', // #3498DB, #2980B9
      explorer: 'discovery-purples', // #9B59B6, #8E44AD  
      mindful: 'calm-greens', // #96CEB4, #5DADE2
      'data-driven': 'tech-grays', // #34495E, #2C3E50
      socializer: 'warm-oranges' // #E67E22, #D35400
    };
    return schemes[personality];
  }

  private getEncouragementStyle(personality: UserPersonality): string {
    const styles = {
      achiever: 'goal-oriented', // "Excellent progress!", "Target achieved!"
      explorer: 'discovery-focused', // "Fascinating!", "New territory!"
      mindful: 'gentle-wisdom', // "Beautiful presence", "Peaceful awareness"
      'data-driven': 'metric-based', // "15% improvement", "Optimal performance"
      socializer: 'community-connected' // "Together in calm", "Shared journey"
    };
    return styles[personality];
  }

  private getFeedbackFrequency(personality: UserPersonality): string {
    const frequencies = {
      achiever: 'frequent', // Every milestone
      explorer: 'varied', // Unexpected moments
      mindful: 'minimal', // Only significant moments
      'data-driven': 'detailed', // Rich information
      socializer: 'social' // Community-focused
    };
    return frequencies[personality];
  }

  /**
   * Reset session state for new session
   */
  startNewSession() {
    this.sessionState = {
      phase: 'pre-session',
      startTime: Date.now(),
      lastDelightMoment: 0,
      milestones: [],
      emotionalJourney: []
    };
  }

  /**
   * Get engagement metrics for current session
   */
  getEngagementMetrics(): EngagementMetrics {
    const emotionalHistory = this.sessionState.emotionalJourney;
    const sessionDuration = Date.now() - this.sessionState.startTime;
    
    // Calculate engagement level
    let engagementLevel: EngagementLevel = 'low';
    if (emotionalHistory.length > 0) {
      const avgRelaxation = emotionalHistory.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / emotionalHistory.length;
      if (avgRelaxation > 75) engagementLevel = 'peak';
      else if (avgRelaxation > 60) engagementLevel = 'high';
      else if (avgRelaxation > 40) engagementLevel = 'moderate';
    }

    return {
      sessionPhase: this.sessionState.phase,
      engagementLevel,
      delightMoments: this.sessionState.milestones.length,
      progressMilestones: this.sessionState.milestones,
      personalityMatch: this.calculatePersonalityMatch(),
      retentionPrediction: this.calculateRetentionPrediction(),
      sessionSatisfaction: this.calculateSessionSatisfaction()
    };
  }

  private calculatePersonalityMatch(): number {
    // Simple heuristic based on milestone achievement rate
    const milestoneRate = this.sessionState.milestones.length / Math.max(1, (Date.now() - this.sessionState.startTime) / 60000);
    return Math.min(100, Math.max(0, milestoneRate * 50));
  }

  private calculateRetentionPrediction(): number {
    const factors = {
      delightMoments: this.sessionState.milestones.length * 15,
      sessionCompletion: this.sessionState.phase === 'post-session' ? 30 : 0,
      emotionalImprovement: this.calculateEmotionalImprovement() * 0.5,
      personalityMatch: this.calculatePersonalityMatch() * 0.3
    };

    return Math.min(100, Object.values(factors).reduce((sum, factor) => sum + factor, 0));
  }

  private calculateSessionSatisfaction(): number {
    const emotionalHistory = this.sessionState.emotionalJourney;
    if (emotionalHistory.length === 0) return 50;

    const improvement = this.calculateEmotionalImprovement();
    const consistency = this.calculateEmotionalConsistency();
    const delightFactor = Math.min(30, this.sessionState.milestones.length * 10);

    return Math.min(100, improvement + consistency + delightFactor);
  }

  private calculateEmotionalImprovement(): number {
    const history = this.sessionState.emotionalJourney;
    if (history.length < 10) return 0;

    const start = history.slice(0, 5).reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / 5;
    const end = history.slice(-5).reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / 5;

    return Math.max(0, end - start);
  }

  private calculateEmotionalConsistency(): number {
    const history = this.sessionState.emotionalJourney;
    if (history.length < 10) return 0;

    const scores = history.map(ctx => ctx.relaxationScore);
    const variance = this.calculateVariance(scores);
    
    // Lower variance = higher consistency
    return Math.max(0, 100 - variance);
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }
}

export default EngagementOrchestrator;