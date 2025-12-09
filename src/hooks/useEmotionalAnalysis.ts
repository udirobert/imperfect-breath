/**
 * useEmotionalAnalysis Hook
 * 
 * Simple hook to add emotional analysis to existing session components
 * Maintains backward compatibility while providing emotional insights
 * 
 * Core Principles:
 * - ENHANCEMENT FIRST: Easily integrates with existing hooks
 * - DRY: Single source of truth for emotional analysis logic
 * - PERFORMANT: Optimized state management and memoization
 * - CLEAN: Clear separation of concerns
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { EmotionalPatternAdapter, EmotionalContext, PatternRecommendation } from '../lib/breathing/emotional-pattern-adapter';

export interface EmotionalAnalysisConfig {
  enabled: boolean;
  autoRecommendations: boolean;
  insightLevel: 'minimal' | 'moderate' | 'detailed';
  confidenceThreshold: number; // 0-100, minimum confidence for recommendations
}

export interface EmotionalAnalysisState {
  current: EmotionalContext | null;
  history: EmotionalContext[];
  insights: Array<{
    message: string;
    type: 'positive' | 'neutral' | 'suggestion';
    timestamp: number;
  }>;
  recommendations: PatternRecommendation[];
  sessionSummary: {
    averageRelaxation: number;
    dominantEmotion: string;
    improvements: string[];
    achievements: string[];
  } | null;
}

export interface UseEmotionalAnalysisReturn {
  // State
  state: EmotionalAnalysisState;
  config: EmotionalAnalysisConfig;
  
  // Actions
  updateConfig: (updates: Partial<EmotionalAnalysisConfig>) => void;
  processEmotionalState: (emotionalContext: EmotionalContext) => void;
  getPatternRecommendation: (currentPatternId?: string) => PatternRecommendation | null;
  dismissRecommendation: (recommendationId: string) => void;
  clearHistory: () => void;
  
  // Computed values
  isRelaxationImproving: boolean;
  currentRelaxationLevel: 'low' | 'moderate' | 'high';
  sessionProgress: number; // 0-100
  
  // Session insights
  getSessionInsights: () => any;
  exportSessionData: () => any;
}

const DEFAULT_CONFIG: EmotionalAnalysisConfig = {
  enabled: true,
  autoRecommendations: false,
  insightLevel: 'moderate',
  confidenceThreshold: 70
};

const INITIAL_STATE: EmotionalAnalysisState = {
  current: null,
  history: [],
  insights: [],
  recommendations: [],
  sessionSummary: null
};

export const useEmotionalAnalysis = (
  initialConfig: Partial<EmotionalAnalysisConfig> = {}
): UseEmotionalAnalysisReturn => {
  // Configuration
  const [config, setConfig] = useState<EmotionalAnalysisConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig
  });

  // State
  const [state, setState] = useState<EmotionalAnalysisState>(INITIAL_STATE);
  
  // Refs for performance
  const emotionalAdapter = useRef(EmotionalPatternAdapter.getInstance());
  const lastRecommendationTime = useRef(0);
  const lastInsightTime = useRef(0);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<EmotionalAnalysisConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Process new emotional state
  const processEmotionalState = useCallback((emotionalContext: EmotionalContext) => {
    if (!config.enabled) return;

    const now = Date.now();
    
    setState(prev => {
      const newHistory = [...prev.history, emotionalContext];
      
      // Keep reasonable history size (last 5 minutes at 2fps = 600 entries)
      if (newHistory.length > 600) {
        newHistory.splice(0, newHistory.length - 600);
      }

      // Generate insights
      const newInsights = [...prev.insights];
      if (config.insightLevel !== 'minimal' && now - lastInsightTime.current > 30000) { // 30 second cooldown
        const insight = generateInsight(emotionalContext, newHistory, config.insightLevel);
        if (insight) {
          newInsights.push({
            ...insight,
            timestamp: now
          });
          lastInsightTime.current = now;
        }
      }

      // Clean old insights (keep last 10 minutes)
      const validInsights = newInsights.filter(i => now - i.timestamp < 600000);

      return {
        ...prev,
        current: emotionalContext,
        history: newHistory,
        insights: validInsights
      };
    });
  }, [config.enabled, config.insightLevel]);

  // Get pattern recommendation
  const getPatternRecommendation = useCallback((currentPatternId?: string): PatternRecommendation | null => {
    if (!config.enabled || !config.autoRecommendations || !state.current) {
      return null;
    }

    const now = Date.now();
    
    // Respect cooldown period
    if (now - lastRecommendationTime.current < 60000) { // 1 minute cooldown
      return null;
    }

    const recommendation = emotionalAdapter.current.getRecommendation(
      state.current,
      currentPatternId
    );

    if (recommendation && recommendation.confidence >= config.confidenceThreshold) {
      lastRecommendationTime.current = now;
      
      setState(prev => ({
        ...prev,
        recommendations: [...prev.recommendations, recommendation]
      }));
      
      return recommendation;
    }

    return null;
  }, [config.enabled, config.autoRecommendations, config.confidenceThreshold, state.current]);

  // Dismiss recommendation
  const dismissRecommendation = useCallback((recommendationId: string) => {
    setState(prev => ({
      ...prev,
      recommendations: prev.recommendations.filter(r => r.patternId !== recommendationId)
    }));
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setState(INITIAL_STATE);
    lastRecommendationTime.current = 0;
    lastInsightTime.current = 0;
  }, []);

  // Computed values
  const isRelaxationImproving = useMemo(() => {
    if (state.history.length < 10) return false;
    
    const recent = state.history.slice(-5);
    const earlier = state.history.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / earlier.length;
    
    return recentAvg > earlierAvg + 10; // 10 point improvement
  }, [state.history]);

  const currentRelaxationLevel = useMemo(() => {
    if (!state.current) return 'low';
    
    const score = state.current.relaxationScore;
    if (score >= 75) return 'high';
    if (score >= 50) return 'moderate';
    return 'low';
  }, [state.current]);

  const sessionProgress = useMemo(() => {
    // Assume 10 minute target session, 2fps analysis = 1200 max entries
    return Math.min(100, (state.history.length / 1200) * 100);
  }, [state.history.length]);

  // Get comprehensive session insights
  const getSessionInsights = useCallback(() => {
    return emotionalAdapter.current.getSessionInsights(state.history);
  }, [state.history]);

  // Export session data
  const exportSessionData = useCallback(() => {
    return {
      configuration: config,
      emotionalHistory: state.history,
      insights: state.insights,
      recommendations: state.recommendations,
      sessionInsights: getSessionInsights(),
      metadata: {
        totalDataPoints: state.history.length,
        sessionDuration: state.history.length > 0 ? 
          state.history.length * 0.5 : 0, // Assuming 2fps = 0.5s per entry
        exportedAt: new Date().toISOString()
      }
    };
  }, [config, state, getSessionInsights]);

  // Update session summary when session data changes
  useEffect(() => {
    if (state.history.length > 10) { // Only generate summary with sufficient data
      const insights = getSessionInsights();
      setState(prev => ({
        ...prev,
        sessionSummary: {
          averageRelaxation: insights.averageRelaxation,
          dominantEmotion: getMostFrequentEmotion(state.history),
          improvements: insights.improvements,
          achievements: generateAchievements(state.history)
        }
      }));
    }
  }, [state.history, getSessionInsights]);

  return {
    state,
    config,
    updateConfig,
    processEmotionalState,
    getPatternRecommendation,
    dismissRecommendation,
    clearHistory,
    isRelaxationImproving,
    currentRelaxationLevel,
    sessionProgress,
    getSessionInsights,
    exportSessionData
  };
};

// Helper functions
function generateInsight(
  current: EmotionalContext,
  history: EmotionalContext[],
  insightLevel: 'minimal' | 'moderate' | 'detailed'
): { message: string; type: 'positive' | 'neutral' | 'suggestion' } | null {
  // Positive reinforcement for improvements
  if (history.length >= 10) {
    const recent = history.slice(-5);
    const earlier = history.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / earlier.length;
    
    if (recentAvg > earlierAvg + 15) {
      return {
        message: "Excellent! Your relaxation is deepening naturally.",
        type: 'positive'
      };
    }
  }

  // Duchenne marker celebration
  if (current.isDuchenneActive) {
    return {
      message: "Beautiful genuine smile detected! This is the joy of mindful breathing.",
      type: 'positive'
    };
  }

  // Helpful suggestions (only for moderate/detailed levels)
  if (insightLevel !== 'minimal' && current.dominantEmotion === 'tension' && current.confidence > 75) {
    return {
      message: "Try gently releasing tension in your face and shoulders as you exhale.",
      type: 'suggestion'
    };
  }

  // High relaxation achievement
  if (current.relaxationScore > 85 && insightLevel === 'detailed') {
    return {
      message: "Outstanding relaxation state achieved! You're in deep meditation.",
      type: 'positive'
    };
  }

  return null;
}

function getMostFrequentEmotion(history: EmotionalContext[]): string {
  const emotionCounts: Record<string, number> = {};
  history.forEach(ctx => {
    emotionCounts[ctx.dominantEmotion] = (emotionCounts[ctx.dominantEmotion] || 0) + 1;
  });
  
  return Object.entries(emotionCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';
}

function generateAchievements(history: EmotionalContext[]): string[] {
  const achievements: string[] = [];
  
  const maxRelaxation = Math.max(...history.map(ctx => ctx.relaxationScore));
  const duchenneCount = history.filter(ctx => ctx.isDuchenneActive).length;
  const avgRelaxation = history.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / history.length;
  
  if (maxRelaxation > 90) achievements.push('Peak Relaxation Master');
  if (duchenneCount > 5) achievements.push('Joy Ambassador');
  if (avgRelaxation > 75) achievements.push('Consistent Calm');
  if (history.length > 600) achievements.push('Dedicated Practitioner'); // 5+ minutes
  
  return achievements;
}

// Export types for external use
export type { EmotionalAnalysisConfig, EmotionalAnalysisState };