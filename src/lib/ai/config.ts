// AI Configuration and API Key Management
export interface AIProvider {
  id: string;
  name: string;
  description: string;
  requiresApiKey: boolean;
  apiKeyPlaceholder: string;
  website: string;
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI GPT",
    description: "Advanced AI analysis with GPT-4",
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-...",
    website: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Thoughtful AI insights with Claude",
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-ant-...",
    website: "https://console.anthropic.com/",
  },
  {
    id: "google",
    name: "Google Gemini",
    description: "Google's multimodal AI analysis",
    requiresApiKey: true,
    apiKeyPlaceholder: "AIza...",
    website: "https://aistudio.google.com/app/apikey",
  },
];

export interface SessionData {
  patternID?: number; // The ID of the NFT pattern used
  patternName: string;
  sessionDuration: number; // in seconds
  breathHoldTime: number; // in seconds
  restlessnessScore: number; // 0-100
  bpm?: number; // Breaths per minute, if calculated
  landmarks?: number; // Number of facial landmarks detected
  timestamp?: string; // Session timestamp
  // Add other relevant session metrics here
}

export interface AIAnalysisRequest {
  sessionData: SessionData;
  previousSessions?: SessionData[];
  provider: string;
  apiKey: string;
}

export interface AIAnalysisResponse {
  provider: string;
  analysis: string;
  suggestions: string[];
  score: {
    overall: number;
    focus: number;
    consistency: number;
    progress: number;
  };
  nextSteps: string[];
  error?: string;
}

import { TieredStorageManager } from '../crypto/tiered-storage';

export class AIConfigManager {
  static async setApiKey(provider: string, apiKey: string): Promise<void> {
    await TieredStorageManager.setAPIKey(provider, apiKey);
  }

  static async getApiKey(provider: string): Promise<string | null> {
    return await TieredStorageManager.getAPIKey(provider);
  }

  static removeApiKey(provider: string): void {
    TieredStorageManager.removeAPIKey(provider);
  }

  static hasApiKey(provider: string): boolean {
    return TieredStorageManager.hasAPIKey(provider);
  }

  static getConfiguredProviders(): AIProvider[] {
    const configuredProviderIds = TieredStorageManager.getConfiguredProviders();
    return AI_PROVIDERS.filter((provider) => configuredProviderIds.includes(provider.id));
  }

  static clearAllKeys(): void {
    TieredStorageManager.clearAllAPIKeys();
  }

  /**
   * Initialize storage system and migrate from previous storage if needed
   */
  static async initialize(): Promise<void> {
    try {
      await TieredStorageManager.initialize();
      await TieredStorageManager.migrateFromOldStorage();
    } catch (error) {
      console.warn('Failed to initialize or migrate storage:', error);
    }
  }

  /**
   * Check if secure storage is supported
   */
  static isSecureStorageSupported(): boolean {
    return TieredStorageManager.isSecureStorageSupported();
  }
}

// System prompt for AI analysis
export const ANALYSIS_SYSTEM_PROMPT = `You are an expert wellness and breathing coach analyzing meditation session data.

Your task is to provide helpful, actionable insights based on:
- Breath hold time (seconds)
- Restlessness score (0-100, where 0 is perfectly still)
- Breathing pattern used
- Session duration
- Historical progress (if available)

Provide:
1. Clear analysis of performance
2. Specific suggestions for improvement
3. Numerical scores (0-100) for overall, focus, consistency, and progress
4. 2-3 concrete next steps

Be encouraging but honest. Focus on practical advice for improving focus, stillness, and breathing technique.`;

export const formatSessionPrompt = (
  data: SessionData,
  previousSessions?: SessionData[],
): string => {
  const historyText =
    previousSessions && previousSessions.length > 0
      ? `\n\nPrevious sessions for comparison:\n${previousSessions
          .map(
            (session, i) =>
              `Session ${i + 1}: ${session.patternName}, Hold: ${session.breathHoldTime}s, Restlessness: ${session.restlessnessScore}, Duration: ${session.sessionDuration}s`,
          )
          .join("\n")}`
      : "";

  return `Current Session Analysis:
- Breathing Pattern: ${data.patternName}
- Breath Hold Time: ${data.breathHoldTime} seconds
- Restlessness Score: ${data.restlessnessScore}/100 (lower is better)
- Session Duration: ${data.sessionDuration} seconds
- Facial landmarks detected: ${data.landmarks || 0} points
- Timestamp: ${data.timestamp}${historyText}

Please provide your analysis and recommendations.`;
};
