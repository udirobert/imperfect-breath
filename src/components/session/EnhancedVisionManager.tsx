/**
 * Enhanced Vision Manager
 * 
 * Integrates emotional analysis with existing VisionManager
 * Maintains backward compatibility while adding emotional insights
 * 
 * Core Principles:
 * - ENHANCEMENT FIRST: Builds on existing VisionManager
 * - AGGRESSIVE CONSOLIDATION: Single component for all vision needs
 * - MODULAR: Emotional features can be toggled independently
 * - PERFORMANT: Client-side processing reduces server dependency
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { VisionManager, VisionManagerProps } from './VisionManager';
import { EnhancedEmotionalOverlay } from '../vision/EnhancedEmotionalOverlay';
import { EmotionalPatternAdapter, EmotionalContext, PatternRecommendation } from '../../lib/breathing/emotional-pattern-adapter';
import { useVisionStore, visionSelectors } from '../../stores/visionStore';

export interface EnhancedVisionManagerProps extends VisionManagerProps {
  // New emotional analysis props
  emotionalAnalysisEnabled?: boolean;
  showDetailedEmotrics?: boolean;
  onPatternRecommendation?: (recommendation: PatternRecommendation) => void;
  onEmotionalInsight?: (insight: string, type: 'positive' | 'neutral' | 'suggestion') => void;
  
  // Session context for better recommendations
  currentPatternId?: string;
  sessionDuration?: number; // in seconds
  isFirstSession?: boolean;
}

interface EmotionalSessionData {
  history: EmotionalContext[];
  currentRecommendation: PatternRecommendation | null;
  lastRecommendationTime: number;
  insights: Array<{
    message: string;
    type: 'positive' | 'neutral' | 'suggestion';
    timestamp: number;
  }>;
}

export const EnhancedVisionManager: React.FC<EnhancedVisionManagerProps> = ({
  emotionalAnalysisEnabled = true,
  showDetailedEmotrics = false,
  onPatternRecommendation,
  onEmotionalInsight,
  currentPatternId,
  sessionDuration = 0,
  isFirstSession = false,
  ...visionManagerProps
}) => {
  // State for emotional analysis
  const [emotionalSessionData, setEmotionalSessionData] = useState<EmotionalSessionData>({
    history: [],
    currentRecommendation: null,
    lastRecommendationTime: 0,
    insights: []
  });
  
  const [userPreferences, setUserPreferences] = useState({
    detailedMetrics: showDetailedEmotrics,
    autoRecommendations: true,
    insightFrequency: 'normal' as 'minimal' | 'normal' | 'detailed'
  });

  // Get vision data
  const visionStore = useVisionStore();
  const visionMetrics = visionSelectors.hasMetrics() ? visionStore.metrics : null;
  const landmarks = useMemo(
    () => visionMetrics?.faceLandmarks || [],
    [visionMetrics?.faceLandmarks]
  );

  // Initialize emotional pattern adapter
  const emotionalAdapter = useMemo(() => EmotionalPatternAdapter.getInstance(), []);

  // Handle emotional state changes
  const handleEmotionalStateChange = useCallback((emotionalState: any) => {
    if (!emotionalAnalysisEnabled) return;

    const now = Date.now();
    const emotionalContext: EmotionalContext = {
      ...emotionalState.current,
      sessionProgress: Math.min(100, (sessionDuration / 600) * 100), // Assume 10min max session
    };

    setEmotionalSessionData(prev => {
      const newHistory = [...prev.history, emotionalContext];
      
      // Keep last 2 minutes of data (assuming 2fps analysis)
      const maxHistoryLength = 240; // 2 minutes * 2fps
      if (newHistory.length > maxHistoryLength) {
        newHistory.splice(0, newHistory.length - maxHistoryLength);
      }

      // Generate insights based on emotional progression
      const newInsights = [...prev.insights];
      const insight = generateEmotionalInsight(emotionalContext, newHistory, prev.insights);
      if (insight && userPreferences.insightFrequency !== 'minimal') {
        newInsights.push({
          ...insight,
          timestamp: now
        });
        onEmotionalInsight?.(insight.message, insight.type);
      }

      // Clean old insights (keep last 5 minutes worth)
      const validInsights = newInsights.filter(i => now - i.timestamp < 300000);

      return {
        ...prev,
        history: newHistory,
        insights: validInsights
      };
    });

    // Handle pattern recommendations
    if (userPreferences.autoRecommendations && 
        now - emotionalSessionData.lastRecommendationTime > 30000) { // 30 second cooldown
      
      const recommendation = emotionalAdapter.getRecommendation(
        emotionalContext,
        currentPatternId
      );

      if (recommendation) {
        setEmotionalSessionData(prev => ({
          ...prev,
          currentRecommendation: recommendation,
          lastRecommendationTime: now
        }));
        onPatternRecommendation?.(recommendation);
      }
    }
  }, [
    emotionalAnalysisEnabled,
    emotionalAdapter,
    currentPatternId,
    sessionDuration,
    onPatternRecommendation,
    onEmotionalInsight,
    userPreferences,
    emotionalSessionData.lastRecommendationTime
  ]);

  // Generate contextual insights
  const generateEmotionalInsight = (
    current: EmotionalContext,
    history: EmotionalContext[],
    existingInsights: any[]
  ) => {
    // Don't generate insights too frequently
    const recentInsights = existingInsights.filter(i => Date.now() - i.timestamp < 120000); // 2 minutes
    if (recentInsights.length >= 3) return null;

    // Positive reinforcement for improvements
    if (history.length >= 10) {
      const recent = history.slice(-5);
      const earlier = history.slice(-10, -5);
      
      const recentAvg = recent.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / recent.length;
      const earlierAvg = earlier.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / earlier.length;
      
      if (recentAvg > earlierAvg + 15) {
        return {
          message: "Excellent progress! Your relaxation is deepening beautifully.",
          type: 'positive' as const
        };
      }
    }

    // Duchenne detection celebration
    if (current.isDuchenneActive && !existingInsights.some(i => i.message.includes('genuine'))) {
      return {
        message: "Wonderful! Genuine happiness detected - this is the power of mindful breathing.",
        type: 'positive' as const
      };
    }

    // Gentle guidance for beginners
    if (isFirstSession && current.relaxationScore > 60 && sessionDuration > 120) {
      return {
        message: "You're doing great for your first session! Keep focusing on your natural rhythm.",
        type: 'positive' as const
      };
    }

    // Helpful suggestions for tension
    if (current.dominantEmotion === 'tension' && current.confidence > 75) {
      const tensionInsights = existingInsights.filter(i => i.message.includes('tension'));
      if (tensionInsights.length === 0) {
        return {
          message: "Try softening your facial muscles, especially around your forehead and jaw.",
          type: 'suggestion' as const
        };
      }
    }

    return null;
  };

  // Toggle detailed metrics
  const toggleDetailedMetrics = useCallback(() => {
    setUserPreferences(prev => ({
      ...prev,
      detailedMetrics: !prev.detailedMetrics
    }));
  }, []);

  // Get session insights for post-session analysis
  const getSessionInsights = useCallback(() => {
    return emotionalAdapter.getSessionInsights(emotionalSessionData.history);
  }, [emotionalAdapter, emotionalSessionData.history]);

  // Expose session insights to parent components
  useEffect(() => {
    // Add session insights to window for debugging/testing
    if (import.meta.env.DEV) {
      (window as any).getEmotionalSessionInsights = getSessionInsights;
    }
  }, [getSessionInsights]);

  // Enhanced render with emotional overlay
  const renderEnhancedVision = () => {
    if (!emotionalAnalysisEnabled) {
      // Fallback to standard VisionManager
      return (
        <VisionManager
          {...visionManagerProps}
        />
      );
    }

    return (
      <div className="relative">
        {/* Standard vision manager (hidden overlay) */}
        <div style={{ visibility: 'hidden', position: 'absolute' }}>
          <VisionManager
            {...visionManagerProps}
          />
        </div>

        {/* Enhanced emotional overlay */}
        <EnhancedEmotionalOverlay
          videoElement={visionManagerProps.videoRef.current}
          landmarks={landmarks}
          isActive={visionStore.isActive}
          confidence={visionMetrics?.confidence || 0}
          postureScore={visionMetrics?.posture || 0}
          movementLevel={visionMetrics?.restlessnessScore ? visionMetrics.restlessnessScore / 100 : 0}
          emotionalAnalysisEnabled={emotionalAnalysisEnabled}
          showDetailedMetrics={userPreferences.detailedMetrics}
          onEmotionalStateChange={handleEmotionalStateChange}
          onPatternRecommendation={onPatternRecommendation}
        />

        {/* Settings toggle for detailed metrics */}
        {emotionalAnalysisEnabled && (
          <button
            onClick={toggleDetailedMetrics}
            className="absolute bottom-4 right-4 z-20 bg-black/20 backdrop-blur-sm rounded-full p-2 text-white/60 hover:text-white/80 transition-colors"
            title="Toggle detailed emotional metrics"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </button>
        )}
      </div>
    );
  };

  return renderEnhancedVision();
};

// Export session insights type for external use
export type { EmotionalSessionData };

// Export function to get session insights from component instance
export const getEmotionalSessionInsights = (history: EmotionalContext[]) => {
  return EmotionalPatternAdapter.getInstance().getSessionInsights(history);
};