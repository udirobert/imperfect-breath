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

      // Try streaming first, fallback to regular analysis
      try {
        // Check if streaming is supported
        if (api.ai.analyzeSessionStreaming) {
          console.log('🔄 Starting streaming AI analysis');
          
          // Use streaming API
          const stream = await api.ai.analyzeSessionStreaming('auto', {
            ...sessionData,
            enhancedPrompts: enhancedAnalysis.prompts,
            analysisContext: enhancedAnalysis.context,
            performanceInsights: enhancedAnalysis.insights,
            progressiveRecommendations: enhancedAnalysis.recommendations
          });

          const reader = stream.getReader();
          let accumulatedData = '';
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                break;
              }
              
              // Process streaming data
              accumulatedData += value;
              
              // Try to parse complete JSON objects from the stream
              try {
                // Handle Server-Sent Events format
                const lines = accumulatedData.split('\n\n');
                
                // Process all complete lines
                for (let i = 0; i < lines.length - 1; i++) {
                  const line = lines[i].trim();
                  if (line.startsWith('data: ')) {
                    const data = line.substring(6);
                    
                    if (data === '[DONE]') {
                      console.log('✅ Streaming analysis completed');
                      break;
                    }
                    
                    // Try to parse the JSON data
                    const parsed = JSON.parse(data);
                    
                    if (parsed.error) {
                      throw new Error(parsed.error);
                    }
                    
                    // Transform the response
                    const actualProvider = parsed.metadata?.provider || 'auto';
                    const providerName = getProviderDisplayName(actualProvider);
                    
                    // ENHANCED: Validate and enhance the response with our analysis service
                    const enhancedResponse = EnhancedAnalysisService.validateAndEnhanceResponse(
                      parsed,
                      enhancedAnalysis.context
                    );

                    const result: SecureAIAnalysisResult = {
                      ...enhancedResponse,
                      provider: actualProvider,
                      providerDisplayName: providerName,
                    };

                    setResults([result]);
                    console.log(`✅ ${providerName} streaming analysis updated:`, result);
                  }
                }
                
                // Keep the last incomplete line
                accumulatedData = lines[lines.length - 1];
              } catch (parseError) {
                // Continue accumulating data until we have complete JSON
                console.log('🔄 Accumulating streaming data...');
              }
            }
            
            // If we successfully streamed, we're done
            return;
          } finally {
            reader.releaseLock();
          }
        }
      } catch (streamError) {
        console.warn('Streaming analysis failed, falling back to regular analysis:', streamError);
      }

      // Send enhanced request to backend (fallback to non-streaming)
      const response = await api.ai.analyzeSession('auto', {
        ...sessionData,
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
      const cycleCount = enhancedSessionData.cycleCount || 0;
      const targetCycles = enhancedSessionData.targetCycles || 10;
      const completionRate = targetCycles > 0 ? (cycleCount / targetCycles) * 100 : 0;
      const stillnessScore = enhancedSessionData.restlessnessScore !== undefined ? 
        Math.max(0, 100 - enhancedSessionData.restlessnessScore) : 70;

      const fallbackResponse = EnhancedAnalysisService.validateAndEnhanceResponse(
        {
          analysis: `Based on your actual session data: You completed ${cycleCount} cycles with ${Math.round(stillnessScore)}% stillness. ${completionRate >= 80 ? 'Excellent cycle completion!' : completionRate >= 60 ? 'Good cycle completion with room for improvement.' : 'Focus on building endurance for better cycle completion.'}`,
          suggestions: fallbackAnalysis.recommendations.slice(0, 3),
          score: { 
            overall: Math.min(100, Math.max(30, Math.round((stillnessScore + completionRate + (enhancedSessionData.sessionDuration ? (enhancedSessionData.sessionDuration / 600) * 100 : 50)) / 3))),
            focus: Math.min(100, Math.max(30, Math.round(stillnessScore))),
            consistency: Math.min(100, Math.max(30, Math.round(completionRate))),
            progress: Math.min(100, Math.max(30, Math.round(cycleCount * 10)))
          },
          nextSteps: [
            enhancedSessionData.sessionDuration && enhancedSessionData.sessionDuration < 600 ? 'Practice daily for 10-15 minutes' : 'Maintain your consistent practice',
            completionRate < 70 ? 'Try to complete more cycles' : 'Increase cycle targets gradually',
            stillnessScore < 70 ? 'Focus on posture and stillness' : 'Continue developing your stillness'
          ]
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