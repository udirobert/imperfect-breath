import { useState, useCallback } from 'react';
import { api } from '../lib/api/unified-client';
import type { SecureAIProvider, AIAnalysisResponse, SessionData } from '../lib/ai/config';
import { EnhancedAnalysisService, performEnhancedAnalysis } from '../lib/ai/enhanced-analysis-service';
import type { EnhancedAnalysisResponse } from '../lib/ai/enhanced-analysis-service';

interface SecureAIAnalysisResult extends AIAnalysisResponse {
  provider: string;
  error?: string;
  providerDisplayName?: string;
  // Enhanced fields
  scientificInsights?: string;
  patternSpecificGuidance?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  followUpQuestions?: string[];
  progressTrends?: string[];
}

// HELPER: Maps actual provider identifiers to user-friendly display names
const getProviderDisplayName = (providerId: string): string => {
  const displayNames: Record<string, string> = {
    'cerebras': 'Cerebras AI Analysis',
    'openai': 'OpenAI GPT Analysis',
    'anthropic': 'Claude AI Analysis',
    'google': 'Google Gemini Analysis',
    'fallback': 'Basic Analysis',
    'hetzner': 'Hetzner AI Service',
    'auto': 'Smart AI Analysis'
  };

  return displayNames[providerId] || `${providerId.charAt(0).toUpperCase()}${providerId.slice(1)} Analysis`;
};

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
      console.log('🤖 Starting enhanced AI analysis with data:', sessionData);

      // ENHANCED: Prepare session data with enhanced analysis service
      const enhancedSessionData = EnhancedAnalysisService.transformSessionData(sessionData);
      
      // Generate enhanced analysis context and prompts
      const enhancedAnalysis = await performEnhancedAnalysis({
        sessionData: enhancedSessionData,
        includeFollowUpQuestions: true
      });

      console.log('🧠 Enhanced analysis context prepared:', enhancedAnalysis.context);

      // Send enhanced request to backend with all session data
      const response = await api.ai.analyzeSession('auto', {
        ...sessionData, // Include all session data
        enhancedPrompts: enhancedAnalysis.prompts,
        analysisContext: enhancedAnalysis.context,
        performanceInsights: enhancedAnalysis.insights,
        progressiveRecommendations: enhancedAnalysis.recommendations
      });

      console.log('📥 Enhanced AI analysis response:', response);

      if (response.success && response.data) {
        // Normalize the response format
        const normalizedData = response.data.result ? response.data.result : response.data;

        // USE ACTUAL PROVIDER FROM RESPONSE - no more lying to users!
        const actualProvider = response.metadata?.provider ||
          response.data.provider ||
          'fallback';

        const providerName = getProviderDisplayName(actualProvider);

        // ENHANCED: Validate and enhance the response with our analysis service
        const enhancedResponse = EnhancedAnalysisService.validateAndEnhanceResponse(
          normalizedData,
          enhancedAnalysis.context
        );

        const result: SecureAIAnalysisResult = {
          ...enhancedResponse,
          provider: actualProvider,
          providerDisplayName: providerName,
        };

        setResults([result]);
        console.log(`✅ ${providerName} enhanced analysis successful:`, result);
      } else {
        const errorMsg = response.error || 'Analysis failed - no data returned';
        setError(errorMsg);
        console.error('❌ AI analysis failed:', errorMsg);
      }
    } catch (error) {
      console.error('❌ AI analysis error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMsg);

      // ENHANCED: Provide intelligent fallback with pattern-specific guidance
      const enhancedSessionData = EnhancedAnalysisService.transformSessionData(sessionData);
      const fallbackAnalysis = await performEnhancedAnalysis({
        sessionData: enhancedSessionData,
        includeFollowUpQuestions: false
      });

      // Use the enhanced session data which includes cycleCount
      const fallbackResponse = EnhancedAnalysisService.validateAndEnhanceResponse(
        {
          analysis: `Based on your actual session data: You completed ${enhancedSessionData.cycleCount || 0} cycles with ${enhancedSessionData.restlessnessScore !== undefined ? Math.max(0, 100 - enhancedSessionData.restlessnessScore) : 'N/A'}% stillness. This shows good focus and commitment to your practice.`,
          suggestions: fallbackAnalysis.recommendations.slice(0, 3),
          score: { 
            overall: enhancedSessionData.restlessnessScore !== undefined ? Math.min(100, Math.max(30, 100 - enhancedSessionData.restlessnessScore)) : 70,
            focus: enhancedSessionData.restlessnessScore !== undefined ? Math.min(100, Math.max(30, 100 - enhancedSessionData.restlessnessScore)) : 70,
            consistency: enhancedSessionData.cycleCount !== undefined ? Math.min(100, Math.max(30, (enhancedSessionData.cycleCount || 0) * 10)) : 60,
            progress: enhancedSessionData.cycleCount !== undefined ? Math.min(100, Math.max(30, (enhancedSessionData.cycleCount || 0) * 15)) : 50
          },
          nextSteps: ['Practice daily for 10-15 minutes', 'Try different breathing patterns', 'Track your progress over time']
        },
        fallbackAnalysis.context
      );

      setResults([{
        ...fallbackResponse,
        provider: 'fallback',
        providerDisplayName: 'Enhanced Fallback Analysis',
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
