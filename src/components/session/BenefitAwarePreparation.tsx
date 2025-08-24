/**
 * Benefit-Aware Preparation Phase - Enhanced PreparationPhase
 * 
 * ENHANCEMENT FIRST: Builds on existing PreparationPhase with benefit education
 * CLEAN: Separates benefit communication from session mechanics
 * WELLNESS UX: Builds motivation and understanding before practice
 */

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import BreathingAnimation from "../BreathingAnimation";
import { 
  Heart, 
  Brain, 
  Zap, 
  Moon, 
  Focus, 
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { cn } from "../../lib/utils";
import { BREATHING_PATTERNS } from "../../lib/breathingPatterns";

interface BenefitAwarePreparationProps {
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
  showBenefitEducation?: boolean;
}

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

export const BenefitAwarePreparation: React.FC<BenefitAwarePreparationProps> = ({
  patternName,
  pattern,
  onStart,
  onCancel,
  showBenefitEducation = true
}) => {
  const [preparationStep, setPreparationStep] = useState<
    "benefits" | "setup" | "countdown" | "ready"
  >(showBenefitEducation ? "benefits" : "setup");
  const [countdown, setCountdown] = useState(5);
  const [isCountingDown, setIsCountingDown] = useState(false);

  // Get pattern benefits
  const patternData = BREATHING_PATTERNS[patternName.toLowerCase().replace(/\s+/g, '_')] || 
                     Object.values(BREATHING_PATTERNS).find(p => 
                       p.name.toLowerCase() === patternName.toLowerCase()
                     );
  
  const benefits = patternData?.benefits || ['Stress reduction', 'Improved focus'];
  const description = patternData?.description || 'A powerful breathing technique for wellness';

  // Handle countdown
  useEffect(() => {
    if (preparationStep === "countdown" && isCountingDown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (preparationStep === "countdown" && countdown === 0) {
      setPreparationStep("ready");
      setTimeout(() => {
        onStart();
      }, 500);
    }
  }, [preparationStep, countdown, isCountingDown, onStart]);

  const handleProceedToSetup = () => {
    setPreparationStep("setup");
  };

  const handleBeginPreparation = () => {
    setPreparationStep("countdown");
    setIsCountingDown(true);
  };

  const handleSkipPreparation = () => {
    onStart();
  };

  // Benefits education step
  if (preparationStep === "benefits") {
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
            {description}
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
          {benefits.map((benefit, index) => {
            const IconComponent = BENEFIT_ICONS[benefit.toLowerCase()] || Heart;
            return (
              <Card key={index} className="border border-green-200/50 bg-gradient-to-r from-green-50 to-blue-50">
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
            onClick={handleProceedToSetup}
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

  // Setup step (enhanced version of original intro)
  if (preparationStep === "setup") {
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

        {/* Pattern preview with enhanced info */}
        <div className="space-y-4">
          <BreathingAnimation
            phase="prepare"
            pattern={pattern}
            isActive={false}
          />
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Pattern: {pattern.phases.inhale}s in • {pattern.phases.hold || 0}s
              hold • {pattern.phases.exhale}s out • {pattern.phases.pause || 0}s
              rest
            </p>
            <div className="flex items-center justify-center gap-2 text-xs">
              <Heart className="h-3 w-3 text-green-500" />
              <span className="text-green-600 font-medium">
                Just follow the visual guide - your body knows what to do
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
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

  // Countdown step (unchanged from original)
  if (preparationStep === "countdown") {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center space-y-8">
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

  // Ready step (unchanged from original)
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

export default BenefitAwarePreparation;