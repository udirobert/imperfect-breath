import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  // ENHANCEMENT: Haptic feedback for step completion (PERFORMANT)
  const triggerStepHaptic = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
  };

  // Check if user has completed first session
  const hasCompletedSession =
    localStorage.getItem("hasCompletedSession") === "true";

  // ENHANCEMENT: Personality detection for adaptive onboarding (MODULAR)
  const getPersonalityBasedContent = (
    stepId: string,
    emotionalState?: "calm" | "focused" | "energized" | "peaceful"
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

  const steps: OnboardingStep[] = [
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
      title: "Join the Community",
      description: "Connect with other practitioners and share your progress",
      icon: Users,
      action: "Explore Community",
      completed: false,
      optional: true,
      emotionalState: "peaceful",
    },
    {
      id: "create",
      title: "Become a Creator",
      description:
        "Design custom patterns and earn from your wellness expertise",
      icon: Palette,
      action: "Start Creating",
      completed: false,
      optional: true,
      emotionalState: "energized",
    },
  ];

  const completedSteps = steps.filter((step) => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  // Auto-advance to next incomplete step
  useEffect(() => {
    const nextIncompleteStep = steps.findIndex((step) => !step.completed);
    if (nextIncompleteStep !== -1) {
      setCurrentStep(nextIncompleteStep);
    }
  }, [isAuthenticated, hasCompletedSession]);

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
      case "social":
        navigate("/community");
        break;
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
      {/* Progress Header */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold">Welcome to Imperfect Breath</h2>
        <p className="text-muted-foreground">
          Let's get you started on your wellness journey
        </p>
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {completedSteps} of {steps.length} steps completed
          </p>
        </div>
      </div>

      {/* Current Step */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            {React.createElement(steps[currentStep]?.icon, {
              className: "h-6 w-6 text-primary",
            })}
          </div>
          <CardTitle className="text-xl">{steps[currentStep]?.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {steps[currentStep]?.description}
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => handleStepAction(steps[currentStep])}
              disabled={steps[currentStep]?.completed}
              className="w-full"
              size="lg"
            >
              {steps[currentStep]?.completed ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completed
                </>
              ) : (
                <>
                  {steps[currentStep]?.action}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            {steps[currentStep]?.optional && (
              <Button variant="ghost" onClick={handleSkip} className="w-full">
                Skip for now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step Overview */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg transition-colors",
              index === currentStep
                ? "bg-primary/5 border border-primary/20"
                : step.completed
                ? "bg-green-50 border border-green-200"
                : "bg-muted/30",
              index < currentStep && !step.completed && "opacity-50"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                step.completed
                  ? "bg-green-500 text-white"
                  : index === currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step.completed ? (
                <CheckCircle className="h-4 w-4" onClick={triggerStepHaptic} />
              ) : (
                React.createElement(step.icon, { className: "h-4 w-4" })
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{step.title}</p>
              {step.optional && (
                <p className="text-xs text-muted-foreground">Optional</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Skip All */}
      {completedSteps < steps.length && (
        <div className="text-center">
          <Button variant="ghost" onClick={handleSkip} className="text-sm">
            Skip onboarding
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProgressiveOnboarding;
