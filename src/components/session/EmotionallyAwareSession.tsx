/**
 * Emotionally Aware Session Component
 * 
 * Example integration showing how to use emotional analysis in existing session flow
 * Maintains compatibility with current MeditationSession while adding emotional insights
 * 
 * Core Principles:
 * - ENHANCEMENT FIRST: Wraps/extends existing session components
 * - CLEAN: Clear separation between emotional features and core session logic
 * - MODULAR: Emotional features can be disabled without breaking session
 * - PERFORMANT: Emotional analysis runs alongside existing vision processing
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { EnhancedVisionManager } from './EnhancedVisionManager';
import { EmotionalSessionInsights } from './EmotionalSessionInsights';
import { PatternRecommendation, EmotionalContext } from '../../lib/breathing/emotional-pattern-adapter';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from '../ui/use-toast';

export interface EmotionallyAwareSessionProps {
  // Core session props (would normally come from your existing session)
  sessionId: string;
  initialPattern?: string;
  onSessionComplete?: (data: any) => void;
  onPatternChange?: (patternId: string) => void;
  
  // Emotional analysis configuration
  emotionalAnalysisEnabled?: boolean;
  showEmotionalInsights?: boolean;
  allowPatternRecommendations?: boolean;
  
  // User preferences
  userPreferences?: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    preferredFeedbackStyle: 'minimal' | 'moderate' | 'detailed';
    autoAcceptRecommendations: boolean;
  };
}

export const EmotionallyAwareSession: React.FC<EmotionallyAwareSessionProps> = ({
  sessionId,
  initialPattern = 'simple-breathing',
  onSessionComplete,
  onPatternChange,
  emotionalAnalysisEnabled = true,
  showEmotionalInsights = true,
  allowPatternRecommendations = true,
  userPreferences = {
    experienceLevel: 'beginner',
    preferredFeedbackStyle: 'moderate',
    autoAcceptRecommendations: false
  }
}) => {
  // Session state
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentPattern, setCurrentPattern] = useState(initialPattern);
  const [sessionDuration, setSessionDuration] = useState(0);
  
  // Emotional analysis state
  const [emotionalHistory, setEmotionalHistory] = useState<EmotionalContext[]>([]);
  const [pendingRecommendation, setPendingRecommendation] = useState<PatternRecommendation | null>(null);
  const [sessionInsights, setSessionInsights] = useState<string[]>([]);
  const [showInsightModal, setShowInsightModal] = useState(false);
  
  // Camera and vision setup
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { user } = useAuth();

  // Timer for session duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive && sessionStartTime) {
      interval = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, sessionStartTime]);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 30 }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera initialization failed:', error);
      setCameraError('Camera access denied. Session will continue without face tracking.');
    }
  }, []);

  // Start session
  const startSession = useCallback(async () => {
    await initializeCamera();
    setIsSessionActive(true);
    setSessionStartTime(Date.now());
    setEmotionalHistory([]);
    setSessionInsights([]);
  }, [initializeCamera]);

  // End session
  const endSession = useCallback(() => {
    setIsSessionActive(false);
    
    // Cleanup camera
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }

    // Prepare session data
    const sessionData = {
      sessionId,
      duration: sessionDuration,
      pattern: currentPattern,
      emotionalHistory: emotionalAnalysisEnabled ? emotionalHistory : [],
      insights: sessionInsights,
      completedAt: new Date().toISOString()
    };

    // Show insights modal if we have emotional data
    if (emotionalAnalysisEnabled && emotionalHistory.length > 0 && showEmotionalInsights) {
      setShowInsightModal(true);
    }

    onSessionComplete?.(sessionData);
  }, [
    sessionId, 
    sessionDuration, 
    currentPattern, 
    emotionalHistory, 
    sessionInsights, 
    cameraStream, 
    emotionalAnalysisEnabled, 
    showEmotionalInsights, 
    onSessionComplete
  ]);

  // Handle emotional state changes
  const handleEmotionalStateChange = useCallback((emotionalState: any) => {
    setEmotionalHistory(prev => [...prev, emotionalState.current]);
  }, []);

  // Handle pattern recommendations
  const handlePatternRecommendation = useCallback((recommendation: PatternRecommendation) => {
    if (!allowPatternRecommendations) return;

    if (userPreferences.autoAcceptRecommendations) {
      // Auto-accept recommendation
      setCurrentPattern(recommendation.patternId);
      onPatternChange?.(recommendation.patternId);
      toast({
        title: "Pattern Updated",
        description: recommendation.reason,
        duration: 3000
      });
    } else {
      // Show recommendation for user decision
      setPendingRecommendation(recommendation);
    }
  }, [allowPatternRecommendations, userPreferences.autoAcceptRecommendations, onPatternChange]);

  // Accept pattern recommendation
  const acceptRecommendation = useCallback(() => {
    if (pendingRecommendation) {
      setCurrentPattern(pendingRecommendation.patternId);
      onPatternChange?.(pendingRecommendation.patternId);
      setPendingRecommendation(null);
      toast({
        title: "Pattern Updated",
        description: pendingRecommendation.reason,
        duration: 3000
      });
    }
  }, [pendingRecommendation, onPatternChange]);

  // Decline pattern recommendation
  const declineRecommendation = useCallback(() => {
    setPendingRecommendation(null);
  }, []);

  // Handle emotional insights
  const handleEmotionalInsight = useCallback((insight: string, type: 'positive' | 'neutral' | 'suggestion') => {
    if (userPreferences.preferredFeedbackStyle === 'minimal' && type !== 'positive') return;
    
    setSessionInsights(prev => [...prev, insight]);
    
    // Show toast for immediate insights
    if (userPreferences.preferredFeedbackStyle !== 'minimal') {
      toast({
        title: type === 'positive' ? "Great Progress!" : "Insight",
        description: insight,
        duration: 4000
      });
    }
  }, [userPreferences.preferredFeedbackStyle]);

  // Format session duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Session Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold mb-2">
          {emotionalAnalysisEnabled ? 'Emotionally Aware' : 'Standard'} Breathing Session
        </h1>
        <p className="text-gray-600">
          {isSessionActive 
            ? `Session Active • ${formatDuration(sessionDuration)} • Pattern: ${currentPattern}`
            : 'Ready to begin your mindful breathing journey'
          }
        </p>
      </div>

      {/* Camera Error */}
      {cameraError && (
        <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
          <p className="text-yellow-800">{cameraError}</p>
        </Card>
      )}

      {/* Pending Recommendation */}
      {pendingRecommendation && (
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">Recommended Pattern Change</h3>
          <p className="text-blue-700 mb-3">{pendingRecommendation.reason}</p>
          <div className="flex gap-2">
            <Button onClick={acceptRecommendation} size="sm" className="bg-blue-600 hover:bg-blue-700">
              Try "{pendingRecommendation.patternId}"
            </Button>
            <Button onClick={declineRecommendation} variant="outline" size="sm">
              Keep Current Pattern
            </Button>
          </div>
        </Card>
      )}

      {/* Video Container */}
      <Card className="relative mb-6 overflow-hidden bg-black">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-full h-64 md:h-96 object-cover"
        />
        
        {/* Enhanced Vision Manager with Emotional Analysis */}
        {isSessionActive && cameraStream && (
          <EnhancedVisionManager
            enabled={true}
            videoRef={videoRef}
            cameraStream={cameraStream}
            sessionId={sessionId}
            emotionalAnalysisEnabled={emotionalAnalysisEnabled}
            showDetailedEmotrics={userPreferences.preferredFeedbackStyle === 'detailed'}
            onPatternRecommendation={handlePatternRecommendation}
            onEmotionalInsight={handleEmotionalInsight}
            currentPatternId={currentPattern}
            sessionDuration={sessionDuration}
            isFirstSession={!user?.sessionsCompleted}
          />
        )}
      </Card>

      {/* Session Controls */}
      <div className="flex justify-center gap-4 mb-6">
        {!isSessionActive ? (
          <Button onClick={startSession} size="lg" className="px-8">
            Start Session
          </Button>
        ) : (
          <Button onClick={endSession} size="lg" variant="outline" className="px-8">
            End Session
          </Button>
        )}
      </div>

      {/* Live Insights During Session */}
      {isSessionActive && sessionInsights.length > 0 && userPreferences.preferredFeedbackStyle !== 'minimal' && (
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-2">Session Insights</h3>
          <div className="space-y-1">
            {sessionInsights.slice(-3).map((insight, index) => (
              <p key={index} className="text-sm text-gray-600">• {insight}</p>
            ))}
          </div>
        </Card>
      )}

      {/* Post-Session Insights Modal/Panel */}
      {showInsightModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Session Complete!</h2>
                <Button 
                  onClick={() => setShowInsightModal(false)}
                  variant="ghost"
                  size="sm"
                >
                  ✕
                </Button>
              </div>
              
              <EmotionalSessionInsights
                emotionalHistory={emotionalHistory}
                sessionDuration={sessionDuration}
                patternUsed={currentPattern}
                onRecommendationSelect={(patternId, reason) => {
                  console.log('Future session recommendation:', patternId, reason);
                  toast({
                    title: "Recommendation Saved",
                    description: `${patternId} will be suggested for your next session`,
                  });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionallyAwareSession;