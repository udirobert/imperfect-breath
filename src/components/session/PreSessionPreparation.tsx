/**
 * Pre-Session Preparation Component
 * 
 * Optimizes user engagement and readiness before session starts
 * Creates anticipation, builds confidence, and personalizes the experience
 * 
 * Core Principles:
 * - ENHANCEMENT FIRST: Augments existing pre-session flow
 * - MODULAR: Can be integrated into any session type
 * - PERFORMANT: Lightweight preparation optimizations
 * - CLEAN: Clear separation of preparation and session logic
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import EngagementOrchestrator, { UserPersonality, UserDelightMoment } from '../../lib/user-delight/engagement-orchestrator';
import { EmotionalPatternAdapter } from '../../lib/breathing/emotional-pattern-adapter';
import { useAuth } from '../../hooks/useAuth';

export interface PreSessionPreparationProps {
  onSessionStart: (optimizedConfig: SessionConfig) => void;
  onPatternSelected: (patternId: string, confidence: number) => void;
  userHistory?: any[];
  currentMood?: 'energetic' | 'tired' | 'stressed' | 'neutral' | 'peaceful';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  availableTime?: number; // in minutes
  className?: string;
}

export interface SessionConfig {
  patternId: string;
  duration: number;
  emotionalAnalysisEnabled: boolean;
  delightMomentsEnabled: boolean;
  personalization: {
    colorScheme: string;
    encouragementStyle: string;
    feedbackFrequency: string;
  };
  goals: string[];
}

interface PreparationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  optional: boolean;
  estimatedTime: number; // seconds
}

interface MoodCalibration {
  detected: boolean;
  confidence: number;
  primaryEmotion: string;
  recommendations: string[];
}

interface PersonalizedRecommendation {
  type: 'pattern' | 'duration' | 'goal' | 'timing';
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
}

export const PreSessionPreparation: React.FC<PreSessionPreparationProps> = ({
  onSessionStart,
  onPatternSelected,
  userHistory = [],
  currentMood = 'neutral',
  timeOfDay = 'afternoon',
  availableTime = 10,
  className = ''
}) => {
  // State management
  const [preparationPhase, setPreparationPhase] = useState<'welcome' | 'calibration' | 'personalization' | 'ready'>('welcome');
  const [preparationSteps, setPreparationSteps] = useState<PreparationStep[]>([]);
  const [moodCalibration, setMoodCalibration] = useState<MoodCalibration | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string>('');
  const [sessionGoals, setSessionGoals] = useState<string[]>([]);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [delightMoments, setDelightMoments] = useState<UserDelightMoment[]>([]);
  const [preparationProgress, setPreparationProgress] = useState(0);
  const [estimatedReadiness, setEstimatedReadiness] = useState(0);

  // Hooks
  const { user } = useAuth();
  const engagementOrchestrator = useMemo(() => EngagementOrchestrator.getInstance(), []);
  const emotionalAdapter = useMemo(() => EmotionalPatternAdapter.getInstance(), []);

  // Detect user personality and initialize
  useEffect(() => {
    if (user && userHistory.length > 0) {
      const personality = engagementOrchestrator.detectPersonality(userHistory, user.preferences || {});
      engagementOrchestrator.setUserProfile({
        personality,
        experienceLevel: getUserExperienceLevel(userHistory),
        sessionHistory: userHistory,
        preferences: user.preferences || {}
      });

      // Trigger welcome delight moments
      const welcomeMoments = engagementOrchestrator.updateSessionPhase('pre-session', {
        sessionData: { returning: userHistory.length > 0 }
      });
      setDelightMoments(welcomeMoments);

      initializePreparationSteps(personality, userHistory);
      generatePersonalizedRecommendations(personality, userHistory);
    } else {
      initializePreparationSteps('mindful', []);
      generatePersonalizedRecommendations('mindful', []);
    }
  }, [user, userHistory, engagementOrchestrator]);

  // Initialize preparation steps based on user profile
  const initializePreparationSteps = useCallback((personality: UserPersonality, history: any[]) => {
    const isFirstTime = history.length === 0;
    const steps: PreparationStep[] = [
      {
        id: 'environment',
        title: 'Optimize Environment',
        description: 'Find a quiet, comfortable space and adjust lighting',
        completed: false,
        optional: false,
        estimatedTime: 30
      },
      {
        id: 'posture',
        title: 'Set Comfortable Posture',
        description: 'Sit comfortably with spine straight, shoulders relaxed',
        completed: false,
        optional: false,
        estimatedTime: 15
      },
      {
        id: 'intention',
        title: 'Set Session Intention',
        description: 'Choose what you want to achieve in this session',
        completed: false,
        optional: personality === 'explorer',
        estimatedTime: 20
      },
      {
        id: 'breathing-check',
        title: 'Natural Breathing Assessment',
        description: 'Take a few natural breaths to establish baseline',
        completed: false,
        optional: isFirstTime ? false : true,
        estimatedTime: 30
      }
    ];

    // Add personality-specific steps
    if (personality === 'achiever') {
      steps.push({
        id: 'goal-setting',
        title: 'Define Success Metrics',
        description: 'Set specific goals for today\'s session',
        completed: false,
        optional: false,
        estimatedTime: 25
      });
    }

    if (personality === 'data-driven') {
      steps.push({
        id: 'baseline-measurement',
        title: 'Capture Baseline Metrics',
        description: 'Record starting emotional and physical state',
        completed: false,
        optional: false,
        estimatedTime: 20
      });
    }

    if (personality === 'socializer') {
      steps.push({
        id: 'community-connection',
        title: 'Connect with Community',
        description: 'See what others are practicing today',
        completed: false,
        optional: true,
        estimatedTime: 15
      });
    }

    setPreparationSteps(steps);
  }, []);

  // Generate personalized recommendations
  const generatePersonalizedRecommendations = useCallback((personality: UserPersonality, history: any[]) => {
    const recommendations: PersonalizedRecommendation[] = [];

    // Pattern recommendation based on time of day and mood
    const patternRec = getTimeAndMoodBasedPattern(timeOfDay, currentMood, personality);
    if (patternRec) {
      recommendations.push({
        type: 'pattern',
        title: `${patternRec.pattern} Pattern`,
        description: patternRec.description,
        confidence: patternRec.confidence,
        reasoning: patternRec.reasoning
      });
      setSelectedPattern(patternRec.pattern);
    }

    // Duration recommendation based on available time and history
    const durationRec = getOptimalDuration(availableTime, history, personality);
    recommendations.push({
      type: 'duration',
      title: `${durationRec.minutes} Minute Session`,
      description: durationRec.description,
      confidence: durationRec.confidence,
      reasoning: durationRec.reasoning
    });

    // Goal recommendations based on recent patterns
    const goalRecs = getSessionGoalRecommendations(history, currentMood, personality);
    goalRecs.forEach(goal => recommendations.push(goal));

    setPersonalizedRecommendations(recommendations);
  }, [timeOfDay, currentMood, availableTime]);

  // Update preparation progress
  useEffect(() => {
    const completedSteps = preparationSteps.filter(step => step.completed).length;
    const progress = preparationSteps.length > 0 ? (completedSteps / preparationSteps.length) * 100 : 0;
    setPreparationProgress(progress);

    // Calculate readiness score
    const requiredStepsCompleted = preparationSteps
      .filter(step => !step.optional)
      .every(step => step.completed);
    
    let readiness = progress;
    if (selectedPattern) readiness += 20;
    if (sessionGoals.length > 0) readiness += 15;
    if (moodCalibration?.detected) readiness += 10;

    setEstimatedReadiness(Math.min(100, readiness));

    // Auto-advance phases
    if (progress >= 50 && preparationPhase === 'welcome') {
      setPreparationPhase('calibration');
    } else if (progress >= 75 && preparationPhase === 'calibration') {
      setPreparationPhase('personalization');
    } else if (progress >= 90 && preparationPhase === 'personalization') {
      setPreparationPhase('ready');
    }
  }, [preparationSteps, selectedPattern, sessionGoals, moodCalibration, preparationPhase]);

  // Complete preparation step
  const completeStep = useCallback((stepId: string) => {
    setPreparationSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
  }, []);

  // Toggle session goal
  const toggleGoal = useCallback((goal: string) => {
    setSessionGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  }, []);

  // Start session with optimized configuration
  const startSession = useCallback(() => {
    const optimization = engagementOrchestrator.getSessionOptimization(
      availableTime * 60, // Convert to seconds
      [] // No emotional history yet
    );

    const config: SessionConfig = {
      patternId: selectedPattern || 'simple-breathing',
      duration: Math.min(availableTime * 60, optimization.recommendedDuration),
      emotionalAnalysisEnabled: true,
      delightMomentsEnabled: true,
      personalization: optimization.personalizedElements,
      goals: sessionGoals
    };

    onSessionStart(config);
  }, [selectedPattern, availableTime, sessionGoals, engagementOrchestrator, onSessionStart]);

  // Render preparation phase content
  const renderPhaseContent = () => {
    switch (preparationPhase) {
      case 'welcome':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                {userHistory.length > 0 ? 'Welcome Back!' : 'Welcome to Your Journey'}
              </h2>
              <p className="text-gray-600">
                {userHistory.length > 0 
                  ? `Let's build on your ${userHistory.length} previous session${userHistory.length > 1 ? 's' : ''}`
                  : 'Let\'s prepare for your first mindful breathing session'
                }
              </p>
            </div>

            {/* Delight moments */}
            {delightMoments.map((moment, index) => (
              <Card key={moment.id} className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full animate-pulse`} 
                       style={{ backgroundColor: moment.visual?.color || '#4ECDC4' }} />
                  <p className="text-blue-800 font-medium">{moment.message}</p>
                </div>
              </Card>
            ))}

            {/* Preparation steps overview */}
            <div className="grid gap-3">
              {preparationSteps.slice(0, 3).map((step, index) => (
                <div key={step.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${step.completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-sm text-gray-600">{step.description}</div>
                  </div>
                  <Button
                    size="sm"
                    variant={step.completed ? "outline" : "default"}
                    onClick={() => completeStep(step.id)}
                    disabled={step.completed}
                  >
                    {step.completed ? '✓' : 'Done'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'calibration':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Quick Calibration</h3>
              <p className="text-gray-600">Let's personalize your experience</p>
            </div>

            {/* Current mood detection */}
            <Card className="p-4">
              <h4 className="font-medium mb-3">How are you feeling right now?</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {['energetic', 'peaceful', 'neutral', 'tired', 'stressed'].map(mood => (
                  <Button
                    key={mood}
                    variant={currentMood === mood ? "default" : "outline"}
                    size="sm"
                    className="capitalize"
                    onClick={() => {
                      // Update mood and regenerate recommendations
                      generatePersonalizedRecommendations(
                        engagementOrchestrator['userProfile']?.personality || 'mindful',
                        userHistory
                      );
                    }}
                  >
                    {mood}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Available time confirmation */}
            <Card className="p-4">
              <h4 className="font-medium mb-3">How much time do you have?</h4>
              <div className="flex gap-2">
                {[5, 10, 15, 20, 30].map(minutes => (
                  <Button
                    key={minutes}
                    variant={availableTime === minutes ? "default" : "outline"}
                    size="sm"
                  >
                    {minutes}m
                  </Button>
                ))}
              </div>
            </Card>

            {/* Remaining preparation steps */}
            <div className="space-y-2">
              {preparationSteps.filter(step => !step.completed).map(step => (
                <div key={step.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-sm text-gray-600">{step.description}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => completeStep(step.id)}
                  >
                    Ready
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'personalization':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Personalized Recommendations</h3>
              <p className="text-gray-600">Based on your profile and current state</p>
            </div>

            {/* Pattern recommendation */}
            {personalizedRecommendations.filter(r => r.type === 'pattern').map(rec => (
              <Card key={rec.title} className="p-4 border-green-200 bg-green-50">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-800">{rec.title}</h4>
                    <p className="text-green-700 mb-2">{rec.description}</p>
                    <p className="text-sm text-green-600">{rec.reasoning}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="text-xs text-green-600">Confidence: {rec.confidence}%</div>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => onPatternSelected(selectedPattern, rec.confidence)}
                      >
                        Use This Pattern
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {/* Session goals */}
            <Card className="p-4">
              <h4 className="font-medium mb-3">What would you like to achieve today?</h4>
              <div className="grid gap-2">
                {[
                  'Reduce stress and tension',
                  'Improve focus and clarity', 
                  'Find inner peace',
                  'Boost energy levels',
                  'Practice mindfulness',
                  'Emotional regulation'
                ].map(goal => (
                  <label key={goal} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={sessionGoals.includes(goal)}
                      onChange={() => toggleGoal(goal)}
                      className="rounded"
                    />
                    <span className="text-sm">{goal}</span>
                  </label>
                ))}
              </div>
            </Card>
          </div>
        );

      case 'ready':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">You're Ready!</h3>
              <p className="text-gray-600">Everything is optimized for your perfect session</p>
            </div>

            {/* Readiness score */}
            <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
              <div className="text-4xl font-bold text-green-600 mb-2">{Math.round(estimatedReadiness)}%</div>
              <div className="text-sm text-green-700 mb-4">Session Readiness</div>
              
              <div className="space-y-2 text-left max-w-sm mx-auto">
                <div className="flex justify-between text-sm">
                  <span>Pattern Selected:</span>
                  <span className="font-medium">{selectedPattern || 'Simple Breathing'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Duration:</span>
                  <span className="font-medium">{availableTime} minutes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Goals Set:</span>
                  <span className="font-medium">{sessionGoals.length} goals</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Preparation:</span>
                  <span className="font-medium">{Math.round(preparationProgress)}% complete</span>
                </div>
              </div>
            </Card>

            {/* Final encouragement */}
            <div className="text-center">
              <p className="text-lg text-gray-700 mb-4">
                Take a deep breath. You've got this. 🌟
              </p>
              <Button
                size="lg"
                className="px-8 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                onClick={startSession}
                disabled={estimatedReadiness < 70}
              >
                Begin Your Journey
              </Button>
              {estimatedReadiness < 70 && (
                <p className="text-sm text-gray-500 mt-2">
                  Complete a few more preparation steps to optimize your experience
                </p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`max-w-2xl mx-auto p-6 ${className}`}>
      {/* Progress header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">Session Preparation</h1>
          <div className="text-sm text-gray-600">
            {Math.round(preparationProgress)}% ready
          </div>
        </div>
        <Progress value={preparationProgress} className="h-2" />
      </div>

      {/* Phase content */}
      {renderPhaseContent()}
    </div>
  );
};

// Helper functions
function getUserExperienceLevel(history: any[]): 'beginner' | 'intermediate' | 'advanced' {
  const sessionCount = history.length;
  const avgDuration = sessionCount > 0 
    ? history.reduce((sum, s) => sum + s.duration, 0) / sessionCount 
    : 0;

  if (sessionCount < 5) return 'beginner';
  if (sessionCount < 20 || avgDuration < 600) return 'intermediate';
  return 'advanced';
}

function getTimeAndMoodBasedPattern(
  timeOfDay: string, 
  mood: string, 
  personality: UserPersonality
): { pattern: string; description: string; confidence: number; reasoning: string } | null {
  // Morning patterns
  if (timeOfDay === 'morning') {
    if (mood === 'tired') {
      return {
        pattern: 'Energizing Breath',
        description: 'Wake up your mind and body with invigorating breathing',
        confidence: 85,
        reasoning: 'Morning energy boost needed based on tired state'
      };
    }
    return {
      pattern: 'Morning Clarity',
      description: 'Set positive intentions for the day ahead',
      confidence: 75,
      reasoning: 'Morning sessions benefit from intentional, focusing patterns'
    };
  }

  // Evening patterns
  if (timeOfDay === 'evening' || timeOfDay === 'night') {
    if (mood === 'stressed') {
      return {
        pattern: '4-7-8 Calming',
        description: 'Release the day\'s stress with extended exhales',
        confidence: 90,
        reasoning: 'Stressed state in evening requires proven stress-relief technique'
      };
    }
    return {
      pattern: 'Peaceful Transition',
      description: 'Gently transition from day to rest',
      confidence: 80,
      reasoning: 'Evening sessions should promote relaxation and peace'
    };
  }

  // Default based on mood
  if (mood === 'energetic') {
    return {
      pattern: 'Balanced Energy',
      description: 'Channel your energy into focused awareness',
      confidence: 70,
      reasoning: 'High energy state benefits from balancing patterns'
    };
  }

  return null;
}

function getOptimalDuration(
  availableTime: number, 
  history: any[], 
  personality: UserPersonality
): { minutes: number; description: string; confidence: number; reasoning: string } {
  let recommendedMinutes = availableTime;

  // Adjust based on history
  if (history.length > 0) {
    const avgDuration = history.reduce((sum, s) => sum + s.duration, 0) / history.length / 60;
    const completionRate = history.filter(s => s.completed).length / history.length;

    if (completionRate < 0.7) {
      // User struggles to complete sessions, recommend shorter
      recommendedMinutes = Math.min(availableTime, Math.max(5, avgDuration * 0.8));
    } else if (completionRate > 0.9 && avgDuration >= availableTime * 0.9) {
      // User consistently completes, might handle slightly longer
      recommendedMinutes = Math.min(availableTime, avgDuration * 1.1);
    }
  }

  // Personality adjustments
  if (personality === 'achiever') {
    recommendedMinutes = Math.min(availableTime, recommendedMinutes * 1.1);
  } else if (personality === 'explorer') {
    recommendedMinutes = Math.min(availableTime, recommendedMinutes * 0.9); // Shorter for variety
  }

  return {
    minutes: Math.round(recommendedMinutes),
    description: `Optimized for your ${personality} personality and ${history.length > 0 ? 'session history' : 'first experience'}`,
    confidence: history.length > 3 ? 85 : 65,
    reasoning: history.length > 0 
      ? `Based on your average ${Math.round(history.reduce((sum, s) => sum + s.duration, 0) / history.length / 60)}min sessions`
      : 'Conservative duration for first-time experience'
  };
}

function getSessionGoalRecommendations(
  history: any[], 
  mood: string, 
  personality: UserPersonality
): PersonalizedRecommendation[] {
  const recommendations: PersonalizedRecommendation[] = [];

  // Mood-based goals
  if (mood === 'stressed') {
    recommendations.push({
      type: 'goal',
      title: 'Stress Relief Priority',
      description: 'Focus on releasing tension and finding calm',
      confidence: 90,
      reasoning: 'Current stressed state indicates need for stress reduction'
    });
  }

  if (mood === 'tired') {
    recommendations.push({
      type: 'goal',
      title: 'Gentle Restoration',
      description: 'Restore energy without overstimulation',
      confidence: 80,
      reasoning: 'Tired state requires gentle, restorative approach'
    });
  }

  // Personality-based goals
  if (personality === 'achiever') {
    recommendations.push({
      type: 'goal',
      title: 'Performance Enhancement',
      description: 'Improve focus and mental clarity for better performance',
      confidence: 75,
      reasoning: 'Achiever personality benefits from performance-oriented goals'
    });
  }

  return recommendations;
}

export default PreSessionPreparation;