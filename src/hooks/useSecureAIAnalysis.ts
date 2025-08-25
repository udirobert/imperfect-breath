import { useState, useCallback } from 'react';
import { api } from '../lib/api/unified-client';
import type { SecureAIProvider, AIAnalysisResponse, SessionData } from '../lib/ai/config';

interface SecureAIAnalysisResult extends AIAnalysisResponse {
  provider: string;
  error?: string;
}

export const useSecureAIAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<SecureAIAnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const analyzeWithProvider = useCallback(async (
    provider: SecureAIProvider, 
    sessionData: SessionData
  ): Promise<SecureAIAnalysisResult> => {
    try {
      const response = await api.ai.analyzeSession(provider, {
        pattern: sessionData.patternName,
        duration: sessionData.sessionDuration,
        averageBpm: sessionData.bpm,
        consistencyScore: sessionData.visionMetrics?.consistencyScore,
        restlessnessScore: sessionData.restlessnessScore,
        breathHoldDuration: sessionData.breathHoldTime
      });

      if (!response.success) {
        throw new Error(response.error || 'Analysis failed');
      }

      return {
        ...response.data,
        provider: api.ai.getProviderInfo(provider)?.name || provider
      };
    } catch (error) {
      console.error(`${provider} analysis failed:`, error);
      return {
        provider: api.ai.getProviderInfo(provider)?.name || provider,
        analysis: 'Analysis failed - using fallback response',
        suggestions: ['Continue practicing regularly', 'Focus on consistency'],
        score: { overall: 0, focus: 0, consistency: 0, progress: 0 },
        nextSteps: ['Try again later', 'Check your connection'],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  const analyzeSession = useCallback(async (sessionData: SessionData) => {
    setIsAnalyzing(true);
    setResults([]);
    setError(null);

    try {
      const providers: SecureAIProvider[] = ['google', 'openai', 'anthropic'];
      const analysisPromises = providers.map(provider => 
        analyzeWithProvider(provider, sessionData)
      );

      const analysisResults = await Promise.allSettled(analysisPromises);
      const successfulResults = analysisResults
        .filter((result): result is PromiseFulfilledResult<SecureAIAnalysisResult> => 
          result.status === 'fulfilled' && !result.value.error
        )
        .map(result => result.value);

      if (successfulResults.length === 0) {
        setError('All AI providers failed to analyze the session');
      }

      setResults(successfulResults);
    } catch (error) {
      console.error('AI analysis failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeWithProvider]);

  const testConnections = useCallback(async () => {
    const providers: SecureAIProvider[] = ['google', 'openai', 'anthropic'];
    const results = await Promise.allSettled(
      providers.map(provider => api.ai.testConnection(provider))
    );
    
    return providers.map((provider, index) => ({
      provider,
      name: api.ai.getProviderInfo(provider)?.name || provider,
      connected: results[index].status === 'fulfilled' && 
                 (results[index] as PromiseFulfilledResult<boolean>).value
    }));
  }, []);

  const generatePattern = useCallback(async (
    provider: SecureAIProvider,
    sessionData: Partial<SessionData> & { experienceLevel?: string }
  ) => {
    try {
      const response = await api.ai.generatePattern(provider, {
        consistencyScore: sessionData.visionMetrics?.consistencyScore,
        restlessnessScore: sessionData.restlessnessScore,
        averageBpm: sessionData.bpm,
        experienceLevel: sessionData.experienceLevel || 'beginner'
      });

      if (!response.success) {
        throw new Error(response.error || 'Pattern generation failed');
      }

      return response.data;
    } catch (error) {
      console.error(`Pattern generation failed for ${provider}:`, error);
      throw error;
    }
  }, []);

  return {
    analyzeSession,
    generatePattern,
    testConnections,
    isAnalyzing,
    results,
    error
  };
};

// Export for backward compatibility
export { useSecureAIAnalysis as useAIAnalysis };