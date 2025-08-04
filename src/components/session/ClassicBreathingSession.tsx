/**
 * Classic Breathing Session - Clean, focused breathing experience
 *
 * SINGLE RESPONSIBILITY: Provides distraction-free breathing practice
 * NO CAMERA: No video feed or vision-related complexity
 * PERFORMANCE: Lightweight with minimal overhead
 */

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  StopCircle,
  Clock,
  Target,
} from "lucide-react";
import BreathingAnimation from "../BreathingAnimation";
import { PreparationPhase } from "./PreparationPhase";
import { useEnhancedSession } from "../../hooks/useEnhancedSession";
import { useDesktopSessionInitialization } from "../../hooks/useSessionInitialization";
import { mapPatternForAnimation } from "../../lib/session/pattern-mapper";
import {
  BreathingPhaseName,
  BREATHING_PATTERNS,
} from "../../lib/breathingPatterns";

interface ClassicBreathingSessionProps {
  patternName: string;
  onSessionComplete: (metrics: any) => void;
}

export const ClassicBreathingSession: React.FC<
  ClassicBreathingSessionProps
> = ({ patternName, onSessionComplete }) => {
  const [showPreparation, setShowPreparation] = useState(true);

  // Use proper session initialization for classic sessions
  const { isInitializing, initializationError, isReady } =
    useDesktopSessionInitialization(BREATHING_PATTERNS.box);

  const {
    state,
    isActive,
    isPaused,
    start,
    pause,
    resume,
    complete,
    toggleAudio,
    isAudioEnabled,
    getSessionDuration,
    initialize,
  } = useEnhancedSession();

  // Initialize the session when component mounts and is ready
  useEffect(() => {
    if (isReady && !isActive && !isPaused && !state.sessionData.cycleCount) {
      // Initialize with classic session config
      const sessionConfig = {
        pattern: {
          name: BREATHING_PATTERNS.box.name,
          phases: {
            inhale: BREATHING_PATTERNS.box.inhale,
            hold: BREATHING_PATTERNS.box.hold,
            exhale: BREATHING_PATTERNS.box.exhale,
            pause: BREATHING_PATTERNS.box.hold_after_exhale,
          },
          difficulty: "intermediate",
          benefits: BREATHING_PATTERNS.box.benefits,
        },
        features: {
          enableCamera: false,
          enableAI: false,
          enableAudio: true,
        },
        cameraSettings: {
          displayMode: "focus" as const,
          quality: "medium" as const,
        },
      };

      initialize(sessionConfig).catch(console.error);
    }
  }, [isReady, initialize, isActive, isPaused, state.sessionData.cycleCount]);

  const handleStartSession = async () => {
    try {
      if (!isReady) {
        console.warn("Session not ready to start");
        return;
      }
      setShowPreparation(false);
      await start();
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const handleCancelPreparation = () => {
    setShowPreparation(false);
    // Navigate back or call onSessionComplete with no data
    window.history.back();
  };

  const handleEndSession = () => {
    const finalSessionData = {
      breathHoldTime: 0, // Classic sessions don't track breath holds
      restlessnessScore: 0, // No camera = no restlessness tracking
      cycleCount: state.sessionData.cycleCount,
      sessionDuration: state.sessionData.duration,
      patternName,
      elapsedTime: state.sessionData.duration * 1000,
      // Classic session specific data
      sessionType: "classic",
      cameraUsed: false,
      aiUsed: false,
    };

    complete();
    onSessionComplete(finalSessionData);
  };

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center w-full relative animate-fade-in">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Preparing your session...</p>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (initializationError) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center w-full relative animate-fade-in">
        <div className="text-center space-y-4">
          <p className="text-red-600">Failed to initialize session</p>
          <p className="text-sm text-muted-foreground">{initializationError}</p>
          <Button onClick={() => window.history.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Show preparation phase
  if (showPreparation && isReady) {
    return (
      <div className="flex-grow flex flex-col w-full relative animate-fade-in">
        <PreparationPhase
          patternName={patternName}
          pattern={mapPatternForAnimation(BREATHING_PATTERNS.box)}
          onStart={handleStartSession}
          onCancel={handleCancelPreparation}
        />
      </div>
    );
  }

  // Show setup screen if session is ready but not started and not in preparation
  if (!showPreparation && !isActive && !isPaused && isReady) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center w-full relative animate-fade-in">
        <div className="text-center space-y-6">
          <Badge variant="secondary" className="mb-2">
            Classic Session
          </Badge>
          <h2 className="text-2xl font-bold">{patternName}</h2>
          <p className="text-muted-foreground max-w-md">
            Ready to begin your focused breathing practice. No distractions,
            just pure mindfulness.
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => setShowPreparation(true)}
              size="lg"
              className="w-48"
            >
              Begin Preparation
            </Button>

            <Button
              variant="outline"
              onClick={handleStartSession}
              size="lg"
              className="w-48"
            >
              Start Immediately
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={handleCancelPreparation}
            className="text-muted-foreground"
          >
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  // Main classic session interface (active or paused session)
  if (isActive || isPaused) {
    return (
      <div className="flex-grow flex flex-col w-full relative animate-fade-in bg-gradient-to-b from-blue-50/30 to-white">
        {/* Minimal Header - just timer */}
        <div className="flex-shrink-0 p-4 text-center">
          <p className="text-2xl font-mono font-bold text-primary">
            {getSessionDuration()}
          </p>
        </div>

        {/* Breathing Animation - Centered and Prominent */}
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-8">
            <BreathingAnimation
              phase={state.sessionData.currentPhase as BreathingPhaseName}
              pattern={mapPatternForAnimation(BREATHING_PATTERNS.box)}
              isActive={isActive}
              phaseProgress={state.sessionData.phaseProgress}
            />

            {/* Simple cycle counter only */}
            <div className="flex justify-center">
              <Card className="px-4 py-2">
                <CardContent className="p-0 text-center">
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">
                      {state.sessionData.cycleCount}
                    </span>
                    <span className="text-muted-foreground">cycles</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="px-6 mb-6">
          <Progress
            value={Math.min((state.sessionData.duration / 300) * 100, 100)}
            className="h-1"
          />
        </div>

        {/* Clean Controls */}
        <div className="flex-shrink-0 p-6">
          <div className="flex items-center justify-center space-x-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudio}
              className="rounded-full w-12 h-12"
            >
              {isAudioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (isActive) {
                  pause();
                } else if (isPaused) {
                  resume();
                }
              }}
              className="rounded-full w-16 h-16 bg-primary/10 hover:bg-primary/20"
              disabled={!isActive && !isPaused}
            >
              {isActive ? <Pause size={32} /> : <Play size={32} />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleEndSession}
              className="rounded-full w-12 h-12"
            >
              <StopCircle size={24} />
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Focus on your breath • No distractions • Pure mindfulness
          </p>
        </div>
      </div>
    );
  }

  // Fallback - should not reach here normally
  return (
    <div className="flex-grow flex flex-col items-center justify-center w-full relative animate-fade-in">
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Initializing session...</p>
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    </div>
  );
};
