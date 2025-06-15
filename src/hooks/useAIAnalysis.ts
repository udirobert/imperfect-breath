import { useState, useCallback } from 'react';
import { AIAnalyzer } from '@/lib/ai/providers';
import { AIConfigManager, SessionData, AIAnalysisResponse } from '@/lib/ai/config';

interface UseAIAnalysisState {
  isAnalyzing: boolean;
  analyses: AIAnalysisResponse[];
  error: string | null;
}

interface UseAIAnalysisReturn extends UseAIAnalysisState {
  analyzeSession: (sessionData: SessionData, previousSessions?: SessionData[]) => Promise<void>;
  analyzeWithProvider: (sessionData: SessionData, provider: string, previousSessions?: SessionData[]) => Promise<AIAnalysisResponse | null>;
  clearAnalyses: () => void;
  getConfiguredProviders: () => string[];
}

export const useAIAnalysis = (): UseAIAnalysisReturn => {
  const [state, setState] = useState<UseAIAnalysisState>({
    isAnalyzing: false,
    analyses: [],
    error: null
  });

  const analyzeSession = useCallback(async (
    sessionData: SessionData,
    previousSessions?: SessionData[]
  ) => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const configuredProviders = AIConfigManager.getConfiguredProviders();

      if (configuredProviders.length === 0) {
        throw new Error('No AI providers configured. Please add API keys in settings.');
      }

      const providerConfigs = configuredProviders.map(provider => ({
        provider: provider.id,
        apiKey: AIConfigManager.getApiKey(provider.id)!
      }));

      const analyses = await AIAnalyzer.analyzeWithMultipleProviders(
        { sessionData, previousSessions },
        providerConfigs
      );

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        analyses: analyses.filter(analysis => !analysis.error),
        error: analyses.every(analysis => analysis.error)
          ? 'All AI analyses failed. Please check your API keys and try again.'
          : null
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      }));
    }
  }, []);

  const analyzeWithProvider = useCallback(async (
    sessionData: SessionData,
    provider: string,
    previousSessions?: SessionData[]
  ): Promise<AIAnalysisResponse | null> => {
    const apiKey = AIConfigManager.getApiKey(provider);
    if (!apiKey) {
      throw new Error(`No API key configured for ${provider}`);
    }

    try {
      const analysis = await AIAnalyzer.analyze({
        sessionData,
        previousSessions,
        provider,
        apiKey
      });

      return analysis.error ? null : analysis;
    } catch (error) {
      console.error(`Analysis with ${provider} failed:`, error);
      return null;
    }
  }, []);

  const clearAnalyses = useCallback(() => {
    setState(prev => ({ ...prev, analyses: [], error: null }));
  }, []);

  const getConfiguredProviders = useCallback(() => {
    return AIConfigManager.getConfiguredProviders().map(p => p.id);
  }, []);

  return {
    ...state,
    analyzeSession,
    analyzeWithProvider,
    clearAnalyses,
    getConfiguredProviders
  };
};
