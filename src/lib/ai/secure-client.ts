import { AI_CONFIG, type SecureAIProvider, type AIAnalysisResponse, type AIPatternResponse, type SecureAIResponse } from './config';

export class SecureAIClient {
  private static async makeRequest(
    provider: SecureAIProvider,
    sessionData: any,
    analysisType: 'session' | 'pattern' = 'session'
  ): Promise<SecureAIResponse> {
    // Use relative path for Netlify functions, or construct full URL only if needed
    const endpoint = AI_CONFIG.apiEndpoint;

    const requestBody = {
      provider,
      sessionData,
      analysisType
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  static async analyzeSession(
    provider: SecureAIProvider,
    sessionData: {
      pattern?: string;
      duration?: number;
      averageBpm?: number;
      consistencyScore?: number;
      restlessnessScore?: number;
      breathHoldDuration?: number;
    }
  ): Promise<AIAnalysisResponse> {
    try {
      const response = await this.makeRequest(provider, sessionData, 'session');
      
      if (!response.success) {
        throw new Error(response.message || 'AI analysis failed');
      }

      return response.result as AIAnalysisResponse;
    } catch (error) {
      console.error(`AI Analysis failed for ${provider}:`, error);
      
      // Return fallback response
      return {
        provider: provider,
        analysis: "Unable to connect to AI service. Here's some general feedback based on your session.",
        suggestions: [
          "Continue practicing regularly to build consistency",
          "Focus on maintaining steady breathing rhythm",
          "Try extending your session duration gradually"
        ],
        score: {
          overall: 75,
          focus: 70,
          consistency: 80,
          progress: 75
        },
        nextSteps: [
          "Practice the same pattern for a few more sessions",
          "Experiment with different breathing techniques",
          "Track your progress over time"
        ]
      };
    }
  }

  static async generatePattern(
    provider: SecureAIProvider,
    sessionData: {
      consistencyScore?: number;
      restlessnessScore?: number;
      averageBpm?: number;
      experienceLevel?: string;
    }
  ): Promise<AIPatternResponse> {
    try {
      const response = await this.makeRequest(provider, sessionData, 'pattern');
      
      if (!response.success) {
        throw new Error(response.message || 'Pattern generation failed');
      }

      return response.result as AIPatternResponse;
    } catch (error) {
      console.error(`Pattern generation failed for ${provider}:`, error);
      
      // Return fallback pattern
      return {
        name: "Calming 4-7-8 Breath",
        description: "A relaxing breathing pattern that helps reduce stress and promote calmness",
        phases: [
          {
            type: "inhale",
            duration: 4,
            instruction: "Breathe in slowly through your nose"
          },
          {
            type: "hold",
            duration: 7,
            instruction: "Hold your breath gently"
          },
          {
            type: "exhale",
            duration: 8,
            instruction: "Exhale completely through your mouth"
          }
        ],
        reasoning: "This 4-7-8 pattern is excellent for relaxation and stress relief. The longer exhale helps activate your parasympathetic nervous system."
      };
    }
  }

  static async testConnection(provider: SecureAIProvider): Promise<boolean> {
    try {
      const testData = {
        pattern: "Box Breathing",
        duration: 60,
        averageBpm: 12,
        consistencyScore: 80,
        restlessnessScore: 20,
        breathHoldDuration: 4
      };

      const response = await this.makeRequest(provider, testData, 'session');
      return response.success;
    } catch (error) {
      console.error(`Connection test failed for ${provider}:`, error);
      return false;
    }
  }

  static getAvailableProviders(): SecureAIProvider[] {
    return Object.keys(AI_CONFIG.providers) as SecureAIProvider[];
  }

  static getProviderInfo(provider: SecureAIProvider) {
    return AI_CONFIG.providers[provider];
  }
}

