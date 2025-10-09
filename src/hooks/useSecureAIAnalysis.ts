import { useState, useCallback } from 'react';
import { api } from '../lib/api/unified-client';
import type { SecureAIProvider, AIAnalysisResponse, SessionData } from '../lib/ai/config';
import { EnhancedAnalysisService, performEnhancedAnalysis } from '../lib/ai/enhanced-analysis-service';
import type { EnhancedAnalysisResponse } from '../lib/ai/enhanced-analysis-service';
import { AI_PERSONAS, type AIPersona } from '../lib/ai/personas';
import { useAIFeatureAccess } from './useSubscriptionAccess';
import { providerFallbackManager } from '../lib/ai/provider-fallback';
import { streamingMetricsManager } from '../lib/ai/streaming-metrics';

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

// Enhanced streaming state interface
interface StreamingState {
  isStreaming: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  progress: {
    bytesReceived: number;
    chunksProcessed: number;
    estimatedProgress: number; // 0-100
  };
  retryAttempt: number;
  maxRetries: number;
}

const getProviderDisplayName = (providerId: string): string => {
  const providerNames: Record<string, string> = {
    'openai': 'OpenAI GPT',
    'anthropic': 'Anthropic Claude',
    'google': 'Google Gemini',
    'cerebras': 'Cerebras Llama',
    'auto': 'Auto-Select',
    'fallback': 'Enhanced Fallback'
  };
  
  return providerNames[providerId] || providerId;
};

