/**
 * CONSOLIDATED: Simple context collection for mood-based recommendations
 * ENHANCEMENT FIRST: Minimal addition to existing mood system
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Clock,
  Battery,
  Moon,
  Coffee,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ContextQuestion {
  id: string;
  type: 'scale' | 'choice' | 'time';
  question: string;
  description?: string;
  options?: { id: string; label: string; icon?: React.ComponentType<{ className?: string }> }[];
  min?: number;
  max?: number;
  weight: number;
  showIf?: (context: UserContext) => boolean;
}

export interface UserContext {
  mood?: string;
  moodGoal?: string;
  energyLevel?: number;
  sleepQuality?: string;
  stressLevel?: number;
  availableTime?: number;
  timeOfDay?: number;
  recentActivity?: string;
}

interface ContextCollectorProps {
  initialMood?: string;
  onContextComplete: (context: UserContext) => void;
  onBack?: () => void;
  className?: string;
}

// PREVENT BLOAT: Minimal essential questions only
const ESSENTIAL_QUESTIONS: ContextQuestion[] = [
  {
    id: 'availableTime',
    type: 'choice',
    question: 'How much time do you have?',
    options: [
      { id: '2', label: '2 minutes', icon: Clock },
      { id: '5', label: '5 minutes', icon: Clock },
      { id: '10', label: '10+ minutes', icon: Clock },
    ],
    weight: 1,
  },
];

export const ContextCollector: React.FC<ContextCollectorProps> = ({
  initialMood,
  onContextComplete,
  onBack,
  className,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [context, setContext] = useState<UserContext>({
    mood: initialMood,
    timeOfDay: new Date().getHours(),
  });
  const [isComplete, setIsComplete] = useState(false);

  // PREVENT BLOAT: Use minimal essential questions
  const relevantQuestions = ESSENTIAL_QUESTIONS;

  const currentQuestion = relevantQuestions[currentStep];
  const isLastStep = currentStep >= relevantQuestions.length - 1;

  // Handle answer selection
  const handleAnswer = (questionId: string, value: string | number) => {
    const newContext = { ...context, [questionId]: value };
    setContext(newContext);

    // Auto-advance for choice questions
    if (currentQuestion.type === 'choice') {
      setTimeout(() => {
        if (isLastStep) {
          setIsComplete(true);
          onContextComplete(newContext);
        } else {
          setCurrentStep(prev => prev + 1);
        }
      }, 300); // Brief delay for visual feedback
    }
  };

  // Handle scale completion
  const handleNext = () => {
    if (isLastStep) {
      setIsComplete(true);
      onContextComplete(context);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else if (onBack) {
      onBack();
    }
  };

  // CLEAN: Progress indicator
  const progress = ((currentStep + 1) / relevantQuestions.length) * 100;

  if (isComplete) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Perfect! Getting your recommendations...</h3>
            <p className="text-sm text-muted-foreground">
              We're finding patterns that match your current state
            </p>
          </div>
          <div className="animate-pulse">
            <div className="h-2 bg-primary/20 rounded-full">
              <div className="h-2 bg-primary rounded-full w-full transition-all duration-1000" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Step {currentStep + 1} of {relevantQuestions.length}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full">
              <div 
                className="h-2 bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">{currentQuestion.question}</h3>
            {currentQuestion.description && (
              <p className="text-sm text-muted-foreground">
                {currentQuestion.description}
              </p>
            )}
          </div>

          {/* Answer options */}
          <div className="space-y-4">
            {currentQuestion.type === 'choice' && currentQuestion.options && (
              <div className="grid gap-3">
                {currentQuestion.options.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.id}
                      variant="outline"
                      onClick={() => handleAnswer(currentQuestion.id, option.id)}
                      className="h-auto p-4 flex items-center gap-3 hover:bg-muted/50 justify-start"
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span>{option.label}</span>
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'scale' && (
              <div className="space-y-6">
                <div className="px-4">
                  <Slider
                    value={[context[currentQuestion.id as keyof UserContext] as number || currentQuestion.min || 1]}
                    onValueChange={([value]) => handleAnswer(currentQuestion.id, value)}
                    min={currentQuestion.min || 1}
                    max={currentQuestion.max || 5}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
                <div className="text-center">
                  <Badge variant="secondary" className="text-sm">
                    {context[currentQuestion.id as keyof UserContext] || currentQuestion.min || 1} / {currentQuestion.max || 5}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            {currentQuestion.type === 'scale' && (
              <Button
                onClick={handleNext}
                disabled={!context[currentQuestion.id as keyof UserContext]}
                className="flex items-center gap-2"
              >
                {isLastStep ? 'Get Recommendations' : 'Next'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContextCollector;