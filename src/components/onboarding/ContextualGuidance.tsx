/**
 * Contextual Guidance System - Progressive Disclosure for Better UX
 * 
 * ENHANCEMENT FIRST: Enhances existing SessionEntryPoints with contextual education
 * CLEAN: Separates guidance logic from session logic
 * MODULAR: Reusable across different entry points
 * WELLNESS UX: Builds confidence before action
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { 
  Heart, 
  Brain, 
  Clock, 
  Target, 
  CheckCircle, 
  ArrowRight,
  Lightbulb,
  Timer,
  Zap
} from "lucide-react";
import { cn } from "../../lib/utils";

interface GuidanceStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  benefit: string;
  timeToValue: string;
  confidence: number; // 1-5 scale
}

interface ContextualGuidanceProps {
  sessionType: "classic" | "enhanced";
  onProceed: () => void;
  onBack?: () => void;
  className?: string;
}

export const ContextualGuidance: React.FC<ContextualGuidanceProps> = ({
  sessionType,
  onProceed,
  onBack,
  className
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userConfidence, setUserConfidence] = useState(1);

  const guidanceSteps: GuidanceStep[] = sessionType === "classic" ? [
    {
      id: "what",
      title: "What You'll Do",
      description: "Follow a simple 4-second breathing rhythm: breathe in for 4, hold for 4, breathe out for 4, pause for 4. That's it.",
      icon: Heart,
      benefit: "Immediate calm",
      timeToValue: "30 seconds",
      confidence: 5
    },
    {
      id: "why",
      title: "Why It Works",
      description: "This activates your parasympathetic nervous system - your body's natural 'rest and digest' mode. It's like a reset button for stress.",
      icon: Brain,
      benefit: "Stress reduction",
      timeToValue: "2 minutes",
      confidence: 4
    },
    {
      id: "how",
      title: "How to Succeed",
      description: "Just breathe naturally and follow the visual guide. Don't worry about perfection - even 'imperfect' breathing brings benefits.",
      icon: Target,
      benefit: "Guaranteed success",
      timeToValue: "Right now",
      confidence: 5
    }
  ] : [
    {
      id: "what",
      title: "Enhanced Experience",
      description: "Everything from classic mode, plus AI-powered feedback using your camera to help you improve posture and breathing technique.",
      icon: Zap,
      benefit: "Personalized coaching",
      timeToValue: "1 minute",
      confidence: 4
    },
    {
      id: "privacy",
      title: "Your Privacy Protected",
      description: "All video processing happens on your device. Nothing is recorded, stored, or transmitted. Your practice stays completely private.",
      icon: CheckCircle,
      benefit: "Complete privacy",
      timeToValue: "Always",
      confidence: 5
    },
    {
      id: "benefits",
      title: "What You'll Gain",
      description: "Real-time posture feedback, breathing rhythm guidance, and personalized insights to accelerate your progress.",
      icon: Brain,
      benefit: "Faster improvement",
      timeToValue: "First session",
      confidence: 4
    }
  ];

  const currentGuidance = guidanceSteps[currentStep];
  const progress = ((currentStep + 1) / guidanceSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < guidanceSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setUserConfidence(Math.min(5, userConfidence + currentGuidance.confidence / guidanceSteps.length));
    } else {
      onProceed();
    }
  };

  const handleSkip = () => {
    onProceed();
  };

  return (
    <div className={cn("max-w-lg mx-auto space-y-6", className)}>
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Understanding your session</span>
          <span className="text-sm text-muted-foreground">
            {currentStep + 1} of {guidanceSteps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Main guidance card */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mb-4">
            {React.createElement(currentGuidance.icon, {
              className: "h-8 w-8 text-primary"
            })}
          </div>
          <CardTitle className="text-xl">{currentGuidance.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground leading-relaxed text-center">
            {currentGuidance.description}
          </p>

          {/* Benefit highlight */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">{currentGuidance.benefit}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Timer className="h-3 w-3" />
                <span>{currentGuidance.timeToValue}</span>
              </div>
            </div>
          </div>

          {/* Confidence indicator */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Confidence:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    level <= Math.round(userConfidence) 
                      ? "bg-green-500" 
                      : "bg-gray-200"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {currentStep < guidanceSteps.length - 1 ? (
              <>
                <Button variant="outline" onClick={handleSkip} className="flex-1">
                  Skip Guide
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onBack} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1 bg-green-600 hover:bg-green-700">
                  Start Session
                  <Heart className="h-4 w-4 ml-2" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick preview of upcoming steps */}
      {currentStep < guidanceSteps.length - 1 && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Coming up: {guidanceSteps[currentStep + 1].title}
          </p>
        </div>
      )}
    </div>
  );
};

export default ContextualGuidance;