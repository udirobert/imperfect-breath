import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import BreathingAnimation from "../BreathingAnimation";
import { useCamera } from "../../contexts/CameraContext";
import { cn } from "../../lib/utils";
import {
  Heart,
  Focus,
  Brain,
  Moon,
  Zap,
  Sparkles,
  CheckCircle,
  Clock,
  ArrowRight,
  Camera,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface SessionPreviewProps {
  patternName: string;
  pattern: {
    name: string;
    phases: {
      inhale: number;
      hold?: number;
      exhale: number;
      pause?: number;
    };
    benefits?: string[];
    description?: string;
  };
  onStart: (cameraEnabled: boolean) => void;
  onCancel?: () => void;
  enableCamera: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  landmarks?: Array<{ x: number; y: number; z?: number }>;
  trackingStatus?: 'INITIALIZING' | 'TRACKING' | 'LOST';
}

export const SessionPreview: React.FC<SessionPreviewProps> = ({
  patternName,
  pattern,
  onStart,
  onCancel,
  enableCamera,
  videoRef,
  landmarks = [],
  trackingStatus = 'INITIALIZING',
}) => {
  const [previewStep, setPreviewStep] = useState<
    "benefits" | "intro" | "setup" | "countdown" | "ready"
  >("benefits");
  
  const [countdown, setCountdown] = useState(5);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [isInitializingUI, setIsInitializingUI] = useState(false);
  const [cameraErrorState, setCameraErrorState] = useState<string | null>(null);
  
  // Camera context
  const { 
    stream: cameraStream, 
    status: cameraStatus, 
    error: cameraError,
    requestStream: requestCameraStream,
    hasPermission
  } = useCamera();
  
  // Auto-start camera setup in background if enabled
  const hasStartedCameraSetup = useRef(false);
  
  useEffect(() => {
    if (enableCamera && !hasStartedCameraSetup.current) {
      hasStartedCameraSetup.current = true;
      // Start camera setup in background to improve perceived performance
      requestCameraStream().catch(() => {
        // Silently handle camera errors during background setup
        console.log("Background camera setup failed, will prompt if needed");
      });
    }
  }, [enableCamera, requestCameraStream]);

  // Handle countdown
  useEffect(() => {
    if (previewStep === "countdown" && isCountingDown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (previewStep === "countdown" && countdown === 0) {
      setPreviewStep("ready");
      // Auto-start after a brief pause
      setTimeout(() => {
        onStart(!!cameraStream);
      }, 500);
    }
  }, [previewStep, countdown, isCountingDown, cameraStream, onStart]);

  // Sync camera context error with local state
  useEffect(() => {
    if (cameraError) {
      setCameraErrorState(cameraError);
    }
  }, [cameraError]);

  const handleProceedToIntro = () => {
    setPreviewStep("intro");
  };

  const handleBeginSetup = () => {
    if (enableCamera) {
      setPreviewStep("setup");
    } else {
      handleBeginPreparation();
    }
  };

  const handleBeginPreparation = () => {
    setPreviewStep("countdown");
    setIsCountingDown(true);
  };

  const handleSkipPreparation = () => {
    onStart(!!cameraStream);
  };

  const handleRequestCamera = async () => {
    try {
      setIsInitializingUI(true);
      setCameraErrorState(null);

      const stream = await requestCameraStream();
      
      if (stream && videoRef.current) {
        // Attach stream to video element
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        
        // Ensure video is playing
        await new Promise<void>((resolve) => {
          const checkReady = () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              resolve();
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
        });
        
        // Try to play the video
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn("Video play failed:", playError);
        }
      }
      
      // Move to preparation phase
      handleBeginPreparation();
    } catch (error) {
      console.error("Camera setup failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to initialize camera. Please check permissions and try again.";
      setCameraErrorState(errorMessage);
    } finally {
      setIsInitializingUI(false);
    }
  };

  // Benefits view
  if (previewStep === "benefits") {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 space-y-8 animate-fade-in">
        <div className="text-center space-y-4 max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="text-2xl font-bold text-primary">
            {patternName} Benefits
          </h2>
          
          <p className="text-muted-foreground leading-relaxed">
            {pattern.description || 'A powerful breathing technique for wellness'}
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
          {(pattern.benefits || ['Stress reduction', 'Improved focus']).map((benefit, index) => {
            const IconComponent = BENEFIT_ICONS[benefit.toLowerCase()] || Heart;
            return (
              <Card key={index} className="border border-green-200/50 bg-gradient-to-r from-green-50 to-blue-50 hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-3 p-4">
                  <IconComponent className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-green-800">{benefit}</span>
                  <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Time to benefit */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Benefits start in 30-60 seconds</span>
          </div>
          <Badge variant="outline" className="bg-white/80">
            No experience needed
          </Badge>
        </div>

        {/* Action */}
        <div className="space-y-3">
          <Button
            onClick={handleProceedToIntro}
            size="lg"
            className="w-48 rounded-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg transition-all duration-300"
          >
            I'm Ready to Try This
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button
            onClick={handleSkipPreparation}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Skip to Session
          </Button>
        </div>
      </div>
    );
  }

  // Intro view
  if (previewStep === "intro") {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center space-y-8 animate-fade-in">
        <div className="space-y-4 max-w-md">
          <h2 className="text-2xl font-light text-primary">
            Prepare for {patternName}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Find a comfortable position and take a moment to settle in. When
            you're ready, we'll begin with a gentle countdown.
          </p>
        </div>

        {/* Pattern preview */}
        <div className="space-y-4">
          <BreathingAnimation
            phase="prepare"
            pattern={pattern}
            isActive={false}
          />
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              Pattern: {pattern.phases.inhale}s in • {pattern.phases.hold || 0}s
              hold • {pattern.phases.exhale}s out • {pattern.phases.pause || 0}s
              rest
            </p>
            <p className="text-xs opacity-70">
              Follow the visual guide and breathe naturally
            </p>
          </div>
        </div>

        {/* Camera enhancement info (if enabled) */}
        {enableCamera && (
          <Card className="border border-blue-200/50 bg-gradient-to-r from-blue-50 to-indigo-50 w-full max-w-md">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Camera className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800">Enhanced Session</h3>
                  <p className="text-sm text-blue-600 mt-1">
                    We'll use your camera to provide real-time feedback on your breathing 
                    technique and stillness level for a more personalized experience.
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-blue-500">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span>
                      {hasPermission ? 'Camera ready' : 'Permission needed'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleBeginSetup}
            size="lg"
            className="w-48 rounded-full bg-primary/90 hover:bg-primary text-white shadow-lg transition-all duration-300"
          >
            {enableCamera ? "Setup Camera & Begin" : "Begin Preparation"}
          </Button>
          <Button
            onClick={handleSkipPreparation}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Start Immediately
          </Button>
        </div>
      </div>
    );
  }

  // Camera setup view
  if (previewStep === "setup" && enableCamera) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center w-full relative animate-fade-in p-4 text-center">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Camera Setup</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Position your face in the center of the video feed. This allows us to
            measure your stillness and focus during the session.
          </p>
        </div>

        <div className="w-64 h-48 md:w-96 md:h-72 relative rounded-lg overflow-hidden shadow-lg bg-black flex items-center justify-center">
          {cameraStream ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center text-muted-foreground">
              {cameraStatus === 'requesting' ? (
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              ) : cameraStatus === 'permission-denied' ? (
                <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
              ) : (
                <Camera className="h-8 w-8 mx-auto opacity-50" />
              )}
              <p className="mt-2 text-sm">
                {cameraStatus === 'requesting' ? 'Accessing camera...' : 
                 cameraStatus === 'permission-denied' ? 'Camera access denied' : 
                 'Camera preview'}
              </p>
              {cameraStatus === 'permission-denied' && (
                <p className="text-xs mt-1 opacity-70">
                  Please enable camera permissions in your browser settings
                </p>
              )}
            </div>
          )}
        </div>

        {cameraErrorState && (
          <div className="mt-4 p-3 bg-destructive/20 text-destructive rounded-md max-w-md flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{cameraErrorState}</span>
          </div>
        )}

        <div className="mt-8 space-y-3">
          <Button
            onClick={handleRequestCamera}
            size="lg"
            className="w-48"
            disabled={isInitializingUI || cameraStatus === 'requesting'}
          >
            {isInitializingUI && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Camera className="mr-2 h-4 w-4" />
            {isInitializingUI ? "Initializing..." : 
             cameraStatus === 'permission-denied' ? "Retry Camera Access" : "Enable Camera"}
          </Button>
          
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleBeginPreparation}
              variant="outline"
              size="sm"
              className="text-muted-foreground"
            >
              Continue Without Camera
            </Button>
            <Button
              onClick={onCancel}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Camera status indicator */}
        <div className="mt-6 flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${
            cameraStatus === 'active' ? 'bg-green-500' : 
            cameraStatus === 'requesting' ? 'bg-yellow-500' : 
            cameraStatus === 'permission-denied' ? 'bg-destructive' : 'bg-gray-300'
          }`} />
          <span className="text-muted-foreground">
            {cameraStatus === 'active' ? 'Camera active' : 
             cameraStatus === 'requesting' ? 'Requesting access...' : 
             cameraStatus === 'permission-denied' ? 'Access denied' : 
             'Camera ready'}
          </span>
        </div>
      </div>
    );
  }

  // Countdown view
  if (previewStep === "countdown") {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center space-y-8">
        {/* Calming countdown */}
        <div className="space-y-6">
          <p className="text-lg text-muted-foreground font-light">
            Take a deep breath and relax...
          </p>

          <BreathingAnimation
            phase="countdown"
            countdownValue={countdown}
            pattern={pattern}
            isActive={false}
          />

          <p className="text-sm text-muted-foreground">
            {countdown > 0 ? "Starting in..." : "Let's begin"}
          </p>
        </div>

        {/* Cancel option during countdown */}
        {countdown > 1 && (
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="text-muted-foreground/70 hover:text-muted-foreground transition-colors"
          >
            Cancel
          </Button>
        )}
      </div>
    );
  }

  // Ready view
  if (previewStep === "ready") {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="space-y-4">
          <div
            className={cn(
              "w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto",
              "animate-pulse"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-green-500"></div>
          </div>
          <p className="text-xl font-light text-green-600">Ready to begin</p>
        </div>
      </div>
    );
  }

  return null;
};

const BENEFIT_ICONS: Record<string, React.ElementType> = {
  'stress reduction': Heart,
  'improved focus': Focus,
  'mental clarity': Brain,
  'anxiety relief': Heart,
  'better sleep': Moon,
  'relaxation': Heart,
  'energy increase': Zap,
  'energy boost': Zap,
  'increased alertness': Zap,
  'morning activation': Zap,
  'improved sleep quality': Moon,
  'reduced insomnia': Moon,
  'evening relaxation': Moon,
  'meditation support': Brain,
  'present moment awareness': Brain,
  'anxiety reduction': Heart,
  'immune system boost': Zap,
  'cold tolerance': Zap
};