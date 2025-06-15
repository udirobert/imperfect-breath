
import React, { useRef, lazy, Suspense, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pause, Play, StopCircle, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import BreathingAnimation from '@/components/BreathingAnimation';
// import VideoFeed from '@/components/VideoFeed';
import { useBreathingSession } from '@/hooks/useBreathingSession';
import { BREATHING_PATTERNS, BreathingPhaseName } from '@/lib/breathingPatterns';
import { useCameraTracking } from '@/hooks/useCameraTracking';
import { useDemoMode } from '@/context/DemoModeContext';

const VideoFeed = lazy(() => import('@/components/VideoFeed'));

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const BreathingSession = () => {
  const { state, controls } = useBreathingSession();
  const { isDemoMode } = useDemoMode();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const isTracking = state.sessionPhase === 'breath-hold' && !isDemoMode;
  const { restlessnessScore } = useCameraTracking({ videoRef, isTracking });
  const showVideoFeed = state.sessionPhase !== 'idle' && !state.isFinished && !isDemoMode;

  useEffect(() => {
    if (!isDemoMode || !state.isRunning || state.isFinished) {
      return;
    }

    const feedbackMessages = [
      "Your posture is very stable. Excellent focus.",
      "Slight movement detected. Try to find complete stillness.",
      "Breathing rhythm looks exceptionally steady.",
      "A minor adjustment in posture was noted. Resettling.",
      "The stillness in your upper body is indicative of a calm state.",
      "Your breath appears deep and regular.",
      "Micro-movements have decreased, showing deeper relaxation.",
    ];

    let timeoutId: NodeJS.Timeout;

    const showRandomFeedback = () => {
      // Guard against showing feedback after session has ended
      if (!state.isRunning || state.isFinished) {
         clearTimeout(timeoutId);
         return;
      }
      
      const message = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)];
      toast.info("Biometric Feedback (Demo)", {
        description: message,
        duration: 5000,
      });

      const nextInterval = (Math.random() * 30 + 30) * 1000; // 30-60 seconds
      timeoutId = setTimeout(showRandomFeedback, nextInterval);
    };
    
    // Start with an initial delay
    const initialDelay = (Math.random() * 15 + 15) * 1000; // 15-30 seconds for first feedback
    timeoutId = setTimeout(showRandomFeedback, initialDelay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isDemoMode, state.isRunning, state.isFinished]);


  const handleEndSession = () => {
    const pattern = BREATHING_PATTERNS[state.pattern.key];
    const oneCycleDuration = pattern.phases.reduce((sum, phase) => sum + phase.duration, 0);
    // We calculate duration based on completed cycles. This doesn't account for a partial cycle, but is a good approximation.
    const sessionDuration = (state.cycleCount * oneCycleDuration) / 1000;

    let finalBreathHoldTime = state.breathHoldTime;
    let finalRestlessnessScore = restlessnessScore;

    if (isDemoMode) {
      finalBreathHoldTime = 90; // Emulate 90-second breath hold
      finalRestlessnessScore = Math.floor(Math.random() * 15) + 5; // Emulate low restlessness (5-19)
    }
    
    controls.endSession();
    navigate('/results', { state: { 
      breathHoldTime: finalBreathHoldTime,
      restlessnessScore: finalRestlessnessScore,
      patternName: state.pattern.key,
      sessionDuration
    } });
  };

  if (state.sessionPhase === 'idle' || state.isFinished) {
    return (
      <div className="flex flex-col items-center justify-center text-center animate-fade-in w-full max-w-md mx-auto">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">{state.isFinished ? "Session Complete!" : "Prepare Your Session"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {state.isFinished ? (
              <div className="text-center space-y-4">
                 <p>You held your breath for <span className="font-bold">{formatTime(state.breathHoldTime)}</span>.</p>
                 <p>Well done. Take a moment to notice how you feel.</p>
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-lg mb-2 block">Choose Your Rhythm</Label>
                  <RadioGroup
                    defaultValue={state.pattern.key}
                    onValueChange={(value) => controls.selectPattern(value as any)}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                  >
                    {Object.values(BREATHING_PATTERNS).map(p => (
                      <div key={p.key}>
                        <RadioGroupItem value={p.key} id={p.key} className="peer sr-only" />
                        <Label
                          htmlFor={p.key}
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                        >
                          {p.name}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="audio-switch" className="text-lg">Audio Guidance</Label>
                  <Switch
                    id="audio-switch"
                    checked={state.audioEnabled}
                    onCheckedChange={controls.toggleAudio}
                  />
                </div>
              </>
            )}
            <div className="flex gap-4">
              {state.isFinished ? (
                <Button asChild size="lg" className="w-full"><Link to="/">Back to Home</Link></Button>
              ) : (
                <Button onClick={controls.startSession} size="lg" className="w-full">
                  Begin Session
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center w-full relative animate-fade-in">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <BreathingAnimation 
          phase={state.sessionPhase === 'breath-hold' ? 'hold' : state.sessionPhase as BreathingPhaseName} 
          text={state.phaseText} 
        />
      </div>

      <div className="absolute top-8 text-center z-20">
        <p className="text-lg text-muted-foreground">{state.pattern.name}</p>
        {state.sessionPhase !== 'breath-hold' && state.pattern.cycles !== Infinity &&
          <p className="text-2xl font-bold text-primary">Cycle: {state.cycleCount + 1} / {state.pattern.cycles}</p>
        }
        {state.sessionPhase === 'breath-hold' ? (
          <p className="text-4xl font-mono font-bold text-primary animate-pulse">{formatTime(state.breathHoldTime)}</p>
        ) : (
          <p className="text-4xl font-mono font-bold text-primary">{state.phaseCountdown > 0 ? state.phaseCountdown : ''}</p>
        )}
      </div>

      <div className="z-20 mt-auto mb-8 flex items-center justify-center space-x-4">
        <Button variant="ghost" size="icon" onClick={controls.toggleAudio} className="rounded-full w-16 h-16">
          {state.audioEnabled ? <Volume2 size={32} /> : <VolumeX size={32} />}
        </Button>
        <Button variant="ghost" size="icon" onClick={controls.togglePause} className="rounded-full w-16 h-16">
          {state.isRunning && state.sessionPhase !== 'breath-hold' ? <Pause size={32} /> : <Play size={32} />}
        </Button>
        <Button variant="destructive" size="icon" onClick={handleEndSession} className="rounded-full w-16 h-16 bg-red-400 hover:bg-red-500">
          <StopCircle size={32} />
        </Button>
      </div>

      {showVideoFeed && (
        <Suspense fallback={<div className="absolute bottom-4 right-4 w-32 h-24 md:w-48 md:h-36 rounded-lg bg-secondary animate-pulse" />}>
          <VideoFeed videoRef={videoRef} isActive={showVideoFeed} />
        </Suspense>
      )}
      
      {isTracking && (
        <div className="absolute bottom-4 left-4 bg-gray-900/80 text-white p-2 rounded-lg text-xs z-30 font-mono animate-fade-in">
          <p>RESTLESSNESS: {Math.round(restlessnessScore)}</p>
        </div>
      )}
    </div>
  );
};

export default BreathingSession;
