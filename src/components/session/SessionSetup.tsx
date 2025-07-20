import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import {
  BREATHING_PATTERNS,
  BreathingPattern,
} from "../../lib/breathingPatterns";
import { useBreathingSession } from "../../hooks/useBreathingSession";

type PatternKey = keyof typeof BREATHING_PATTERNS;

type SessionSetupProps = {
  state: ReturnType<typeof useBreathingSession>["state"];
  controls: ReturnType<typeof useBreathingSession>["controls"];
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

const formatSessionDuration = (pattern: BreathingPattern) => {
  // Calculate total duration based on inhale, hold, exhale, rest
  const oneCycleDuration =
    pattern.inhale + pattern.hold + pattern.exhale + pattern.rest;

  // Estimate roughly 30 cycles for a session
  const cycles = 30;
  const totalSeconds = oneCycleDuration * cycles;

  // Format the duration
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  let durationString = "";
  if (mins > 0) durationString += `${mins} min `;
  if (secs > 0) durationString += `${secs} sec`;
  return durationString.trim() || "Brief";
};

export const SessionSetup = ({ state, controls }: SessionSetupProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center animate-fade-in w-full max-w-md mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">
            {state.isFinished ? "Session Complete!" : "Prepare Your Session"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {state.isFinished ? (
            <div className="text-center space-y-4">
              <p>
                You held your breath for{" "}
                <span className="font-bold">
                  {formatTime(state.breathHoldTime)}
                </span>
                .
              </p>
              <p>Well done. Take a moment to notice how you feel.</p>
            </div>
          ) : (
            <>
              <div>
                <Label className="text-lg mb-2 block">Choose Your Rhythm</Label>
                <RadioGroup
                  defaultValue={state.pattern.id}
                  onValueChange={(value) =>
                    controls.selectPattern(
                      BREATHING_PATTERNS[value as PatternKey]
                    )
                  }
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  {Object.values(BREATHING_PATTERNS).map((p) => (
                    <div key={p.id}>
                      <RadioGroupItem
                        value={p.id}
                        id={p.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={p.id}
                        className="flex flex-col text-center items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                      >
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-xs text-muted-foreground mt-2">
                          {formatSessionDuration(p)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="audio-switch" className="text-lg">
                    Audio Guidance
                  </Label>
                  <Switch
                    id="audio-switch"
                    checked={state.audioEnabled}
                    onCheckedChange={controls.toggleAudio}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="vision-switch" className="text-lg">
                      Enhanced Vision Coaching
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      AI-powered real-time feedback with camera analysis
                    </p>
                  </div>
                  <Switch
                    id="vision-switch"
                    checked={localStorage.getItem('preferEnhancedVision') === 'true'}
                    onCheckedChange={(checked) => {
                      localStorage.setItem('preferEnhancedVision', checked.toString());
                    }}
                  />
                </div>
              </div>
            </>
          )}
          <div className="flex gap-4">
            {state.isFinished ? (
              <Button asChild size="lg" className="w-full">
                <Link to="/">Back to Home</Link>
              </Button>
            ) : (
              <Button
                onClick={() => {
                  // Set enhanced vision preference if enabled
                  const useEnhanced = localStorage.getItem('preferEnhancedVision') === 'true';
                  if (useEnhanced) {
                    // Navigate to session with enhanced parameter
                    window.location.href = '/session?enhanced=true';
                  } else {
                    controls.prepareSession();
                  }
                }}
                size="lg"
                className="w-full"
              >
                {localStorage.getItem('preferEnhancedVision') === 'true' 
                  ? 'Begin Enhanced Session' 
                  : 'Setup Camera & Begin'
                }
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
