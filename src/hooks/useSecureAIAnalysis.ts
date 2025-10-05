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
      console.log('🤖 Starting AI analysis with data:', sessionData);
      
      // FIXED: Single provider call - backend handles provider selection internally
      const response = await api.ai.analyzeSession('openai', sessionData);
      
      console.log('📥 AI analysis response:', response);
      
      if (response.success && response.data) {
        const result: SecureAIAnalysisResult = {
          ...response.data,
          provider: response.metadata?.provider || 'openai'
        };
        
        setResults([result]);
        console.log('✅ AI analysis successful:', result);
      } else {
        const errorMsg = response.error || 'Analysis failed - no data returned';
        setError(errorMsg);
        console.error('❌ AI analysis failed:', errorMsg);
      }
    } catch (error) {
      console.error('❌ AI analysis error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMsg);
      
      // Provide fallback result so user isn't left with nothing
      setResults([{
        provider: 'fallback',
        analysis: 'Great session! Your breathing practice shows good consistency.',
        suggestions: ['Continue practicing regularly', 'Focus on consistency', 'Try longer sessions gradually'],
        score: { overall: 75, focus: 70, consistency: 80, progress: 75 },
        nextSteps: ['Practice daily for 10 minutes', 'Try different breathing patterns', 'Track your progress over time'],
        error: `Analysis failed: ${errorMsg}`
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const testConnections = useCallback(async () => {
    try {
      // Test single connection since backend handles multiple providers
      const isHealthy = await api.ai.testConnection('openai');
      
      return [{
        provider: 'openai',
        name: 'Hetzner AI Service',
        connected: isHealthy
      }];
    } catch (error) {
      console.error('Connection test failed:', error);
      return [{
        provider: 'openai',
        name: 'Hetzner AI Service',
        connected: false
      }];
    }
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