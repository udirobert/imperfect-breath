import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import BreathingAnimation from "../BreathingAnimation";
import { cn } from "../../lib/utils";

interface PreparationPhaseProps {
  patternName: string;
  pattern: {
    name: string;
    phases: {
      inhale: number;
      hold?: number;
      exhale: number;
      pause?: number;
    };
  };
  onStart: () => void;
  onCancel?: () => void;
}

export const PreparationPhase: React.FC<PreparationPhaseProps> = ({
  patternName,
  pattern,
  onStart,
  onCancel,
}) => {
  const [preparationStep, setPreparationStep] = useState<
    "intro" | "countdown" | "ready"
  >("intro");
  const [countdown, setCountdown] = useState(5);
  const [isCountingDown, setIsCountingDown] = useState(false);

  // Handle countdown
  useEffect(() => {
    if (preparationStep === "countdown" && isCountingDown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (preparationStep === "countdown" && countdown === 0) {
      setPreparationStep("ready");
      // Auto-start after a brief pause
      setTimeout(() => {
        onStart();
      }, 500);
    }
  }, [preparationStep, countdown, isCountingDown, onStart]);

  const handleBeginPreparation = () => {
    setPreparationStep("countdown");
    setIsCountingDown(true);
  };

  const handleSkipPreparation = () => {
    onStart();
  };

  if (preparationStep === "intro") {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center space-y-8 animate-fade-in">
        {/* Gentle introduction */}
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

        {/* Gentle action buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleBeginPreparation}
            size="lg"
            className="w-48 rounded-full bg-primary/90 hover:bg-primary text-white shadow-lg transition-all duration-300"
          >
            Begin Preparation
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

  if (preparationStep === "countdown") {
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

  if (preparationStep === "ready") {
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
