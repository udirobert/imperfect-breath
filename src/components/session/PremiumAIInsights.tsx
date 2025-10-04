/**
 * Premium AI Insights - Seamless UX Integration
 * 
 * PRINCIPLES:
 * - Premium language focused on user goals
 * - Seamless visual integration
 * - Emotional resonance over technical details
 */

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Sparkles, Target, TrendingUp, Heart } from 'lucide-react';

interface AIInsight {
  overallScore: number;
  phaseInsights: {
    inhale?: string;
    exhale?: string;
    hold?: string;
  };
  temporalInsights: string;
  nextSteps: string[];
  encouragement: string;
}

interface PremiumAIInsightsProps {
  insights: AIInsight;
  sessionGoal?: 'stress_relief' | 'focus' | 'sleep' | 'energy' | 'general';
  patternName: string;
  className?: string;
}

const goalLanguage = {
  stress_relief: {
    title: "Your Calm Journey",
    icon: Heart,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200"
  },
  focus: {
    title: "Your Focus Flow",
    icon: Target,
    color: "text-blue-600", 
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  sleep: {
    title: "Your Rest Ritual",
    icon: Sparkles,
    color: "text-purple-600",
    bgColor: "bg-purple-50", 
    borderColor: "border-purple-200"
  },
  energy: {
    title: "Your Energy Boost",
    icon: TrendingUp,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200"
  },
  general: {
    title: "Your Breathing Journey",
    icon: Sparkles,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200"
  }
};

const phaseLanguage = {
  inhale: "Drawing in calm",
  exhale: "Releasing tension", 
  hold: "Finding stillness"
};

export const PremiumAIInsights: React.FC<PremiumAIInsightsProps> = ({
  insights,
  sessionGoal = 'general',
  patternName,
  className = ""
}) => {
  const theme = goalLanguage[sessionGoal];
  const IconComponent = theme.icon;

  const formatPhaseInsight = (phase: string, insight: string) => {
    const phaseLabel = phaseLanguage[phase as keyof typeof phaseLanguage] || phase;
    return `${phaseLabel}: ${insight.toLowerCase()}`;
  };

  const formatNextStep = (step: string, index: number) => {
    // Convert technical language to user-focused language
    const userFriendlySteps = {
      'practice daily': 'Make this a daily ritual',
      'try longer sessions': 'Gradually extend your practice',
      'focus on consistency': 'Build your rhythm',
      'improve posture': 'Find your centered position',
      'reduce movement': 'Settle deeper into stillness'
    };
    
    const lowerStep = step.toLowerCase();
    const friendlyStep = Object.entries(userFriendlySteps).find(([key]) => 
      lowerStep.includes(key)
    )?.[1] || step;
    
    return friendlyStep;
  };

  return (
    <Card className={`${theme.bgColor} ${theme.borderColor} border-2 ${className}`}>
      <CardContent className="p-6">
        {/* Premium Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${theme.bgColor} border ${theme.borderColor}`}>
            <IconComponent className={`h-5 w-5 ${theme.color}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${theme.color}`}>{theme.title}</h3>
            <p className="text-sm text-gray-600">Personalized insights from your {patternName} practice</p>
          </div>
          <Badge variant="secondary" className="ml-auto bg-white/80 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 mr-1" />
            Personalized
          </Badge>
        </div>

        {/* Encouragement - Premium emotional connection */}
        <div className="mb-6 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
          <p className={`text-lg font-light ${theme.color} leading-relaxed`}>
            {insights.encouragement}
          </p>
        </div>

        {/* Phase-Specific Insights - Premium technique refinement */}
        {Object.keys(insights.phaseInsights).length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-3">Refining Your Technique</h4>
            <div className="space-y-2">
              {Object.entries(insights.phaseInsights).map(([phase, insight]) => (
                <div key={phase} className="flex items-start gap-3 p-3 bg-white/40 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${theme.color.replace('text-', 'bg-')} mt-2 flex-shrink-0`} />
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {formatPhaseInsight(phase, insight)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Temporal Progress - Premium progression narrative */}
        {insights.temporalInsights && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-3">Your Progress Story</h4>
            <p className="text-sm text-gray-700 leading-relaxed p-3 bg-white/40 rounded-lg">
              {insights.temporalInsights}
            </p>
          </div>
        )}

        {/* Next Steps - Premium goal-oriented actions */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Continue Your Journey</h4>
          <div className="space-y-2">
            {insights.nextSteps.slice(0, 2).map((step, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-colors">
                <div className={`w-6 h-6 rounded-full ${theme.color.replace('text-', 'bg-')} text-white flex items-center justify-center text-xs font-medium`}>
                  {index + 1}
                </div>
                <p className="text-sm font-medium text-gray-800">
                  {formatNextStep(step, index)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
