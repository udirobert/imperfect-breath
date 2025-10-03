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
    "benefits" | "setup" | "preview"
  >("benefits");
  
  const [isInitializingUI, setIsInitializingUI] = useState(false);
  const [cameraErrorState, setCameraErrorState] = useState<string | null>(null);
  const [cameraRetryCount, setCameraRetryCount] = useState(0);
  const [showClassicFallback, setShowClassicFallback] = useState(false);
  
  // Camera context
  const { 
    stream: cameraStream, 
    status: cameraStatus, 
    error: cameraError,
    requestStream: requestCameraStream,
    hasPermission
  } = useCamera();
  
  
  // AGGRESSIVE CONSOLIDATION: Remove background camera setup to prevent conflicts
  // Camera setup now happens explicitly when user chooses to proceed

  // AGGRESSIVE CONSOLIDATION: Removed countdown logic - direct transition to session

  // Sync camera context error with local state
  useEffect(() => {
    if (cameraError) {
      setCameraErrorState(cameraError);
    }
  }, [cameraError]);

  // CLEAN: Simplified navigation handlers
  const handleProceedFromBenefits = () => {
    if (enableCamera) {
      setPreviewStep("setup");
    } else {
      setPreviewStep("preview");
    }
  };

  const handleCameraSetupComplete = () => {
    setPreviewStep("preview");
  };

  const handleStartSession = () => {
    onStart(!!cameraStream);
  };

  const handleUseClassicMode = () => {
    // Switch to classic mode - camera not required
    onStart(false);
  };

  // ENHANCEMENT FIRST: Enhanced camera setup with retry logic
  const handleRequestCamera = async () => {
    try {
      setIsInitializingUI(true);
      setCameraErrorState(null);

      const stream = await requestCameraStream();
      
      if (stream && videoRef.current) {
        // Ensure video element has the correct attributes
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        
        console.log('✅ Camera setup successful, proceeding to preview');
        // Success - move to pattern preview
        handleCameraSetupComplete();
      } else {
        throw new Error('Camera stream not available');
      }
    } catch (error) {
      console.error("Camera setup failed:", error);
      const newRetryCount = cameraRetryCount + 1;
      setCameraRetryCount(newRetryCount);
      
      let errorMessage = "Camera setup failed. ";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera and try again.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application.';
        }
      }
      
      setCameraErrorState(errorMessage);
      
      // Show classic mode fallback after 2 failed attempts
      if (newRetryCount >= 2) {
        setShowClassicFallback(true);
      }
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
            onClick={handleProceedFromBenefits}
            size="lg"
            className="w-48 rounded-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg transition-all duration-300"
          >
            I'm Ready to Try This
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button
            onClick={handleStartSession}
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

  // AGGRESSIVE CONSOLIDATION: Removed intro stage - consolidated into preview stage

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

        <div className="mt-8 space-y-4">
          {/* Primary camera action */}
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
             cameraRetryCount > 0 ? `Retry Camera (${cameraRetryCount}/2)` : "Enable Camera"}
          </Button>
          
          {/* Enhanced fallback options */}
          <div className="flex flex-col gap-2 items-center">
            <Button
              onClick={handleCameraSetupComplete}
              variant="outline"
              size="sm"
              className="text-muted-foreground"
            >
              Continue Without Camera
            </Button>
            
            {/* Show classic mode option after failed attempts */}
            {showClassicFallback && (
              <div className="text-center space-y-2 mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  Having trouble with camera setup?
                </p>
                <Button
                  onClick={handleUseClassicMode}
                  variant="outline"
                  size="sm"
                  className="bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
                >
                  Switch to Classic Mode
                </Button>
              </div>
            )}
            
            <Button
              onClick={onCancel}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
            >
              Cancel Session
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

  // ENHANCEMENT FIRST: Consolidated preview stage (replaces intro + countdown + ready)
  if (previewStep === "preview") {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center space-y-8 animate-fade-in">
        <div className="space-y-4 max-w-md">
          <h2 className="text-2xl font-light text-primary">
            Ready for {patternName}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Find a comfortable position. When you're ready, we'll begin your enhanced breathing session.
          </p>
        </div>

        {/* Pattern preview with camera status */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            {/* Camera preview (if available) */}
            {enableCamera && cameraStream && (
              <div className="w-24 h-18 rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Breathing animation */}
            <BreathingAnimation
              phase="prepare"
              pattern={pattern}
              isActive={false}
            />
          </div>
          
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

        {/* Enhanced session status */}
        {enableCamera && (
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              cameraStream ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            <span className="text-muted-foreground">
              {cameraStream ? 'Enhanced feedback active' : 'Classic mode active'}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleStartSession}
            size="lg"
            className="w-48 rounded-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg transition-all duration-300"
          >
            Start Session
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Cancel
          </Button>
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
