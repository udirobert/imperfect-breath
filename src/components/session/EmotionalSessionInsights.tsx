/**
 * Emotional Session Insights Component
 * 
 * Provides detailed post-session analysis of emotional journey
 * Enhances existing session results with emotional context
 * 
 * Core Principles:
 * - ENHANCEMENT FIRST: Complements existing session summary
 * - CLEAN: Clear separation of emotional analytics
 * - PERFORMANT: Processes data client-side
 * - MODULAR: Can be used independently or integrated
 */

import React, { useMemo } from 'react';
import { EmotionalContext } from '../../lib/breathing/emotional-pattern-adapter';
import { Card } from '../ui/card';

export interface EmotionalSessionInsightsProps {
  emotionalHistory: EmotionalContext[];
  sessionDuration: number; // in seconds
  patternUsed?: string;
  className?: string;
  onRecommendationSelect?: (patternId: string, reason: string) => void;
}

interface EmotionalJourney {
  phase: string;
  duration: number;
  averageRelaxation: number;
  dominantEmotion: string;
  highlights: string[];
}

export const EmotionalSessionInsights: React.FC<EmotionalSessionInsightsProps> = ({
  emotionalHistory,
  sessionDuration,
  patternUsed,
  className = '',
  onRecommendationSelect
}) => {
  // Process emotional journey
  const analysisResults = useMemo(() => {
    if (emotionalHistory.length === 0) {
      return {
        journey: [],
        overallProgress: 0,
        achievements: [],
        recommendations: [],
        emotionalDistribution: {},
        relaxationTrend: 'stable' as const
      };
    }

    // Divide session into phases
    const phaseCount = Math.min(4, Math.max(1, Math.floor(emotionalHistory.length / 10)));
    const phaseSize = Math.floor(emotionalHistory.length / phaseCount);
    
    const journey: EmotionalJourney[] = [];
    for (let i = 0; i < phaseCount; i++) {
      const start = i * phaseSize;
      const end = i === phaseCount - 1 ? emotionalHistory.length : (i + 1) * phaseSize;
      const phaseData = emotionalHistory.slice(start, end);
      
      if (phaseData.length === 0) continue;

      const avgRelaxation = phaseData.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / phaseData.length;
      const emotionCounts: Record<string, number> = {};
      phaseData.forEach(ctx => {
        emotionCounts[ctx.dominantEmotion] = (emotionCounts[ctx.dominantEmotion] || 0) + 1;
      });
      
      const dominantEmotion = Object.entries(emotionCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

      const highlights: string[] = [];
      
      // Identify notable moments in this phase
      if (phaseData.some(ctx => ctx.isDuchenneActive)) {
        highlights.push('Genuine joy detected');
      }
      if (avgRelaxation > 80) {
        highlights.push('Deep relaxation achieved');
      }
      if (dominantEmotion === 'tension' && phaseData[phaseData.length - 1]?.dominantEmotion !== 'tension') {
        highlights.push('Tension successfully released');
      }

      journey.push({
        phase: `Phase ${i + 1}`,
        duration: (end - start) * (sessionDuration / emotionalHistory.length),
        averageRelaxation: Math.round(avgRelaxation),
        dominantEmotion,
        highlights
      });
    }

    // Calculate overall progress
    const firstQuarter = emotionalHistory.slice(0, Math.floor(emotionalHistory.length / 4));
    const lastQuarter = emotionalHistory.slice(-Math.floor(emotionalHistory.length / 4));
    
    const startRelaxation = firstQuarter.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / firstQuarter.length;
    const endRelaxation = lastQuarter.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / lastQuarter.length;
    const overallProgress = Math.round(((endRelaxation - startRelaxation) / startRelaxation) * 100);

    // Identify achievements
    const achievements: string[] = [];
    const maxRelaxation = Math.max(...emotionalHistory.map(ctx => ctx.relaxationScore));
    const duchenneCount = emotionalHistory.filter(ctx => ctx.isDuchenneActive).length;
    const consistentCalmPercentage = (emotionalHistory.filter(ctx => 
      ctx.dominantEmotion === 'calm' || ctx.dominantEmotion === 'joy').length / emotionalHistory.length) * 100;

    if (maxRelaxation > 85) {
      achievements.push('🧘 Deep Meditation State Reached');
    }
    if (duchenneCount > 0) {
      achievements.push('😊 Authentic Joy Experienced');
    }
    if (overallProgress > 20) {
      achievements.push('📈 Significant Relaxation Improvement');
    }
    if (consistentCalmPercentage > 60) {
      achievements.push('🎯 Sustained Peaceful State');
    }
    if (sessionDuration > 300) { // 5+ minutes
      achievements.push('⏱️ Extended Mindfulness Practice');
    }

    // Generate recommendations
    const recommendations: Array<{pattern: string, reason: string}> = [];
    const avgOverallRelaxation = emotionalHistory.reduce((sum, ctx) => sum + ctx.relaxationScore, 0) / emotionalHistory.length;

    if (emotionalHistory.some(ctx => ctx.dominantEmotion === 'tension')) {
      recommendations.push({
        pattern: '4-7-8 Calming',
        reason: 'Your session showed tension patterns. This technique excels at stress relief.'
      });
    }

    if (avgOverallRelaxation > 75) {
      recommendations.push({
        pattern: 'Extended Deep Breathing',
        reason: 'You achieved great relaxation! Try longer patterns to deepen the experience.'
      });
    }

    if (duchenneCount > 0) {
      recommendations.push({
        pattern: 'Energizing Breath',
        reason: 'You experienced joy during breathing. This pattern can enhance positive emotions.'
      });
    }

    // Emotional distribution
    const emotionalDistribution: Record<string, number> = {};
    emotionalHistory.forEach(ctx => {
      emotionalDistribution[ctx.dominantEmotion] = (emotionalDistribution[ctx.dominantEmotion] || 0) + 1;
    });
    
    Object.keys(emotionalDistribution).forEach(emotion => {
      emotionalDistribution[emotion] = Math.round((emotionalDistribution[emotion] / emotionalHistory.length) * 100);
    });

    // Relaxation trend
    const relaxationTrend = overallProgress > 10 ? 'improving' 
      : overallProgress < -10 ? 'declining' 
      : 'stable';

    return {
      journey,
      overallProgress,
      achievements,
      recommendations,
      emotionalDistribution,
      relaxationTrend
    };
  }, [emotionalHistory, sessionDuration]);

  if (emotionalHistory.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <h3 className="text-lg font-semibold mb-2">Emotional Insights</h3>
          <p>No emotional data available for this session.</p>
          <p className="text-sm mt-1">Enable face tracking to receive emotional insights.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Session Overview */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          🧠 Emotional Journey Insights
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {analysisResults.overallProgress > 0 ? '+' : ''}{analysisResults.overallProgress}%
            </div>
            <div className="text-sm text-gray-600">Relaxation Progress</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(Object.values(analysisResults.emotionalDistribution).reduce((max, current) => Math.max(max, current), 0))}%
            </div>
            <div className="text-sm text-gray-600">
              Dominant: {Object.entries(analysisResults.emotionalDistribution).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Neutral'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {analysisResults.achievements.length}
            </div>
            <div className="text-sm text-gray-600">Achievements</div>
          </div>
        </div>

        {/* Emotional Distribution Bar */}
        <div className="mt-4">
          <h4 className="font-medium mb-2">Emotional State Distribution</h4>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden flex">
            {Object.entries(analysisResults.emotionalDistribution).map(([emotion, percentage]) => (
              <div
                key={emotion}
                className={`h-full ${getEmotionColor(emotion)}`}
                style={{ width: `${percentage}%` }}
                title={`${emotion}: ${percentage}%`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            {Object.entries(analysisResults.emotionalDistribution).map(([emotion, percentage]) => (
              <span key={emotion}>{emotion}: {percentage}%</span>
            ))}
          </div>
        </div>
      </Card>

      {/* Session Phases */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Session Phases</h4>
        <div className="space-y-3">
          {analysisResults.journey.map((phase, index) => (
            <div key={index} className="border-l-4 border-blue-300 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium">{phase.phase}</h5>
                  <p className="text-sm text-gray-600">
                    {Math.round(phase.duration / 60)}m • {phase.dominantEmotion} • {phase.averageRelaxation}% relaxation
                  </p>
                  {phase.highlights.length > 0 && (
                    <ul className="text-sm text-green-600 mt-1">
                      {phase.highlights.map((highlight, idx) => (
                        <li key={idx}>• {highlight}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className={`px-2 py-1 rounded text-xs ${getEmotionBadgeStyle(phase.dominantEmotion)}`}>
                  {phase.dominantEmotion}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Achievements */}
      {analysisResults.achievements.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">🏆 Session Achievements</h4>
          <div className="grid gap-2">
            {analysisResults.achievements.map((achievement, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                <span className="text-green-600 font-medium">{achievement}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {analysisResults.recommendations.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">💡 Personalized Recommendations</h4>
          <div className="space-y-3">
            {analysisResults.recommendations.map((rec, index) => (
              <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="font-medium text-blue-600">{rec.pattern}</h5>
                    <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                  </div>
                  {onRecommendationSelect && (
                    <button
                      onClick={() => onRecommendationSelect(rec.pattern, rec.reason)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Try Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// Helper functions
function getEmotionColor(emotion: string): string {
  switch (emotion) {
    case 'joy': return 'bg-green-400';
    case 'calm': return 'bg-blue-400';
    case 'neutral': return 'bg-gray-400';
    case 'tension': return 'bg-orange-400';
    default: return 'bg-gray-300';
  }
}

function getEmotionBadgeStyle(emotion: string): string {
  switch (emotion) {
    case 'joy': return 'bg-green-100 text-green-800';
    case 'calm': return 'bg-blue-100 text-blue-800';
    case 'neutral': return 'bg-gray-100 text-gray-800';
    case 'tension': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-600';
  }
}