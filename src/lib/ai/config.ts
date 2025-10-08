// AI Configuration and API Key Management
import { TieredStorageManager } from '../crypto/tiered-storage';

export interface AIProvider {
  id: string;
  name: string;
  description: string;
  requiresApiKey: boolean;
  apiKeyPlaceholder: string;
  website: string;
}

// AI providers are now handled by the Hetzner server
// Frontend only needs to know which providers are available
export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI GPT",
    description: "Advanced AI analysis (processed on Hetzner server)",
    requiresApiKey: false, // All processing on server
    apiKeyPlaceholder: "",
    website: "",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Thoughtful AI insights (processed on Hetzner server)",
    requiresApiKey: false, // All processing on server
    apiKeyPlaceholder: "",
    website: "",
  },
  {
    id: "google",
    name: "Google Gemini",
    description: "Google's multimodal AI (processed on Hetzner server)",
    requiresApiKey: false, // All processing on server
    apiKeyPlaceholder: "",
    website: "",
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
  // UNIFIED: Vision metrics integration (CLEAN separation)
  visionMetrics?: {
    confidence: number;
    postureScore: number;
    movementLevel: number;
    stillnessPercentage: number;
    consistencyScore: number;
  };
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

export interface AIPatternResponse {
  name: string;
  description: string;
  phases: Array<{
    type: 'inhale' | 'exhale' | 'hold';
    duration: number;
    instruction: string;
  }>;
  reasoning: string;
}

export interface SecureAIResponse {
  success: boolean;
  provider: string;
  analysisType: string;
  result: AIAnalysisResponse | AIPatternResponse;
  error?: string;
  message?: string;
}

export const AI_CONFIG = {
  // Hetzner server API endpoint for AI requests
  apiEndpoint: '/api/ai-analysis', // TODO: Update to use API_ENDPOINTS.ai.analysis

  providers: {
    google: {
      name: 'Google Gemini',
      model: 'gemini-1.5-flash',
      enabled: true
    },
    openai: {
      name: 'OpenAI GPT-4',
      model: 'gpt-4o-mini',
      enabled: true
    },
    anthropic: {
      name: 'Anthropic Claude',
      model: 'claude-3-haiku-20240307',
      enabled: true
    },
    auto: {
      name: 'Auto-Select',
      model: 'auto-select',
      enabled: true
    }
  },

  // Request configuration
  timeout: 30000,
  retries: 2
};

export type SecureAIProvider = keyof typeof AI_CONFIG.providers;

// All AI processing happens on the Hetzner server
// Frontend sends session data and receives analysis results
export class AIConfigManager {
  static getConfiguredProviders(): AIProvider[] {
    // All providers are available through the Hetzner server
    return AI_PROVIDERS;
  }

  static getProvider(id: string): AIProvider | undefined {
    return AI_PROVIDERS.find(provider => provider.id === id);
  }

  static clearAllKeys(): void {
    // Legacy method - no longer needed with server-based AI
    console.warn('AI keys are managed on server - no local keys to clear');
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

  /**
   * Get API key for a provider
   */
  static async getApiKey(provider: string): Promise<string | null> {
    try {
      return await TieredStorageManager.getAPIKey(provider);
    } catch (error) {
      console.warn(`Failed to get API key for ${provider}:`, error);
      return null;
    }
  }

  /**
   * Set API key for a provider
   */
  static async setApiKey(provider: string, apiKey: string): Promise<void> {
    try {
      await TieredStorageManager.setAPIKey(provider, apiKey);
    } catch (error) {
      console.error(`Failed to set API key for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Remove API key for a provider
   */
  static removeApiKey(provider: string): void {
    try {
      TieredStorageManager.removeAPIKey(provider);
    } catch (error) {
      console.warn(`Failed to remove API key for ${provider}:`, error);
    }
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
