import { CustomPattern } from "../patternStorage";
import { BreathingPhase } from "../breathingPatterns";

// Re-export CustomPattern for use in other modules
export type { CustomPattern } from "../patternStorage";

export interface SessionData {
  id: string;
  user_id: string;
  created_at: string;
  session_duration: number;
  breath_hold_time: number;
  restlessness_score: number;
  pattern_name: string;
}

export interface PatternGenerationRequest {
  prompt: string;
  userHistory?: SessionData[];
  preferences?: UserPreferences;
  duration?: number;
}

export interface PatternGenerationResponse {
  pattern: CustomPattern;
  reasoning: string;
  adaptations: string[];
  confidence: number;
}

export interface UserPreferences {
  preferredCategory?: "stress" | "sleep" | "energy" | "focus";
  preferredDifficulty?: "beginner" | "intermediate" | "advanced";
  preferredDuration?: number;
}

export class AIAnalyzer {
  static async analyze(request: {
    sessionData: SessionData;
    previousSessions?: SessionData[];
    provider: string;
    apiKey: string;
  }): Promise<{
    error?: string;
    insights?: string[];
    recommendations?: string[];
  }> {
    console.log("Analyzing session with provider:", request.provider);
    
    try {
      // Make an actual API call to the AI provider
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': request.apiKey
        },
        body: JSON.stringify({
          provider: request.provider,
          sessionData: request.sessionData,
          previousSessions: request.previousSessions || []
        })
      });
      
      if (!response.ok) {
        throw new Error(`AI Analysis failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("AI analysis error:", error);
      return {
        error: error instanceof Error ? error.message : "Unknown AI analysis error"
      };
    }
  }

  static async analyzeWithMultipleProviders(
    request: { sessionData: SessionData; previousSessions?: SessionData[] },
    providerConfigs: { provider: string; apiKey: string }[],
  ): Promise<
    { error?: string; insights?: string[]; recommendations?: string[] }[]
  > {
    const results = await Promise.all(
      providerConfigs.map((config) =>
        this.analyze({
          ...request,
          provider: config.provider,
          apiKey: config.apiKey,
        }),
      ),
    );

    return results;
  }
}

export class AIPatternGenerator {
  static async generatePattern(
    request: PatternGenerationRequest,
  ): Promise<PatternGenerationResponse> {
    console.log("Generating pattern with request:", request);

    try {
      // Make an actual API call to the AI service
      const response = await fetch('/api/ai/generate-pattern', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: request.prompt,
          userHistory: request.userHistory || [],
          preferences: request.preferences || {},
          duration: request.duration
        })
      });
      
      if (!response.ok) {
        throw new Error(`Pattern generation failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Pattern generation error:", error);
      
      // Return a basic fallback pattern if API call fails
      const fallbackPattern: CustomPattern = {
        id: `ai-fallback-${Date.now()}`,
        name: "Basic Breathing Pattern",
        description: "A simple breathing pattern to help you relax.",
        phases: [
          { name: "inhale", duration: 4, text: "Breathe in deeply" },
          { name: "hold", duration: 2, text: "Hold your breath" },
          { name: "exhale", duration: 6, text: "Slowly exhale" },
        ],
        category: request.preferences?.preferredCategory || "stress",
        difficulty: "beginner",
        duration: 60,
        creator: "System",
      };
      
      return {
        pattern: fallbackPattern,
        reasoning: "Fallback pattern due to generation error.",
        adaptations: [],
        confidence: 0.5,
      };
    }
  }

  static async enhanceExistingPattern(
    pattern: CustomPattern,
    userFeedback: string,
  ): Promise<CustomPattern> {
    console.log("Enhancing pattern:", pattern, "with feedback:", userFeedback);

    try {
      // Make an actual API call to enhance the pattern
      const response = await fetch('/api/ai/enhance-pattern', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pattern,
          feedback: userFeedback
        })
      });
      
      if (!response.ok) {
        throw new Error(`Pattern enhancement failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Pattern enhancement error:", error);
      
      // If API call fails, apply basic modifications based on feedback
      const enhancedPattern = { ...pattern };
      if (userFeedback.toLowerCase().includes("too fast")) {
        enhancedPattern.phases = enhancedPattern.phases.map((phase) => ({
          ...phase,
          duration: phase.duration + 1,
        }));
        enhancedPattern.duration += enhancedPattern.phases.length;
      } else if (userFeedback.toLowerCase().includes("too slow")) {
        enhancedPattern.phases = enhancedPattern.phases.map((phase) => ({
          ...phase,
          duration: Math.max(1, phase.duration - 1),
        }));
        enhancedPattern.duration = Math.max(
          10,
          enhancedPattern.duration - enhancedPattern.phases.length,
        );
      }
      
      return enhancedPattern;
    }
  }

  static async personalizePattern(
    pattern: CustomPattern,
    userHistory: SessionData[],
  ): Promise<CustomPattern> {
    console.log(
      "Personalizing pattern:",
      pattern,
      "with user history:",
      userHistory,
    );

    try {
      // Make an actual API call to personalize the pattern
      const response = await fetch('/api/ai/personalize-pattern', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pattern,
          userHistory
        })
      });
      
      if (!response.ok) {
        throw new Error(`Pattern personalization failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Pattern personalization error:", error);
      
      // If API call fails, apply basic personalization based on history
      const personalizedPattern = { ...pattern };
      if (userHistory.length > 0) {
        // Calculate average session duration from user history
        const avgDuration =
          userHistory.reduce(
            (sum, session) => sum + session.session_duration,
            0,
          ) / userHistory.length;
        
        // Apply personalization adjustments
        personalizedPattern.duration = Math.round(avgDuration);
        
        // Calculate average restlessness score if available
        const avgRestlessness = userHistory
          .filter(session => session.restlessness_score !== undefined)
          .reduce((sum, session) => sum + (session.restlessness_score || 0), 0) /
          userHistory.filter(session => session.restlessness_score !== undefined).length;
        
        // Adjust difficulty based on restlessness if we have that data
        if (!isNaN(avgRestlessness)) {
          if (avgRestlessness > 70) {
            personalizedPattern.difficulty = "beginner";
          } else if (avgRestlessness < 30) {
            personalizedPattern.difficulty = "advanced";
          } else {
            personalizedPattern.difficulty = "intermediate";
          }
        }
        
        personalizedPattern.description +=
          " (Personalized based on your session history)";
      }
      
      return personalizedPattern;
    }
  }
}
