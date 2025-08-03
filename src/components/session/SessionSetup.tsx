import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Camera, Volume2, Brain, AlertCircle } from "lucide-react";
import {
  BREATHING_PATTERNS,
  BreathingPattern,
} from "../../lib/breathingPatterns";
import { useEnhancedSession } from "../../hooks/useEnhancedSession";
import { SessionErrorBoundary } from "../../lib/errors/error-boundary";
import { useSessionErrorHandler } from "../../hooks/useErrorHandler";

type PatternKey = keyof typeof BREATHING_PATTERNS;

interface SessionSetupProps {
  onSessionStart?: () => void;
  defaultPattern?: PatternKey;
}

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

const SessionSetupInner: React.FC<SessionSetupProps> = ({
  onSessionStart,
  defaultPattern = "boxBreathing",
}) => {
  const navigate = useNavigate();
  const { initialize, start, state, isReady } = useEnhancedSession();
  const { handleError } = useSessionErrorHandler();

  // Local state for configuration
  const [selectedPattern, setSelectedPattern] =
    useState<PatternKey>(defaultPattern);
  const [enableCamera, setEnableCamera] = useState(false);
  const [enableAI, setEnableAI] = useState(true);
  const [enableAudio, setEnableAudio] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize session when configuration changes
  useEffect(() => {
    if (isInitializing) return;

    const initializeSession = async () => {
      try {
        setIsInitializing(true);

        const pattern = BREATHING_PATTERNS[selectedPattern];
        const sessionConfig = {
          pattern: {
            name: pattern.name,
            phases: {
              inhale: pattern.inhale,
              hold: pattern.hold,
              exhale: pattern.exhale,
              pause: pattern.rest,
            },
            difficulty: "medium",
            benefits: pattern.benefits || [],
          },
          features: {
            enableCamera,
            enableAI: enableAI && enableCamera, // AI requires camera
            enableAudio,
          },
          cameraSettings: {
            displayMode: enableCamera
              ? ("awareness" as const)
              : ("focus" as const),
            quality: "medium" as const,
          },
        };

        await initialize(sessionConfig);
      } catch (error) {
        handleError(error as Error, {
          pattern: selectedPattern,
          features: { enableCamera, enableAI, enableAudio },
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSession();
  }, [
    selectedPattern,
    enableCamera,
    enableAI,
    enableAudio,
    initialize,
    handleError,
    isInitializing,
  ]);

  // Handle session start
  const handleStartSession = async () => {
    try {
      // Save preferences
      localStorage.setItem("preferEnhancedVision", enableCamera.toString());
      localStorage.setItem("preferAICoaching", enableAI.toString());
      localStorage.setItem("preferAudioGuidance", enableAudio.toString());

      await start();

      if (onSessionStart) {
        onSessionStart();
      } else {
        navigate("/session?active=true");
      }
    } catch (error) {
      handleError(error as Error);
    }
  };

  const renderFeatureStatus = () => {
    if (!isReady || state.phase !== "ready") return null;

    const features = [];

    if (enableCamera) {
      const cameraStatus = state.features.camera;
      features.push({
        icon: Camera,
        name: "Camera",
        status: cameraStatus,
        enabled: enableCamera,
      });
    }

    if (enableAI && enableCamera) {
      const aiStatus = state.features.ai;
      features.push({
        icon: Brain,
        name: "AI Coaching",
        status: aiStatus,
        enabled: enableAI,
      });
    }

    if (enableAudio) {
      const audioStatus = state.features.audio;
      features.push({
        icon: Volume2,
        name: "Audio Guidance",
        status: audioStatus,
        enabled: enableAudio,
      });
    }

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Feature Status</Label>
        <div className="grid grid-cols-1 gap-2">
          {features.map(({ icon: Icon, name, status, enabled }) => (
            <div
              key={name}
              className={`flex items-center justify-between p-2 rounded-md text-sm ${
                enabled
                  ? status === "active"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : status === "available"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : status === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                  : "bg-gray-50 text-gray-500 border border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{name}</span>
              </div>
              <span className="text-xs capitalize">
                {enabled ? status : "disabled"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWarnings = () => {
    if (!state.warnings.length) return null;

    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            {state.warnings.map((warning, index) => (
              <div key={index} className="text-sm">
                {warning}
              </div>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center text-center animate-fade-in w-full max-w-lg mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Prepare Your Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pattern Selection */}
          <div>
            <Label className="text-lg mb-3 block">
              Choose Your Breathing Pattern
            </Label>
            <RadioGroup
              value={selectedPattern}
              onValueChange={(value) => setSelectedPattern(value as PatternKey)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {Object.values(BREATHING_PATTERNS).map((pattern) => (
                <div key={pattern.id}>
                  <RadioGroupItem
                    value={pattern.id}
                    id={pattern.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={pattern.id}
                    className="flex flex-col text-center items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full transition-colors"
                  >
                    <span className="font-semibold">{pattern.name}</span>
                    <span className="text-xs text-muted-foreground mt-2">
                      {formatSessionDuration(pattern)}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {pattern.inhale}:{pattern.hold}:{pattern.exhale}:
                      {pattern.rest}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Feature Configuration */}
          <div className="space-y-4">
            <Label className="text-lg block">Enhancement Features</Label>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <Label htmlFor="audio-switch" className="font-medium">
                      Audio Guidance
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Spoken breathing cues and encouragement
                  </p>
                </div>
                <Switch
                  id="audio-switch"
                  checked={enableAudio}
                  onCheckedChange={setEnableAudio}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    <Label htmlFor="camera-switch" className="font-medium">
                      Camera Analysis
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Visual breathing feedback and posture monitoring
                  </p>
                </div>
                <Switch
                  id="camera-switch"
                  checked={enableCamera}
                  onCheckedChange={setEnableCamera}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    <Label htmlFor="ai-switch" className="font-medium">
                      AI Coaching
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Intelligent real-time feedback and recommendations
                  </p>
                  {!enableCamera && (
                    <p className="text-xs text-orange-600">
                      Requires camera to be enabled
                    </p>
                  )}
                </div>
                <Switch
                  id="ai-switch"
                  checked={enableAI}
                  onCheckedChange={setEnableAI}
                  disabled={!enableCamera}
                />
              </div>
            </div>
          </div>

          {/* Feature Status */}
          {renderFeatureStatus()}

          {/* Warnings */}
          {renderWarnings()}

          {/* Start Button */}
          <div className="pt-4">
            <Button
              onClick={handleStartSession}
              size="lg"
              className="w-full"
              disabled={!isReady || isInitializing}
            >
              {isInitializing
                ? "Preparing Session..."
                : isReady
                ? "Begin Session"
                : "Setting Up..."}
            </Button>

            {state.error && (
              <p className="text-red-600 text-sm mt-2">{state.error}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const SessionSetup: React.FC<SessionSetupProps> = (props) => {
  return (
    <SessionErrorBoundary>
      <SessionSetupInner {...props} />
    </SessionErrorBoundary>
  );
};
