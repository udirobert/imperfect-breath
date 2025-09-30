import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Mail,
  Users,
  Palette,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Heart,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: string;
  completed: boolean;
  optional?: boolean;
  emotionalState?: "calm" | "focused" | "energized" | "peaceful";
}

interface ProgressiveOnboardingProps {
  onComplete?: () => void;
  className?: string;
}

export const ProgressiveOnboarding: React.FC<ProgressiveOnboardingProps> = ({
  onComplete,
  className,
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  // ENHANCEMENT: Subtle haptic feedback for premium interactions (PERFORMANT)
  const triggerStepHaptic = (type: "gentle" | "subtle" = "gentle") => {
    if ("vibrate" in navigator) {
      switch (type) {
        case "subtle":
          navigator.vibrate([15]); // Minimal, refined feedback
          break;
        default:
          navigator.vibrate([25]); // Gentle confirmation
      }
    }
  };

  // ENHANCEMENT: Elegant step completion feedback
  const celebrateStepCompletion = useCallback((stepTitle: string) => {
    triggerStepHaptic("subtle");
    toast.success(`${stepTitle} completed`, {
      duration: 2500,
      style: {
        background: "rgba(248, 250, 252, 0.95)",
        border: "1px solid #e2e8f0",
        color: "#334155",
        fontSize: "14px",
        fontWeight: "500",
      },
    });
  }, []);

  // Check if user has completed first session
  const hasCompletedSession =
    localStorage.getItem("hasCompletedSession") === "true";

  // ENHANCEMENT: Personality detection for adaptive onboarding (MODULAR)
  const getPersonalityBasedContent = (
    stepId: string,
    emotionalState?: "calm" | "focused" | "energized" | "peaceful",
  ) => {
    const personalityMap = {
      calm: {
        practice: {
          title: "Begin Your Peaceful Journey",
          description:
            "Experience gentle, guided breathing in a serene environment",
          tone: "soothing",
        },
        signup: {
          title: "Preserve Your Inner Peace",
          description: "Save your progress and continue your mindful journey",
          tone: "gentle",
        },
      },
      focused: {
        practice: {
          title: "Sharpen Your Focus",
          description:
            "Use structured breathing to enhance concentration and clarity",
          tone: "precise",
        },
        signup: {
          title: "Track Your Progress",
          description: "Monitor your breathing practice and achieve your goals",
          tone: "methodical",
        },
      },
      energized: {
        practice: {
          title: "Ignite Your Energy",
          description:
            "Dynamic breathing patterns to boost vitality and motivation",
          tone: "vibrant",
        },
        signup: {
          title: "Fuel Your Journey",
          description: "Keep the momentum going with personalized tracking",
          tone: "dynamic",
        },
      },
      peaceful: {
        practice: {
          title: "Find Your Center",
          description: "Deep breathing for ultimate relaxation and tranquility",
          tone: "serene",
        },
        signup: {
          title: "Maintain Your Harmony",
          description: "Continue your path to inner peace with guided practice",
          tone: "harmonious",
        },
      },
    };

    const defaultContent = {
      practice: {
        title: "Try Your First Session",
        description:
          "Experience 5 minutes of guided breathing - no signup required",
        tone: "neutral",
      },
      signup: {
        title: "Save Your Progress",
        description: "Create an account to track your breathing journey",
        tone: "neutral",
      },
    };

    return emotionalState &&
      personalityMap[emotionalState]?.[
        stepId as keyof typeof personalityMap.calm
      ]
      ? personalityMap[emotionalState][
          stepId as keyof typeof personalityMap.calm
        ]
      : defaultContent[stepId as keyof typeof defaultContent];
  };

  const steps: OnboardingStep[] = useMemo(
    () => [
      {
        id: "practice",
        ...getPersonalityBasedContent("practice", "calm"),
        icon: Play,
        action: "Start Practice",
        completed: hasCompletedSession,
        emotionalState: "calm",
      },
      {
        id: "signup",
        ...getPersonalityBasedContent("signup", "focused"),
        icon: Mail,
        action: isAuthenticated ? "✓ Signed In" : "Sign Up",
        completed: isAuthenticated,
        emotionalState: "focused",
      },
      {
        id: "social",
        title: "Join Our Thriving Community",
        description:
          "Join 1,200+ practitioners who stay consistent 3x longer with community support. Share victories, get encouragement, and discover new techniques together.",
        icon: Users,
        action: "Join Community",
        completed: false,
        optional: false,
        emotionalState: "peaceful",
      },
      {
        id: "create",
        title: "Share Your Wisdom",
        description:
          "Create custom breathing patterns for the community and earn rewards from your wellness expertise",
        icon: Palette,
        action: "Start Creating",
        completed: false,
        optional: true,
        emotionalState: "energized",
      },
    ],
    [hasCompletedSession, isAuthenticated],
  );

  const completedSteps = steps.filter((step) => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  // Auto-advance to next incomplete step with celebration
  useEffect(() => {
    const nextIncompleteStep = steps.findIndex((step) => !step.completed);
    if (nextIncompleteStep !== -1 && nextIncompleteStep !== currentStep) {
      // If we're moving forward, celebrate the completed step
      if (nextIncompleteStep > currentStep && currentStep >= 0) {
        const completedStep = steps[currentStep];
        if (completedStep?.completed) {
          setTimeout(() => {
            celebrateStepCompletion(completedStep.title);
          }, 500);
        }
      }
      setCurrentStep(nextIncompleteStep);
    }
  }, [steps, currentStep, celebrateStepCompletion]);

  const handleStepAction = (step: OnboardingStep) => {
    switch (step.id) {
      case "practice":
        navigate("/session");
        break;
      case "signup":
        if (!isAuthenticated) {
          navigate("/auth");
        }
        break;
      case "social": {
        // Add context for community onboarding
        const searchParams = new URLSearchParams();
        searchParams.set("welcome", "true");
        searchParams.set("source", "onboarding");
        navigate(`/community?${searchParams.toString()}`);
        break;
      }
      case "create":
        navigate("/create");
        break;
    }
  };

  const handleSkip = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className={cn("max-w-md mx-auto space-y-6", className)}>
      {/* Progress Header - Elegant & Refined */}
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">
            Welcome to Imperfect Breath
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Begin your mindful breathing journey with gentle guidance
          </p>
        </div>
        <div className="space-y-3">
          <div className="relative">
            <Progress
              value={progress}
              className="h-2 bg-slate-100 rounded-full overflow-hidden"
            />
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-slate-400 to-slate-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Step {currentStep + 1} of {steps.length}
            </span>
            {progress === 100 && (
              <span className="text-slate-700 font-medium">Ready to begin</span>
            )}
          </div>
        </div>
      </div>

      {/* Current Step - Premium Card Design */}
      <Card className="border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-500">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-4 relative">
            {React.createElement(steps[currentStep]?.icon, {
              className: "h-6 w-6 text-slate-600",
            })}
            {steps[currentStep]?.completed && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-xl font-medium text-slate-800 tracking-tight">
            {steps[currentStep]?.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            {steps[currentStep]?.description}
          </p>

          {/* Community-specific social proof - Refined */}
          {steps[currentStep]?.id === "social" && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-slate-700">
                <Users className="h-4 w-4" />
                <span className="font-medium">Community Benefits</span>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                  <span>3x higher consistency with peer support</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                  <span>Access to expert breathing techniques</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                  <span>Encouragement from fellow practitioners</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => {
                triggerStepHaptic("gentle");
                handleStepAction(steps[currentStep]);
              }}
              disabled={steps[currentStep]?.completed}
              className={cn(
                "w-full transition-all duration-300",
                steps[currentStep]?.completed
                  ? "bg-slate-700 hover:bg-slate-800 text-white"
                  : "bg-slate-800 hover:bg-slate-900 text-white",
              )}
              size="lg"
            >
              {steps[currentStep]?.completed ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Completed</span>
                </>
              ) : (
                <>
                  <span>{steps[currentStep]?.action}</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            {steps[currentStep]?.optional && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="w-full text-slate-500 hover:text-slate-700"
              >
                Skip for now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step Overview - Minimal & Elegant */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
              index === currentStep
                ? "bg-slate-50 border border-slate-200"
                : step.completed
                  ? "bg-slate-25 border border-slate-100"
                  : "bg-white",
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                step.completed
                  ? "bg-slate-700 text-white"
                  : index === currentStep
                    ? "bg-slate-100 text-slate-700 ring-2 ring-slate-200"
                    : "bg-slate-50 text-slate-400",
              )}
            >
              {step.completed ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                React.createElement(step.icon, {
                  className: "h-3 w-3",
                })
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm transition-colors duration-200",
                  step.completed && "text-slate-700 font-medium",
                  index === currentStep && "text-slate-800 font-medium",
                  index > currentStep && "text-slate-500",
                )}
              >
                {step.title}
              </p>
              {step.optional && (
                <p className="text-xs text-slate-400">Optional</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Skip All - Refined */}
      {completedSteps < steps.length && (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => {
              triggerStepHaptic("subtle");
              handleSkip();
            }}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors duration-300"
          >
            Skip onboarding
          </Button>
        </div>
      )}

      {/* Completion - Elegant Confirmation */}
      {progress === 100 && (
        <div className="text-center p-6 bg-slate-50 rounded-lg border border-slate-200">
          <div className="w-8 h-8 mx-auto mb-3 bg-slate-700 rounded-full flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-medium text-slate-800 mb-1">Ready to Begin</h3>
          <p className="text-sm text-slate-600">
            Your mindful breathing journey awaits
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgressiveOnboarding;
