/**
 * Comprehensive Session Orchestrator
 * 
 * Complete user delight optimization across the entire session lifecycle
 * Integrates pre-session preparation, dynamic enhancements, and post-session celebration
 * 
 * Core Principles:
 * - ENHANCEMENT FIRST: Orchestrates all existing session components
 * - AGGRESSIVE CONSOLIDATION: Single point of control for session experience
 * - PERFORMANT: Optimized state management and component lifecycle
 * - CLEAN: Clear separation of orchestration, session logic, and enhancements
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';

// Import our enhancement components
import PreSessionPreparation, { SessionConfig } from './PreSessionPreparation';
import { EnhancedVisionManager } from './EnhancedVisionManager';
import DynamicSessionEnhancer, { PatternAdaptation, VisualAdaptation, EncouragementMessage, SessionMilestone } from './DynamicSessionEnhancer';
import { EmotionalSessionInsights } from './EmotionalSessionInsights';

// Import engagement system
import EngagementOrchestrator, { UserPersonality, UserDelightMoment } from '../../lib/user-delight/engagement-orchestrator';
import { EmotionalContext, PatternRecommendation } from '../../lib/breathing/emotional-pattern-adapter';
import { useEmotionalAnalysis } from '../../hooks/useEmotionalAnalysis';

export interface ComprehensiveSessionOrchestratorProps {
  initialConfig?: {
    pattern?: string;
    duration?: number;
    goals?: string[];
  };
  userHistory?: any[];
  onSessionComplete?: (data: SessionCompletionData) => void;
  onUserEngagementUpdate?: (metrics: EngagementMetrics) => void;
  className?: string;
}

export interface SessionCompletionData {
  sessionId: string;
  duration: number;
  pattern: string;
  emotionalJourney: EmotionalContext[];
  achievements: Achievement[];
  milestones: SessionMilestone[];
  adaptationsApplied: PatternAdaptation[];
  engagementMetrics: EngagementMetrics;
  insights: any;
  userSatisfaction: number;
  retentionPrediction: number;
}

export interface EngagementMetrics {
  preparationScore: number;
  sessionEngagement: number;
  delightMomentsTriggered: number;
  personalityMatchScore: number;
  adaptationEffectiveness: number;
  momentumScore: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'milestone' | 'improvement' | 'consistency' | 'breakthrough';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isNew: boolean;
  unlockedAt: number;
}

type SessionPhase = 'preparation' | 'active-session' | 'completion' | 'insights';

export const ComprehensiveSessionOrchestrator: React.FC<ComprehensiveSessionOrchestratorProps> = ({
  initialConfig = {},
  userHistory = [],
  onSessionComplete,
  onUserEngagementUpdate,
  className = ''
}) => {
  // Core session state
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('preparation');
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Enhancement state
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [milestones, setMilestones] = useState<SessionMilestone[]>([]);
  const [adaptationsApplied, setAdaptationsApplied] = useState<PatternAdaptation[]>([]);
  const [delightMomentsTriggered, setDelightMomentsTriggered] = useState<UserDelightMoment[]>([]);
  const [currentEncouragement, setCurrentEncouragement] = useState<EncouragementMessage | null>(null);

  // Camera and vision state
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Engagement tracking
  const engagementOrchestrator = useRef(EngagementOrchestrator.getInstance());
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics>({
    preparationScore: 0,
    sessionEngagement: 0,
    delightMomentsTriggered: 0,
    personalityMatchScore: 0,
    adaptationEffectiveness: 0,
    momentumScore: 0
  });

  // Emotional analysis
  const emotionalAnalysis = useEmotionalAnalysis({
    enabled: true,
    autoRecommendations: true,
    insightLevel: 'moderate'
  });

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive && sessionStartTime) {
      interval = setInterval(() => {
        const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
        setSessionDuration(duration);
        
        // Check for duration-based milestones
        checkDurationMilestones(duration);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, sessionStartTime]);

  // Initialize camera when session starts
  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 30 }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraError(null);
    } catch (error) {
      console.error('Camera initialization failed:', error);
      setCameraError('Camera access denied. Session will continue with limited features.');
    }
  }, []);

  // Handle preparation completion and session start
  const handleSessionStart = useCallback(async (config: SessionConfig) => {
    setSessionConfig(config);
    await initializeCamera();
    
    // Initialize engagement orchestrator with user profile
    if (userHistory.length > 0) {
      const personality = engagementOrchestrator.current.detectPersonality(userHistory, {});
      engagementOrchestrator.current.setUserProfile({
        personality,
        sessionHistory: userHistory,
        preferences: config.personalization
      });
    }
    
    engagementOrchestrator.current.startNewSession();
    
    setSessionPhase('active-session');
    setIsSessionActive(true);
    setSessionStartTime(Date.now());
    
    // Clear previous session data
    setAchievements([]);
    setMilestones([]);
    setAdaptationsApplied([]);
    setDelightMomentsTriggered([]);
    emotionalAnalysis.clearHistory();

    updateEngagementMetrics();
  }, [initializeCamera, userHistory, emotionalAnalysis]);

  // Handle emotional state updates from vision system
  const handleEmotionalStateChange = useCallback((emotionalState: any) => {
    emotionalAnalysis.processEmotionalState(emotionalState.current);
    
    // Update engagement orchestrator
    const delightMoments = engagementOrchestrator.current.updateSessionPhase('active', {
      emotionalState: emotionalState.current,
      sessionData: { duration: sessionDuration, pattern: sessionConfig?.patternId }
    });

    if (delightMoments.length > 0) {
      setDelightMomentsTriggered(prev => [...prev, ...delightMoments]);
    }

    updateEngagementMetrics();
  }, [emotionalAnalysis, sessionDuration, sessionConfig]);

  // Handle pattern adaptations from dynamic enhancer
  const handlePatternAdaptation = useCallback((adaptation: PatternAdaptation) => {
    setAdaptationsApplied(prev => [...prev, adaptation]);
    
    // Show encouragement for adaptation
    const encouragement: EncouragementMessage = {
      text: adaptation.reason,
      type: 'technique',
      priority: 'medium',
      displayDuration: 3
    };
    
    handleEncouragement(encouragement);
    updateEngagementMetrics();
  }, []);

  // Handle visual adaptations
  const handleVisualAdaptation = useCallback((visual: VisualAdaptation) => {
    // Apply visual changes to session interface
    // This would integrate with your existing breathing animation system
    console.log('Visual adaptation:', visual);
  }, []);

  // Handle encouragement messages
  const handleEncouragement = useCallback((message: EncouragementMessage) => {
    setCurrentEncouragement(message);
    
    // Clear after display duration
    setTimeout(() => {
      setCurrentEncouragement(null);
    }, message.displayDuration * 1000);
  }, []);

  // Handle milestone achievements
  const handleMilestoneAchieved = useCallback((milestone: SessionMilestone) => {
    setMilestones(prev => [...prev, milestone]);
    
    // Convert milestone to achievement
    const achievement: Achievement = {
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      category: milestone.category as any,
      rarity: determineAchievementRarity(milestone),
      isNew: true,
      unlockedAt: Date.now()
    };
    
    setAchievements(prev => [...prev, achievement]);
    updateEngagementMetrics();
  }, []);

  // Check for duration-based milestones
  const checkDurationMilestones = useCallback((duration: number) => {
    const milestoneCheckpoints = [300, 600, 900, 1200, 1800]; // 5, 10, 15, 20, 30 minutes
    
    milestoneCheckpoints.forEach(checkpoint => {
      if (duration >= checkpoint && !milestones.some(m => m.id === `duration-${checkpoint}`)) {
        const milestone: SessionMilestone = {
          id: `duration-${checkpoint}`,
          title: `${checkpoint / 60} Minute Milestone`,
          description: `Sustained practice for ${checkpoint / 60} minutes`,
          achievedAt: duration,
          category: 'duration',
          reward: {
            visual: 'milestone-celebration',
            unlocks: checkpoint >= 900 ? ['advanced-patterns'] : undefined
          }
        };
        
        handleMilestoneAchieved(milestone);
      }
    });
  }, [milestones, handleMilestoneAchieved]);

  // Update engagement metrics
  const updateEngagementMetrics = useCallback(() => {
    const orchestratorMetrics = engagementOrchestrator.current.getEngagementMetrics();
    
    const newMetrics: EngagementMetrics = {
      preparationScore: sessionPhase === 'preparation' ? 85 : 100, // Assume good preparation
      sessionEngagement: orchestratorMetrics.sessionSatisfaction,
      delightMomentsTriggered: delightMomentsTriggered.length,
      personalityMatchScore: orchestratorMetrics.personalityMatch,
      adaptationEffectiveness: calculateAdaptationEffectiveness(),
      momentumScore: calculateMomentumScore()
    };
    
    setEngagementMetrics(newMetrics);
    onUserEngagementUpdate?.(newMetrics);
  }, [sessionPhase, delightMomentsTriggered.length, onUserEngagementUpdate]);

  // Calculate adaptation effectiveness
  const calculateAdaptationEffectiveness = useCallback((): number => {
    if (adaptationsApplied.length === 0) return 100; // No adaptations needed = perfect
    
    const emotionalHistory = emotionalAnalysis.state.history;
    if (emotionalHistory.length < 20) return 50;

    // Check if relaxation improved after adaptations
    let effectivenessSum = 0;
    adaptationsApplied.forEach(adaptation => {
      // This is a simplified calculation
      effectivenessSum += 75; // Assume moderate effectiveness
    });
    
    return Math.min(100, effectivenessSum / adaptationsApplied.length);
  }, [adaptationsApplied, emotionalAnalysis.state.history]);

  // Calculate momentum score
  const calculateMomentumScore = useCallback((): number => {
    let score = 0;
    
    if (sessionDuration > 300) score += 20; // Base completion
    score += achievements.length * 10;
    score += milestones.length * 5;
    score += Math.min(30, delightMomentsTriggered.length * 5);
    
    if (emotionalAnalysis.isRelaxationImproving) score += 25;
    if (emotionalAnalysis.currentRelaxationLevel === 'high') score += 15;
    
    return Math.min(100, score);
  }, [sessionDuration, achievements.length, milestones.length, delightMomentsTriggered.length, emotionalAnalysis]);

  // End session and move to completion
  const endSession = useCallback(() => {
    setIsSessionActive(false);
    
    // Cleanup camera
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }

    // Final engagement metrics update
    updateEngagementMetrics();
    
    setSessionPhase('completion');
  }, [cameraStream, updateEngagementMetrics]);

  // Complete session and move to insights
  const handleSessionCelebrationComplete = useCallback(() => {
    setSessionPhase('insights');
  }, []);

  // Final completion with all data
  const handleFinalCompletion = useCallback(() => {
    const completionData: SessionCompletionData = {
      sessionId,
      duration: sessionDuration,
      pattern: sessionConfig?.patternId || 'unknown',
      emotionalJourney: emotionalAnalysis.state.history,
      achievements,
      milestones,
      adaptationsApplied,
      engagementMetrics,
      insights: emotionalAnalysis.getSessionInsights(),
      userSatisfaction: engagementMetrics.sessionEngagement,
      retentionPrediction: engagementOrchestrator.current.getEngagementMetrics().retentionPrediction
    };
    
    onSessionComplete?.(completionData);
  }, [sessionId, sessionDuration, sessionConfig, emotionalAnalysis, achievements, milestones, adaptationsApplied, engagementMetrics, onSessionComplete]);

  // Render current session phase
  const renderSessionContent = () => {
    switch (sessionPhase) {
      case 'preparation':
        return (
          <PreSessionPreparation
            onSessionStart={handleSessionStart}
            onPatternSelected={(patternId, confidence) => {
              console.log('Pattern selected:', patternId, confidence);
            }}
            userHistory={userHistory}
            className="max-w-4xl mx-auto"
          />
        );

      case 'active-session':
        return (
          <div className="relative">
            {/* Session header */}
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold mb-2">
                {sessionConfig?.patternId || 'Breathing Session'}
              </h1>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                <span>⏱️ {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}</span>
                <span>🎯 {sessionConfig?.goals.length || 0} goals</span>
                <span>📊 {emotionalAnalysis.currentRelaxationLevel} relaxation</span>
              </div>
            </div>

            {/* Camera error */}
            {cameraError && (
              <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
                <p className="text-yellow-800">{cameraError}</p>
              </Card>
            )}

            {/* Video container with enhancements */}
            <Card className="relative mb-6 overflow-hidden bg-black">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-64 md:h-96 object-cover"
              />
              
              {/* Enhanced Vision Manager */}
              {cameraStream && (
                <EnhancedVisionManager
                  enabled={true}
                  videoRef={videoRef}
                  cameraStream={cameraStream}
                  sessionId={sessionId}
                  emotionalAnalysisEnabled={true}
                  showDetailedEmotrics={false}
                  onPatternRecommendation={(rec: PatternRecommendation) => {
                    console.log('Pattern recommendation:', rec);
                  }}
                  onEmotionalInsight={(insight: string, type: 'positive' | 'neutral' | 'suggestion') => {
                    handleEncouragement({
                      text: insight,
                      type: 'emotional',
                      priority: type === 'positive' ? 'high' : 'medium',
                      displayDuration: 4
                    });
                  }}
                  currentPatternId={sessionConfig?.patternId}
                  sessionDuration={sessionDuration}
                  isFirstSession={userHistory.length === 0}
                />
              )}

              {/* Dynamic Session Enhancer */}
              <DynamicSessionEnhancer
                sessionId={sessionId}
                currentPhase="inhale" // This would come from your breathing pattern logic
                emotionalState={emotionalAnalysis.state.current}
                sessionDuration={sessionDuration}
                totalDuration={sessionConfig?.duration || 600}
                patternId={sessionConfig?.patternId || 'simple-breathing'}
                onPatternAdaptation={handlePatternAdaptation}
                onVisualAdaptation={handleVisualAdaptation}
                onEncouragement={handleEncouragement}
                onMilestoneAchieved={handleMilestoneAchieved}
              />
            </Card>

            {/* Current encouragement overlay */}
            {currentEncouragement && (
              <Card className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 p-3 bg-white/90 backdrop-blur-sm border-none shadow-lg">
                <p className="text-sm font-medium text-center">{currentEncouragement.text}</p>
              </Card>
            )}

            {/* Session controls */}
            <div className="text-center">
              <Button onClick={endSession} size="lg" variant="outline" className="px-8">
                Complete Session
              </Button>
            </div>
          </div>
        );

      case 'completion':
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Immediate celebration */}
            <div className="text-center space-y-4">
              <div className="text-6xl animate-bounce">🎉</div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Session Complete!
              </h2>
              <p className="text-lg text-gray-600">
                {Math.round(sessionDuration / 60)} minutes of mindful breathing
              </p>
              
              {/* Quick stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{achievements.length}</div>
                  <div className="text-sm text-gray-600">Achievements</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{milestones.length}</div>
                  <div className="text-sm text-gray-600">Milestones</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(engagementMetrics.sessionEngagement)}%
                  </div>
                  <div className="text-sm text-gray-600">Engagement</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(engagementMetrics.momentumScore)}%
                  </div>
                  <div className="text-sm text-gray-600">Momentum</div>
                </Card>
              </div>
            </div>

            <div className="text-center">
              <Button onClick={handleSessionCelebrationComplete} size="lg" className="px-8">
                View Detailed Insights
              </Button>
            </div>
          </div>
        );

      case 'insights':
        return (
          <div className="max-w-4xl mx-auto">
            <EmotionalSessionInsights
              emotionalHistory={emotionalAnalysis.state.history}
              sessionDuration={sessionDuration}
              patternUsed={sessionConfig?.patternId}
              onRecommendationSelect={(patternId, reason) => {
                console.log('Future recommendation selected:', patternId, reason);
              }}
            />
            
            <div className="text-center mt-8">
              <Button onClick={handleFinalCompletion} size="lg" className="px-8">
                Complete Journey
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 ${className}`}>
      {/* Progress indicator */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-semibold">Your Mindful Journey</h1>
          <div className="text-sm text-gray-600">
            Phase: {sessionPhase.replace('-', ' ').toUpperCase()}
          </div>
        </div>
        <Progress 
          value={sessionPhase === 'preparation' ? 25 : 
                 sessionPhase === 'active-session' ? 50 : 
                 sessionPhase === 'completion' ? 75 : 100} 
          className="h-2"
        />
      </div>

      {/* Main content */}
      {renderSessionContent()}
    </div>
  );
};

// Helper functions
function determineAchievementRarity(milestone: SessionMilestone): 'common' | 'rare' | 'epic' | 'legendary' {
  switch (milestone.category) {
    case 'duration':
      if (milestone.achievedAt >= 1800) return 'epic'; // 30+ minutes
      if (milestone.achievedAt >= 1200) return 'rare'; // 20+ minutes
      return 'common';
    
    case 'emotional':
      return 'rare';
    
    case 'technique':
      return 'common';
    
    case 'breakthrough':
      return 'legendary';
    
    default:
      return 'common';
  }
}

export default ComprehensiveSessionOrchestrator;