export const useSecureAIAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<SecureAIAnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Move hook call to top level to fix React error #321
  const { canUseAIAnalysis, canUseStreamingFeedback, subscriptionTier } = useAIFeatureAccess();
  
  // Enhanced streaming state
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    connectionStatus: 'disconnected',
    progress: {
      bytesReceived: 0,
      chunksProcessed: 0,
      estimatedProgress: 0
    },
    retryAttempt: 0,
    maxRetries: 3
  });

  const resetStreamingState = useCallback(() => {
    setStreamingState({
      isStreaming: false,
      connectionStatus: 'disconnected',
      progress: {
        bytesReceived: 0,
        chunksProcessed: 0,
        estimatedProgress: 0
      },
      retryAttempt: 0,
      maxRetries: 3
    });
  }, []);

  const updateStreamingProgress = useCallback((update: Partial<StreamingState>) => {
    setStreamingState(prev => ({
      ...prev,
      ...update,
      progress: {
        ...prev.progress,
        ...update.progress
      }
    }));
  }, []);

  const analyzeSession = useCallback(async (
    provider: SecureAIProvider,
    sessionData: SessionData
  ) => {
    // Check subscription access for AI analysis (values from hook at top level)
    if (!canUseAIAnalysis) {
      setError('AI analysis requires a Premium or Pro subscription');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResults([]);
    resetStreamingState();

    try {
      console.log('🤖 Starting enhanced AI analysis with data:', sessionData);

      // ENHANCED: Prepare session data with enhanced analysis service
      const enhancedSessionData = EnhancedAnalysisService.transformSessionData(sessionData);
      
      // Generate enhanced analysis context and prompts
      const enhancedAnalysis = await performEnhancedAnalysis({
        sessionData: enhancedSessionData,
        includeFollowUpQuestions: true
      });

      // Add missing persona and userTier to context
      const enhancedContext = {
        ...enhancedAnalysis.context,
        persona: AI_PERSONAS.dr_breathe, // Default persona
        userTier: subscriptionTier as 'free' | 'premium' | 'pro'
      };

      console.log('🧠 Enhanced analysis context prepared:', enhancedContext);

      // Use provider fallback manager for intelligent provider selection
      let selectedProvider: SecureAIProvider;
      if (provider === 'auto') {
        selectedProvider = await providerFallbackManager.getOptimalProvider(canUseStreamingFeedback);
      } else {
        selectedProvider = provider;
      }

      console.log(`🔄 Selected provider: ${selectedProvider}`);

      // Create metrics collector for this session
      const sessionId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const metricsCollector = streamingMetricsManager.createCollector(
        sessionId,
        undefined, // userId - could be added from context
        selectedProvider,
        'ai/analyze-session-streaming'
      );

      // Execute analysis with fallback support
      await providerFallbackManager.executeWithFallback(async (fallbackProvider) => {
        // Try streaming first, fallback to regular analysis
        if (canUseStreamingFeedback) {
          try {
            // Check if streaming is supported
            if (api.ai.analyzeSessionStreaming) {
              console.log('🔄 Starting streaming AI analysis');
              
              // Start metrics collection
              metricsCollector.startCollection();
              
              // Update streaming state
              updateStreamingProgress({
                isStreaming: true,
                connectionStatus: 'connecting',
                progress: { 
                  bytesReceived: 0,
                  chunksProcessed: 0,
                  estimatedProgress: 5 
                }
              });
              
              // Use streaming API with fallback provider
              const stream = await api.ai.analyzeSessionStreaming(fallbackProvider, {
                ...sessionData,
                enhancedPrompts: enhancedAnalysis.prompts,
                analysisContext: enhancedContext,
                performanceInsights: enhancedAnalysis.insights,
                progressiveRecommendations: enhancedAnalysis.recommendations
              });

              // Record connection established
              metricsCollector.recordConnectionEstablished();

              updateStreamingProgress({
                connectionStatus: 'connected',
                progress: { 
                  bytesReceived: 0,
                  chunksProcessed: 0,
                  estimatedProgress: 10 
                }
              });

              const reader = stream.getReader();
              let accumulatedData = '';
              let chunksProcessed = 0;
              let bytesReceived = 0;
              let firstByteReceived = false;
              
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  
                  if (done) {
                    updateStreamingProgress({
                      connectionStatus: 'disconnected',
                      progress: { 
                        bytesReceived,
                        chunksProcessed,
                        estimatedProgress: 100 
                      }
                    });
                    
                    // Finalize metrics collection
                    const metrics = metricsCollector.endCollection(true);
                    console.log('📊 Streaming metrics:', metrics);
                    
                    break;
                  }
                  
                  // Record first byte if this is the first chunk
                  if (!firstByteReceived) {
                    metricsCollector.recordFirstByte();
                    firstByteReceived = true;
                  }
                  
                  // Record chunk received
                  metricsCollector.recordChunkReceived(value.length);
                  
                  // Update progress tracking
                  bytesReceived += value.length;
                  chunksProcessed++;
                  const estimatedProgress = Math.min(95, 10 + (chunksProcessed * 5));
                
                  updateStreamingProgress({
                    progress: {
                      bytesReceived,
                      chunksProcessed,
                      estimatedProgress
                    }
                  });
                  
                  // Process streaming data
                  accumulatedData += value;
                  
                  // Try to parse complete JSON objects from the stream
                  try {
                    const lines = accumulatedData.split('\n');
                    
                    for (let i = 0; i < lines.length - 1; i++) {
                      const line = lines[i].trim();
                      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                        const jsonStr = line.substring(6);
                        const parsed = JSON.parse(jsonStr);
                        
                        // Get provider info
                        const actualProvider = parsed.provider || 'auto';
                        const providerName = getProviderDisplayName(actualProvider);
                        
                        // Validate and enhance the response
                        const enhancedResponse = EnhancedAnalysisService.validateAndEnhanceResponse(
                          parsed,
                          enhancedContext
                        );

                        const result: SecureAIAnalysisResult = {
                          ...enhancedResponse,
                          provider: actualProvider,
                          providerDisplayName: providerName,
                        };

                        setResults([result]);
                        console.log(`✅ ${providerName} streaming analysis updated:`, result);
                        
                        // Update progress to near completion
                        updateStreamingProgress({
                          progress: { 
                            bytesReceived,
                            chunksProcessed,
                            estimatedProgress: 90 
                          }
                        });
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
                resetStreamingState();
                return;
              } catch (streamError) {
                console.error('Stream reading error:', streamError);
                
                // Record error in metrics
                metricsCollector.recordError(streamError instanceof Error ? streamError.message : 'Unknown stream error');
                
                updateStreamingProgress({
                  connectionStatus: 'error'
                });
                
                // Finalize metrics with error
                const metrics = metricsCollector.endCollection(false);
                console.log('📊 Streaming metrics (with error):', metrics);
                
                // Throw error to trigger fallback
                throw streamError;
              } finally {
                reader.releaseLock();
              }
            }
          } catch (streamError) {
            console.warn('Streaming analysis failed, falling back to regular analysis:', streamError);
            
            // Record retry in metrics if collector exists
            if (metricsCollector) {
              metricsCollector.recordRetry();
            }
            
            updateStreamingProgress({
              connectionStatus: 'error'
            });
            
            // Set a brief delay to show the error state
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Reset streaming state for fallback
        resetStreamingState();

        // Fallback to regular analysis with fallback provider
        const response = await api.ai.analyzeSession(fallbackProvider, {
          ...sessionData,
          enhancedPrompts: enhancedAnalysis.prompts,
          analysisContext: enhancedContext,
          performanceInsights: enhancedAnalysis.insights,
          progressiveRecommendations: enhancedAnalysis.recommendations
        });

        // Get provider info
        const actualProvider = fallbackProvider;
        const providerName = getProviderDisplayName(actualProvider);

        // Validate and enhance the response
        const enhancedResponse = EnhancedAnalysisService.validateAndEnhanceResponse(
          response,
          enhancedContext
        );

        const result: SecureAIAnalysisResult = {
          ...enhancedResponse,
          provider: actualProvider,
          providerDisplayName: providerName,
        };

        setResults([result]);
        console.log(`✅ ${providerName} analysis completed:`, result);
      });
    } catch (error) {
      console.error('❌ AI analysis error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMsg);

      // ENHANCED: Intelligent fallback analysis
      const enhancedSessionData = EnhancedAnalysisService.transformSessionData(sessionData);
      const fallbackContext = {
        sessionData: enhancedSessionData,
        persona: AI_PERSONAS.dr_breathe,
        userTier: 'free' as const
      };

      // Generate intelligent fallback based on session data
      const cycleCount = (sessionData as any).cycleCount || 0;
      const stillnessScore = 100 - ((sessionData as any).restlessnessScore || 50);
      const completionRate = (sessionData as any).targetCycles ? 
        Math.min(100, (cycleCount / (sessionData as any).targetCycles) * 100) : 75;

      const fallbackResponse = EnhancedAnalysisService.validateAndEnhanceResponse(
        {
          provider: 'fallback',
          analysis: `Based on your session data: You completed ${cycleCount} breathing cycles with a stillness score of ${stillnessScore}%. ${
            completionRate > 80 ? 'Excellent completion rate!' : 
            completionRate > 60 ? 'Good progress on your breathing practice.' :
            'Keep practicing to improve your completion rate.'
          } Your breathing pattern shows ${
            stillnessScore > 80 ? 'excellent focus and stillness' :
            stillnessScore > 60 ? 'good concentration with room for improvement' :
            'developing focus - try to minimize movement during practice'
          }.`,
          suggestions: [
            stillnessScore < 70 ? 'Focus on maintaining stillness throughout your practice' : 'Continue developing your excellent stillness',
            completionRate < 80 ? 'Try to complete more breathing cycles in each session' : 'Consider increasing your cycle targets',
            'Practice daily for consistent improvement'
          ],
          score: {
            overall: Math.min(100, Math.max(40, Math.round((stillnessScore + completionRate) / 2))),
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
        {
          ...fallbackContext,
          patternExpertise: null, // No specific pattern expertise for fallback analysis
          experienceLevel: 'beginner'
        }
      );

      setResults([{
        ...fallbackResponse,
        provider: 'fallback',
        providerDisplayName: 'Enhanced Fallback Analysis',
        error: `Analysis failed: ${errorMsg}`
      }]);
    } finally {
      setIsAnalyzing(false);
      resetStreamingState();
    }
  }, [resetStreamingState, updateStreamingProgress, canUseAIAnalysis, canUseStreamingFeedback, subscriptionTier]);

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
    provider: SecureAIProvider | 'auto',
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
    error,
    // Enhanced streaming state
    streamingState,
    resetStreamingState,
    updateStreamingProgress
  };
};

// Export for backward compatibility
export { useSecureAIAnalysis as useAIAnalysis };