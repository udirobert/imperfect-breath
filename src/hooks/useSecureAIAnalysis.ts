import { useState, useCallback } from 'react';
import { SecureAIClient } from '../lib/ai/secure-client';
import type { SecureAIProvider, AIAnalysisResponse } from '../lib/ai/config';

interface SessionData {
  pattern: string;
  duration: number;
  averageBpm: number;
  consistencyScore: number;
  restlessnessScore: number;
  breathHoldDuration: number;
}

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
      const result = await SecureAIClient.analyzeSession(provider, {
        pattern: sessionData.pattern,
        duration: sessionData.duration,
        averageBpm: sessionData.averageBpm,
        consistencyScore: sessionData.consistencyScore,
        restlessnessScore: sessionData.restlessnessScore,
        breathHoldDuration: sessionData.breathHoldDuration
      });

      return {
        ...result,
        provider: SecureAIClient.getProviderInfo(provider).name
      };
    } catch (error) {
      console.error(`${provider} analysis failed:`, error);
      return {
        provider: SecureAIClient.getProviderInfo(provider).name,
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
      providers.map(provider => SecureAIClient.testConnection(provider))
    );
    
    return providers.map((provider, index) => ({
      provider,
      name: SecureAIClient.getProviderInfo(provider).name,
      connected: results[index].status === 'fulfilled' && 
                 (results[index] as PromiseFulfilledResult<boolean>).value
    }));
  }, []);

  const generatePattern = useCallback(async (
    provider: SecureAIProvider,
    sessionData: Partial<SessionData> & { experienceLevel?: string }
  ) => {
    try {
      return await SecureAIClient.generatePattern(provider, {
        consistencyScore: sessionData.consistencyScore,
        restlessnessScore: sessionData.restlessnessScore,
        averageBpm: sessionData.averageBpm,
        experienceLevel: sessionData.experienceLevel || 'beginner'
      });
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