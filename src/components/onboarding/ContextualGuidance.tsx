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
  Zap,
  Sparkles,
  Star,
  Shield,
  Play,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

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
  className,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userConfidence, setUserConfidence] = useState(1);

  // ENHANCEMENT: Subtle haptic feedback for premium interactions
  const triggerHaptic = (type: "subtle" | "gentle" = "subtle") => {
    if ("vibrate" in navigator) {
      switch (type) {
        case "gentle":
          navigator.vibrate([25]);
          break;
        default:
          navigator.vibrate([15]); // Minimal, refined feedback
      }
    }
  };

  const guidanceSteps: GuidanceStep[] =
    sessionType === "classic"
      ? [
          {
            id: "what",
            title: "What You'll Do",
            description:
              "Follow a simple 4-second breathing rhythm: breathe in for 4, hold for 4, breathe out for 4, pause for 4. That's it.",
            icon: Heart,
            benefit: "Immediate calm",
            timeToValue: "30 seconds",
            confidence: 5,
          },
          {
            id: "why",
            title: "Why It Works",
            description:
              "This activates your parasympathetic nervous system - your body's natural 'rest and digest' mode. It's like a reset button for stress.",
            icon: Brain,
            benefit: "Stress reduction",
            timeToValue: "2 minutes",
            confidence: 4,
          },
          {
            id: "how",
            title: "How to Succeed",
            description:
              "Just breathe naturally and follow the visual guide. Don't worry about perfection - even 'imperfect' breathing brings benefits.",
            icon: Target,
            benefit: "Guaranteed success",
            timeToValue: "Right now",
            confidence: 5,
          },
        ]
      : [
          {
            id: "what",
            title: "Enhanced Experience",
            description:
              "Everything from classic mode, plus AI-powered feedback using your camera to help you improve posture and breathing technique.",
            icon: Zap,
            benefit: "Personalized coaching",
            timeToValue: "1 minute",
            confidence: 4,
          },
          {
            id: "privacy",
            title: "Your Privacy Protected",
            description:
              "All video processing happens on your device. Nothing is recorded, stored, or transmitted. Your practice stays completely private.",
            icon: CheckCircle,
            benefit: "Complete privacy",
            timeToValue: "Always",
            confidence: 5,
          },
          {
            id: "benefits",
            title: "What You'll Gain",
            description:
              "Real-time posture feedback, breathing rhythm guidance, and personalized insights to accelerate your progress.",
            icon: Brain,
            benefit: "Faster improvement",
            timeToValue: "First session",
            confidence: 4,
          },
        ];

  const currentGuidance = guidanceSteps[currentStep];
  const progress = ((currentStep + 1) / guidanceSteps.length) * 100;

  // ENHANCEMENT: Update confidence smoothly
  useEffect(() => {
    const newConfidence = Math.min(
      5,
      userConfidence + currentGuidance.confidence / guidanceSteps.length,
    );
    setUserConfidence(newConfidence);
  }, [
    currentStep,
    currentGuidance.confidence,
    guidanceSteps.length,
    userConfidence,
  ]);

  const handleNext = () => {
    triggerHaptic("gentle");
    if (currentStep < guidanceSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onProceed();
    }
  };

  const handleSkip = () => {
    triggerHaptic("subtle");
    onProceed();
  };

  return (
    <div className={cn("max-w-lg mx-auto space-y-6", className)}>
      {/* Progress indicator - Refined */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-slate-700">
            Preparing your session
          </span>
          <span className="text-sm text-slate-500">
            {currentStep + 1} of {guidanceSteps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2 bg-slate-100" />
      </div>

      {/* Main guidance card - Premium Design */}
      <Card className="border border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-500">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            {React.createElement(currentGuidance.icon, {
              className: "h-7 w-7 text-slate-600",
            })}
          </div>
          <CardTitle className="text-xl font-medium text-slate-800 tracking-tight">
            {currentGuidance.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-slate-600 leading-relaxed text-center">
            {currentGuidance.description}
          </p>

          {/* Benefit highlight - Refined */}
          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <Lightbulb className="h-4 w-4 text-slate-500" />
              <span className="font-medium text-slate-800">
                {currentGuidance.benefit}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Timer className="h-3 w-3" />
              <span>{currentGuidance.timeToValue}</span>
            </div>
          </div>

          {/* Enhanced session features - Subtle indicators */}
          {sessionType === "enhanced" && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <Shield className="h-4 w-4 text-slate-600" />
                <span className="text-slate-700 font-medium">Private</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <Zap className="h-4 w-4 text-slate-600" />
                <span className="text-slate-700 font-medium">AI Guided</span>
              </div>
            </div>
          )}

          {/* Confidence indicator - Minimal */}
          <div className="flex items-center justify-center gap-3 p-3 bg-slate-50 rounded-lg">
            <span className="text-sm text-slate-600">Readiness:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    level <= Math.round(userConfidence)
                      ? "bg-slate-600"
                      : "bg-slate-300",
                  )}
                />
              ))}
            </div>
          </div>

          {/* Actions - Refined */}
          <div className="flex gap-3 pt-4">
            {currentStep < guidanceSteps.length - 1 ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Skip Guide
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 text-white"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-medium"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Begin Session
                  <Heart className="h-4 w-4 ml-2" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview of upcoming steps - Subtle */}
      {currentStep < guidanceSteps.length - 1 && (
        <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-sm text-slate-600">
            Next: {guidanceSteps[currentStep + 1].title}
          </span>
        </div>
      )}

      {/* Completion message - Elegant */}
      {currentStep === guidanceSteps.length - 1 && (
        <div className="text-center p-5 bg-slate-50 rounded-lg border border-slate-200">
          <div className="w-8 h-8 mx-auto mb-3 bg-slate-800 rounded-full flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-white" />
          </div>
          <p className="font-medium text-slate-800 mb-1">Ready to Begin</p>
          <p className="text-sm text-slate-600">
            You're prepared for a mindful breathing session
          </p>
        </div>
      )}
    </div>
  );
};

export default ContextualGuidance;
