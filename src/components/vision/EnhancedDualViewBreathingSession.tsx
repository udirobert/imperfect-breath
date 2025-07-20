/**
 * Enhanced Dual View Breathing Session
 * Shows breathing animation AND camera feed side-by-side with real-time AI feedback
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Camera,
  CameraOff,
  Play,
  Pause,
  Square,
  Brain,
  Eye,
  Activity,
  Volume2,
  VolumeX,
  Settings,
  Maximize2,
  Minimize2,
} from 'lucide-react';

// Import our integrated hooks
import { useIntegratedVisionFeedback } from '../../hooks/useIntegratedVisionFeedback';
import { useBreathingSession } from '../../hooks/useBreathingSession';
import { useAuth } from '../../hooks/useAuth';

// Import existing components
import { BreathingVisualizer } from '../breathing/BreathingVisualizer';

interface EnhancedDualViewBreathingSessionProps {
  pattern: {
    name: string;
    phases: {
      inhale: number;
      hold?: number;
      exhale: number;
      pause?: number;
    };
    difficulty: string;
    benefits: string[];
  };
  onSessionComplete?: (metrics: any) => void;
}

export const EnhancedDualViewBreathingSession: React.FC<EnhancedDualViewBreathingSessionProps> = ({
  pattern,
  onSessionComplete,
}) => {
  // Auth and session state
  const { user, isAuthenticated } = useAuth();
  const { state: sessionState, startSession, pauseSession, stopSession } = useBreathingSession();
  
  // Integrated vision feedback
  const {
    isVisionActive,
    sessionMetrics,
    startVisionFeedback,
    stopVisionFeedback,
    provideFeedback,
  } = useIntegratedVisionFeedback({
    enableRealTimeFeedback: true,
    feedbackThresholds: {
      restlessness: 0.7,
      movement: 0.6,
      posture: 0.5,
    },
    feedbackInterval: 30,
  });

  // Local state for UI
  const [sessionStarted, setSessionStarted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>('inhale');
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Start integrated session with camera
   */
  const handleStartSession = useCallback(async () => {
    try {
      // Start vision feedback (includes camera)
      await startVisionFeedback();
      setCameraEnabled(true);
      
      // Start breathing session
      startSession(pattern.name);
      setSessionStarted(true);
      
      // Welcome message
      if (audioEnabled) {
        provideFeedback(
          `Welcome to your ${pattern.name} session. I'll be watching your breathing and providing guidance.`,
          'encouragement'
        );
      }
      
      console.log('Enhanced dual view session started');
    } catch (error) {
      console.error('Failed to start session:', error);
      // Graceful fallback: Continue with AI audio coaching only
      startSession(pattern.name);
      setSessionStarted(true);
      setCameraEnabled(false);
      
      if (audioEnabled) {
        provideFeedback(
          "Camera unavailable, but I'll still provide AI coaching through audio guidance.",
          'guidance'
        );
      }
    }
  }, [startVisionFeedback, startSession, pattern.name, provideFeedback, audioEnabled]);

  /**
   * Stop session
   */
  const handleStopSession = useCallback(() => {
    stopVisionFeedback();
    stopSession();
    setSessionStarted(false);
    setCameraEnabled(false);
    
    if (audioEnabled) {
      provideFeedback("Session complete. Well done!", 'encouragement');
    }
    
    // Trigger completion callback
    if (onSessionComplete && sessionMetrics.visionMetrics) {
      onSessionComplete({
        ...sessionState,
        visionMetrics: sessionMetrics.visionMetrics,
        restlessnessAnalysis: sessionMetrics.restlessnessAnalysis,
        sessionQuality: sessionMetrics.sessionQuality,
        aiRecommendations: sessionMetrics.aiRecommendations,
      });
    }
  }, [stopVisionFeedback, stopSession, sessionMetrics, sessionState, onSessionComplete, audioEnabled, provideFeedback]);

  /**
   * Handle phase changes for contextual feedback
   */
  const handlePhaseChange = useCallback((phase: string) => {
    setCurrentPhase(phase);
    
    // Provide phase-specific guidance based on current restlessness
    if (sessionMetrics.restlessnessAnalysis && audioEnabled) {
      const restlessness = sessionMetrics.restlessnessAnalysis.overall;
      
      if (restlessness > 0.6) {
        switch (phase) {
          case 'inhale':
            provideFeedback("Breathe in slowly and find your center.", 'guidance');
            break;
          case 'hold':
            provideFeedback("Hold steady, let stillness settle in.", 'guidance');
            break;
          case 'exhale':
            provideFeedback("Release all tension as you exhale.", 'guidance');
            break;
          case 'pause':
            provideFeedback("Rest in this peaceful moment.", 'guidance');
            break;
        }
      } else if (restlessness < 0.3) {
        // Occasional encouragement for good performance
        if (Math.random() < 0.3) {
          provideFeedback("Beautiful stillness. You're in perfect harmony.", 'encouragement');
        }
      }
    }
  }, [sessionMetrics.restlessnessAnalysis, audioEnabled, provideFeedback]);

  /**
   * Render camera feed with overlay
   */
  const renderCameraFeed = () => {
    if (!cameraEnabled) {
      return (
        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <CameraOff className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">Camera not available</p>
            <p className="text-xs">Session will continue without vision analysis</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {/* Video feed */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Vision analysis overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
        
        {/* Real-time metrics overlay */}
        {sessionMetrics.visionMetrics && (
          <div className="absolute top-4 left-4 space-y-2">
            {/* Quality indicator */}
            <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <Activity className="h-3 w-3" />
              Quality: {sessionMetrics.sessionQuality}%
            </div>
            
            {/* Stillness indicator */}
            {sessionMetrics.restlessnessAnalysis && (
              <div className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
                sessionMetrics.restlessnessAnalysis.overall < 0.3 
                  ? 'bg-green-500/80 text-white' 
                  : sessionMetrics.restlessnessAnalysis.overall < 0.6
                  ? 'bg-yellow-500/80 text-black'
                  : 'bg-red-500/80 text-white'
              }`}>
                <Eye className="h-3 w-3" />
                Stillness: {Math.round((1 - sessionMetrics.restlessnessAnalysis.overall) * 100)}%
              </div>
            )}
            
            {/* Current phase indicator */}
            <div className="bg-blue-500/80 text-white px-3 py-1 rounded-full text-sm capitalize">
              {currentPhase}
            </div>
          </div>
        )}
        
        {/* AI feedback indicator */}
        {audioEnabled && (
          <div className="absolute top-4 right-4">
            <div className="bg-purple-500/80 text-white p-2 rounded-full">
              <Brain className="h-4 w-4" />
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render breathing animation
   */
  const renderBreathingAnimation = () => (
    <div className="aspect-video">
      <BreathingVisualizer
        pattern={{
          name: pattern.name,
          phases: [
            { name: 'inhale', duration: pattern.phases.inhale },
            ...(pattern.phases.hold ? [{ name: 'hold' as const, duration: pattern.phases.hold }] : []),
            { name: 'exhale', duration: pattern.phases.exhale },
            ...(pattern.phases.pause ? [{ name: 'pause' as const, duration: pattern.phases.pause }] : []),
          ],
          cycles: 10,
        }}
        isActive={sessionState.isRunning}
        onPhaseChange={handlePhaseChange}
      />
    </div>
  );

  /**
   * Render session controls
   */
  const renderControls = () => (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        {!sessionStarted ? (
          <Button onClick={handleStartSession} size="lg">
            <Play className="mr-2 h-4 w-4" />
            Start Enhanced Session
          </Button>
        ) : (
          <>
            <Button 
              onClick={() => sessionState.isRunning ? pauseSession() : startSession(pattern.name)}
              variant="outline"
            >
              {sessionState.isRunning ? (
                <Pause className="mr-2 h-4 w-4" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {sessionState.isRunning ? 'Pause' : 'Resume'}
            </Button>
            <Button onClick={handleStopSession} variant="destructive">
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={() => setAudioEnabled(!audioEnabled)}
          variant="outline"
          size="icon"
        >
          {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
        
        <Button
          onClick={() => setIsFullscreen(!isFullscreen)}
          variant="outline"
          size="icon"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  /**
   * Render real-time AI recommendations
   */
  const renderAIRecommendations = () => {
    if (!sessionMetrics.aiRecommendations.length) return null;

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            AI Guidance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sessionMetrics.aiRecommendations.slice(0, 2).map((rec, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="text-purple-500 mt-1">•</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`mx-auto p-4 space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'max-w-6xl'}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-500" />
            Enhanced Vision Breathing Session
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{pattern.name}</Badge>
            <Badge variant={isVisionActive ? 'default' : 'secondary'}>
              {isVisionActive ? 'Vision Active' : 'Vision Inactive'}
            </Badge>
            <Badge variant={cameraEnabled ? 'default' : 'outline'}>
              {cameraEnabled ? 'Camera On' : 'Camera Off'}
            </Badge>
            <Badge variant={audioEnabled ? 'default' : 'outline'}>
              {audioEnabled ? 'AI Audio On' : 'AI Audio Off'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {renderControls()}
        </CardContent>
      </Card>

      {/* Main dual view - responsive for mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Left: Breathing Animation */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Breathing Guide</CardTitle>
          </CardHeader>
          <CardContent>
            {renderBreathingAnimation()}
          </CardContent>
        </Card>

        {/* Right: Camera Feed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Vision Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderCameraFeed()}
          </CardContent>
        </Card>
      </div>

      {/* Session stats and AI recommendations */}
      {sessionStarted && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Session Stats */}
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{Math.floor(sessionState.sessionDuration / 60)}m</div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{sessionState.cycleCount}</div>
              <div className="text-sm text-muted-foreground">Cycles</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{sessionMetrics.sessionQuality}%</div>
              <div className="text-sm text-muted-foreground">Quality</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Recommendations */}
      {sessionStarted && renderAIRecommendations()}
    </div>
  );
};