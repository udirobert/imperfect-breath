import { useState, useCallback } from 'react';
import { SessionData, AIConfigManager } from '@/lib/ai/config';

export interface AIAnalysisResult {
  provider: string;
  analysis: string;
  suggestions: string[];
  nextSteps: string[];
  score: {
    overall: number;
    focus: number;
    consistency: number;
    progress: number;
  };
  error?: string;
}

export const useAIAnalysis = () => {
  const [analyses, setAnalyses] = useState<AIAnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeWithProvider = useCallback(async (
    sessionData: SessionData,
    providerId: string
  ): Promise<AIAnalysisResult | null> => {
    const apiKey = AIConfigManager.getApiKey(providerId);
    if (!apiKey) {
      return {
        provider: providerId,
        analysis: '',
        suggestions: [],
        nextSteps: [],
        score: { overall: 0, focus: 0, consistency: 0, progress: 0 },
        error: 'API key not configured'
      };
    }

    try {
      // Mock AI analysis for demo purposes
      const mockAnalysis: AIAnalysisResult = {
        provider: providerId,
        analysis: `Based on your breathing session data, you demonstrated good control with a ${sessionData.breathHoldTime}s breath hold and a restlessness score of ${sessionData.restlessnessScore}. Your ${sessionData.patternName} practice shows promising results for a ${Math.round(sessionData.sessionDuration)}s session.`,
        suggestions: [
          'Try extending your breath hold time gradually by 2-3 seconds',
          'Focus on reducing micro-movements during the hold phase',
          'Consider practicing at the same time daily for consistency',
          'Experiment with different breathing patterns to find your optimal rhythm'
        ],
        nextSteps: [
          'Increase session duration to 5-10 minutes',
          'Track your progress over the next week',
          'Try the 4-7-8 pattern if you haven\'t already',
          'Practice in a quieter environment to improve focus'
        ],
        score: {
          overall: Math.min(85, Math.max(60, 100 - sessionData.restlessnessScore + Math.floor(sessionData.breathHoldTime / 2))),
          focus: Math.min(90, Math.max(50, 100 - sessionData.restlessnessScore)),
          consistency: Math.min(80, Math.max(65, 75 + Math.floor(sessionData.sessionDuration / 10))),
          progress: Math.min(85, Math.max(70, 70 + Math.floor(sessionData.breathHoldTime / 3)))
        }
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

      return mockAnalysis;
    } catch (error) {
      return {
        provider: providerId,
        analysis: '',
        suggestions: [],
        nextSteps: [],
        score: { overall: 0, focus: 0, consistency: 0, progress: 0 },
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
  }, []);

  const analyzeSession = useCallback(async (
    currentSession: SessionData,
    previousSessions: Partial<SessionData>[] = []
  ) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalyses([]);

    try {
      const configuredProviders = AIConfigManager.getConfiguredProviders();
      
      if (configuredProviders.length === 0) {
        // Demo mode - show sample analysis
        const demoAnalysis: AIAnalysisResult = {
          provider: 'demo',
          analysis: `Demo Analysis: Your breathing session shows excellent potential! With a ${currentSession.breathHoldTime}s breath hold and restlessness score of ${currentSession.restlessnessScore}, you're developing good breathing control. The ${currentSession.patternName} technique is working well for you.`,
          suggestions: [
            'Configure AI providers in settings for personalized insights',
            'Try extending your sessions gradually',
            'Practice daily for best results',
            'Experiment with different breathing patterns'
          ],
          nextSteps: [
            'Set up OpenAI, Anthropic, or Gemini API keys',
            'Track your progress over time',
            'Try more advanced breathing techniques',
            'Join the breathing community for tips'
          ],
          score: {
            overall: 78,
            focus: 82,
            consistency: 75,
            progress: 80
          }
        };
        
        setAnalyses([demoAnalysis]);
        return;
      }

      // Analyze with all configured providers
      const analysisPromises = configuredProviders.map(providerId =>
        analyzeWithProvider(currentSession, providerId)
      );

      const results = await Promise.all(analysisPromises);
      const validResults = results.filter((result): result is AIAnalysisResult => 
        result !== null && !result.error
      );

      if (validResults.length === 0) {
        throw new Error('All AI providers failed to analyze the session');
      }

      setAnalyses(validResults);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setError(errorMessage);
      console.error('AI Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeWithProvider]);

  const clearAnalyses = useCallback(() => {
    setAnalyses([]);
    setError(null);
  }, []);

  return {
    analyses,
    isAnalyzing,
    error,
    analyzeSession,
    analyzeWithProvider,
    clearAnalyses
  };
};
