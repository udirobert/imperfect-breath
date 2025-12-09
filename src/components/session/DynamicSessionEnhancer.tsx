/**
 * Dynamic Session Enhancer
 * 
 * Real-time session optimization for maximum user engagement and delight
 * Adapts breathing patterns, visuals, and feedback based on live emotional analysis
 * 
 * Core Principles:
 * - ENHANCEMENT FIRST: Builds on existing session components
 * - PERFORMANT: Lightweight real-time adaptations
 * - CLEAN: Clear separation of enhancement and core session logic
 * - MODULAR: Can enhance any breathing session type
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import EngagementOrchestrator, { UserDelightMoment, EngagementPhase, EngagementLevel } from '../../lib/user-delight/engagement-orchestrator';
import { EmotionalContext } from '../../lib/breathing/emotional-pattern-adapter';

export interface DynamicSessionEnhancerProps {
  sessionId: string;
  currentPhase: BreathingPhase;
  emotionalState: EmotionalContext | null;
  sessionDuration: number; // seconds
  totalDuration: number; // planned session length
  patternId: string;
  onPatternAdaptation?: (adaptation: PatternAdaptation) => void;
  onVisualAdaptation?: (visual: VisualAdaptation) => void;
  onEncouragement?: (message: EncouragementMessage) => void;
  onMilestoneAchieved?: (milestone: SessionMilestone) => void;
  className?: string;
}

export type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'pause';

export interface PatternAdaptation {
  type: 'tempo' | 'ratio' | 'emphasis' | 'complexity';
  adjustment: number; // -100 to +100 percentage
  reason: string;
  duration: number; // how long to apply, in seconds
}

export interface VisualAdaptation {
  colorScheme: string;
  intensity: number; // 0-1
  animation: string;
  emphasis: BreathingPhase | 'balanced';
  particleEffects?: {
    type: 'sparkles' | 'flowing' | 'peaceful' | 'energetic';
    density: number;
    color: string;
  };
}

export interface EncouragementMessage {
  text: string;
  type: 'milestone' | 'progress' | 'technique' | 'emotional';
  priority: 'low' | 'medium' | 'high';
  displayDuration: number; // seconds
  animation?: string;
}

export interface SessionMilestone {
  id: string;
  title: string;
  description: string;
  achievedAt: number; // session time in seconds
  category: 'duration' | 'emotional' | 'technique' | 'breakthrough';
  reward?: {
    visual: string;
    sound?: string;
    unlocks?: string[];
  };
}

interface SessionState {
  phase: EngagementPhase;
  engagementLevel: EngagementLevel;
  adaptationsApplied: PatternAdaptation[];
  milestonesAchieved: SessionMilestone[];
  lastEncouragement: number;
  emotionalTrend: 'improving' | 'stable' | 'declining';
  flowState: boolean;
  strugglingIndicators: number;
}

interface MicroCelebration {
  id: string;
  trigger: string;
  visual: string;
  message: string;
  duration: number;
  cooldown: number;
}

export const DynamicSessionEnhancer: React.FC<DynamicSessionEnhancerProps> = ({
  sessionId,
  currentPhase,
  emotionalState,
  sessionDuration,
  totalDuration,
  patternId,
  onPatternAdaptation,
  onVisualAdaptation,
  onEncouragement,
  onMilestoneAchieved,
  className = ''
}) => {
  // State management
  const [sessionState, setSessionState] = useState<SessionState>({
    phase: 'warming-up',
    engagementLevel: 'moderate',
    adaptationsApplied: [],
    milestonesAchieved: [],
    lastEncouragement: 0,
    emotionalTrend: 'stable',
    flowState: false,
    strugglingIndicators: 0
  });

  const [activeCelebrations, setActiveCelebrations] = useState<MicroCelebration[]>([]);
  const [currentVisualAdaptation, setCurrentVisualAdaptation] = useState<VisualAdaptation | null>(null);
  const [adaptiveEncouragement, setAdaptiveEncouragement] = useState<EncouragementMessage | null>(null);

  // Refs for performance
  const engagementOrchestrator = useRef(EngagementOrchestrator.getInstance());
  const emotionalHistory = useRef<EmotionalContext[]>([]);
  const lastAdaptationTime = useRef(0);
  const phaseStartTime = useRef(Date.now());

  // Micro-celebrations configuration
  const microCelebrations = useMemo<MicroCelebration[]>(() => [
    {
      id: 'first-smile',
      trigger: 'duchenne-detected',
      visual: 'sparkle-burst',
      message: '✨ Beautiful smile!',
      duration: 2000,
      cooldown: 60000
    },
    {
      id: 'tension-release',
      trigger: 'stress-reduction',
      visual: 'wave-animation',
      message: '🌊 Tension melting away',
      duration: 2500,
      cooldown: 90000
    },
    {
      id: 'rhythm-found',
      trigger: 'steady-breathing',
      visual: 'pulse-sync',
      message: '🎯 Perfect rhythm!',
      duration: 1500,
      cooldown: 120000
    },
    {
      id: 'deep-state',
      trigger: 'high-relaxation',
      visual: 'zen-glow',
      message: '🧘 Deep state achieved',
      duration: 3000,
      cooldown: 180000
    },
    {
      id: 'breakthrough-moment',
      trigger: 'emotional-breakthrough',
      visual: 'light-burst',
      message: '💫 Breakthrough moment!',
      duration: 4000,
      cooldown: 300000
    }
  ], []);

  // Process emotional state changes
  useEffect(() => {
    if (emotionalState) {
      emotionalHistory.current.push(emotionalState);
      
      // Keep recent history (last 2 minutes at 2fps)
      if (emotionalHistory.current.length > 240) {
        emotionalHistory.current.shift();
      }

      analyzeEmotionalTrend();
      checkForMicroCelebrations();
      updateEngagementPhase();
      considerPatternAdaptations();
      updateVisualAdaptations();
    }
  }, [emotionalState]);

  // Update session phase based on duration and emotional state
  const updateEngagementPhase = useCallback(() => {
    const progressPercent = (sessionDuration / totalDuration) * 100;
    let newPhase: EngagementPhase;

    if (progressPercent < 10) newPhase = 'warming-up';
    else if (progressPercent < 25) newPhase = 'active';
    else if (progressPercent < 75) {
      // Check for peak state
      if (emotionalState && emotionalState.relaxationScore > 85) {
        newPhase = 'peak-state';
      } else {
        newPhase = 'active';
      }
    } else if (progressPercent < 90) newPhase = 'winding-down';
    else newPhase = 'post-session';

    if (newPhase !== sessionState.phase) {
      setSessionState(prev => ({ ...prev, phase: newPhase }));
      phaseStartTime.current = Date.now();
      
      // Trigger phase-specific delight moments
      const delightMoments = engagementOrchestrator.current.updateSessionPhase(newPhase, {
        emotionalState,
        sessionData: { duration: sessionDuration, pattern: patternId }
      });

      // Convert delight moments to encouragement messages
      delightMoments.forEach(moment => triggerDelightMoment(moment));
    }
  }, [sessionDuration, totalDuration, emotionalState, sessionState.phase, patternId]);

  // Analyze emotional trend over recent history
  const analyzeEmotionalTrend = useCallback(() => {
    const recent = emotionalHistory.current.slice(-10); // Last 5 seconds
    const earlier = emotionalHistory.current.slice(-20, -10); // Previous 5 seconds

    if (recent.length < 5 || earlier.length < 5) return;

    const recentAvg = recent.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / earlier.length;

    let trend: 'improving' | 'stable' | 'declining';
    if (recentAvg > earlierAvg + 10) trend = 'improving';
    else if (recentAvg < earlierAvg - 10) trend = 'declining';
    else trend = 'stable';

    // Detect flow state
    const isFlowState = recent.every(ctx => ctx.relaxationScore > 70) && 
                       recent.some(ctx => ctx.isDuchenneActive);

    // Count struggling indicators
    let strugglingCount = 0;
    if (recentAvg < 40) strugglingCount++;
    if (recent.some(ctx => ctx.dominantEmotion === 'tension')) strugglingCount++;
    if (trend === 'declining') strugglingCount++;

    setSessionState(prev => ({
      ...prev,
      emotionalTrend: trend,
      flowState: isFlowState,
      strugglingIndicators: strugglingCount
    }));
  }, []);

  // Check for micro-celebration triggers
  const checkForMicroCelebrations = useCallback(() => {
    if (!emotionalState) return;

    const now = Date.now();
    
    microCelebrations.forEach(celebration => {
      // Check cooldown
      const lastTrigger = activeCelebrations.find(c => c.id === celebration.id);
      if (lastTrigger && now - lastTrigger.cooldown < celebration.cooldown) return;

      let shouldTrigger = false;

      switch (celebration.trigger) {
        case 'duchenne-detected':
          shouldTrigger = emotionalState.isDuchenneActive &&
                         !emotionalHistory.current.slice(-5).some(ctx => ctx.isDuchenneActive);
          break;
        
        case 'stress-reduction':
          const wasStressed = emotionalHistory.current.slice(-10, -5)
            .some(ctx => ctx.dominantEmotion === 'tension');
          const nowCalm = emotionalState.dominantEmotion === 'calm';
          shouldTrigger = wasStressed && nowCalm;
          break;
        
        case 'steady-breathing':
          const recentScores = emotionalHistory.current.slice(-30)
            .map(ctx => ctx.relaxationScore);
          shouldTrigger = recentScores.length >= 30 &&
                         recentScores.every(score => score > 60) &&
                         Math.abs(Math.max(...recentScores) - Math.min(...recentScores)) < 20;
          break;
        
        case 'high-relaxation':
          shouldTrigger = emotionalState.relaxationScore > 85 &&
                         !sessionState.milestonesAchieved.some(m => m.category === 'emotional');
          break;
        
        case 'emotional-breakthrough':
          const improvement = calculateEmotionalImprovement();
          shouldTrigger = improvement > 40 && sessionDuration > 180; // 3 minutes minimum
          break;
      }

      if (shouldTrigger) {
        triggerMicroCelebration(celebration);
      }
    });
  }, [emotionalState, emotionalHistory, activeCelebrations, sessionState.milestonesAchieved, sessionDuration, microCelebrations]);

  // Trigger micro-celebration
  const triggerMicroCelebration = useCallback((celebration: MicroCelebration) => {
    setActiveCelebrations(prev => [
      ...prev.filter(c => c.id !== celebration.id), // Remove existing
      { ...celebration, cooldown: Date.now() }
    ]);

    // Create encouragement message
    const encouragement: EncouragementMessage = {
      text: celebration.message,
      type: 'emotional',
      priority: 'medium',
      displayDuration: celebration.duration / 1000,
      animation: celebration.visual
    };

    onEncouragement?.(encouragement);

    // Remove after duration
    setTimeout(() => {
      setActiveCelebrations(prev => prev.filter(c => c.id !== celebration.id));
    }, celebration.duration);
  }, [onEncouragement]);

  // Trigger delight moment from engagement orchestrator
  const triggerDelightMoment = useCallback((moment: UserDelightMoment) => {
    const encouragement: EncouragementMessage = {
      text: moment.message,
      type: moment.type === 'achievement' ? 'milestone' : 'progress',
      priority: 'high',
      displayDuration: 4,
      animation: moment.visual?.animation || 'gentle-glow'
    };

    onEncouragement?.(encouragement);

    // Create milestone if it's an achievement
    if (moment.type === 'achievement') {
      const milestone: SessionMilestone = {
        id: moment.id,
        title: moment.message.split('!')[0] + '!', // Extract title
        description: moment.message,
        achievedAt: sessionDuration,
        category: 'emotional',
        reward: {
          visual: moment.visual?.animation || 'celebration',
          sound: moment.visual?.sound
        }
      };

      setSessionState(prev => ({
        ...prev,
        milestonesAchieved: [...prev.milestonesAchieved, milestone]
      }));

      onMilestoneAchieved?.(milestone);
    }
  }, [sessionDuration, onEncouragement, onMilestoneAchieved]);

  // Consider pattern adaptations based on current state
  const considerPatternAdaptations = useCallback(() => {
    if (!emotionalState) return;

    const now = Date.now();
    if (now - lastAdaptationTime.current < 30000) return; // 30 second cooldown

    let adaptation: PatternAdaptation | null = null;

    // Struggling user adaptations
    if (sessionState.strugglingIndicators >= 2) {
      adaptation = {
        type: 'tempo',
        adjustment: -20, // 20% slower
        reason: 'Slowing pace to help you settle in',
        duration: 60
      };
    }
    // High performance adaptations
    else if (sessionState.flowState && emotionalState.relaxationScore > 80) {
      adaptation = {
        type: 'complexity',
        adjustment: 10, // Slightly more complex
        reason: 'Adding subtle complexity to deepen your practice',
        duration: 90
      };
    }
    // Tension-specific adaptations
    else if (emotionalState.dominantEmotion === 'tension') {
      adaptation = {
        type: 'emphasis',
        adjustment: 30, // More emphasis on exhale
        reason: 'Emphasizing exhales to release tension',
        duration: 120
      };
    }
    // Energy boost adaptations
    else if (sessionState.emotionalTrend === 'declining' && sessionDuration > 300) {
      adaptation = {
        type: 'tempo',
        adjustment: 15, // Slightly faster
        reason: 'Gentle energy boost to re-engage',
        duration: 45
      };
    }

    if (adaptation) {
      setSessionState(prev => ({
        ...prev,
        adaptationsApplied: [...prev.adaptationsApplied, adaptation!]
      }));

      onPatternAdaptation?.(adaptation);
      lastAdaptationTime.current = now;

      // Show adaptation message
      const message: EncouragementMessage = {
        text: adaptation.reason,
        type: 'technique',
        priority: 'low',
        displayDuration: 3,
        animation: 'gentle-fade'
      };

      setTimeout(() => onEncouragement?.(message), 1000); // Delayed to not conflict with celebrations
    }
  }, [emotionalState, sessionState, sessionDuration, onPatternAdaptation, onEncouragement]);

  // Update visual adaptations
  const updateVisualAdaptations = useCallback(() => {
    if (!emotionalState) return;

    const { dominantEmotion, relaxationScore, isDuchenneActive } = emotionalState;
    
    let visual: VisualAdaptation;

    // High-performance flow state
    if (sessionState.flowState) {
      visual = {
        colorScheme: 'flow-gradient',
        intensity: 0.9,
        animation: 'flowing-energy',
        emphasis: 'balanced',
        particleEffects: {
          type: 'flowing',
          density: 0.7,
          color: '#4ECDC4'
        }
      };
    }
    // Tension release mode
    else if (dominantEmotion === 'tension') {
      visual = {
        colorScheme: 'calming-blues',
        intensity: 0.6,
        animation: 'gentle-waves',
        emphasis: 'exhale',
        particleEffects: {
          type: 'peaceful',
          density: 0.4,
          color: '#87CEEB'
        }
      };
    }
    // Joy and happiness
    else if (isDuchenneActive || dominantEmotion === 'joy') {
      visual = {
        colorScheme: 'warm-golds',
        intensity: 0.8,
        animation: 'joyful-sparkles',
        emphasis: 'inhale',
        particleEffects: {
          type: 'sparkles',
          density: 0.6,
          color: '#FFD700'
        }
      };
    }
    // Deep meditation state
    else if (relaxationScore > 75) {
      visual = {
        colorScheme: 'deep-purples',
        intensity: 0.5,
        animation: 'meditative-glow',
        emphasis: 'balanced',
        particleEffects: {
          type: 'peaceful',
          density: 0.3,
          color: '#9B59B6'
        }
      };
    }
    // Default progressive state
    else {
      visual = {
        colorScheme: 'progressive-greens',
        intensity: Math.min(0.8, relaxationScore / 100 + 0.3),
        animation: 'steady-breath',
        emphasis: 'balanced'
      };
    }

    // Only update if significantly different
    if (!currentVisualAdaptation || 
        currentVisualAdaptation.colorScheme !== visual.colorScheme ||
        Math.abs(currentVisualAdaptation.intensity - visual.intensity) > 0.2) {
      
      setCurrentVisualAdaptation(visual);
      onVisualAdaptation?.(visual);
    }
  }, [emotionalState, sessionState.flowState, currentVisualAdaptation, onVisualAdaptation]);

  // Calculate emotional improvement
  const calculateEmotionalImprovement = useCallback((): number => {
    if (emotionalHistory.current.length < 20) return 0;

    const start = emotionalHistory.current.slice(0, 10)
      .reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / 10;
    const recent = emotionalHistory.current.slice(-10)
      .reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / 10;

    return recent - start;
  }, []);

  // Render real-time session enhancements overlay
  const renderEnhancementOverlay = () => {
    return (
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Micro-celebrations */}
        {activeCelebrations.map(celebration => (
          <div
            key={celebration.id}
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
              ${getCelebrationAnimation(celebration.visual)}`}
          >
            <div className="text-2xl font-bold text-white bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2">
              {celebration.message}
            </div>
          </div>
        ))}

        {/* Adaptive encouragement */}
        {adaptiveEncouragement && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
            <Card className="p-3 bg-white/90 backdrop-blur-sm border-none shadow-lg">
              <p className="text-sm font-medium text-center">{adaptiveEncouragement.text}</p>
            </Card>
          </div>
        )}

        {/* Flow state indicator */}
        {sessionState.flowState && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
              ✨ Flow State Active
            </div>
          </div>
        )}

        {/* Session phase indicator */}
        <div className="absolute top-4 right-4">
          <div className="text-xs text-white/70 bg-black/20 backdrop-blur-sm rounded px-2 py-1">
            {sessionState.phase.replace('-', ' ').toUpperCase()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {renderEnhancementOverlay()}
    </div>
  );
};

// Helper functions
function getCelebrationAnimation(visual: string): string {
  const animations = {
    'sparkle-burst': 'animate-bounce',
    'wave-animation': 'animate-pulse',
    'pulse-sync': 'animate-ping',
    'zen-glow': 'animate-pulse',
    'light-burst': 'animate-bounce'
  };
  return animations[visual as keyof typeof animations] || 'animate-pulse';
}

export default DynamicSessionEnhancer;