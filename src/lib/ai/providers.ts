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
    // Mock implementation - replace with actual AI API call
    console.log("Analyzing session with provider:", request.provider);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      insights: ["Good breathing consistency", "Improved focus detected"],
      recommendations: ["Try longer hold phases", "Consider evening sessions"],
    };
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
    // Placeholder for actual AI API call
    // This would integrate with an AI service like OpenAI or a custom model
    console.log("Generating pattern with request:", request);

    // Mock response for development purposes
    const mockPattern: CustomPattern = {
      id: `ai-generated-${Date.now()}`,
      name: request.prompt.split(" ").slice(0, 3).join(" ") || "AI Pattern",
      description: `Generated based on: ${request.prompt}`,
      phases: [
        { name: "inhale", duration: 4, text: "Breathe in deeply" },
        { name: "hold", duration: 2, text: "Hold your breath" },
        { name: "exhale", duration: 6, text: "Slowly exhale" },
      ],
      category: request.preferences?.preferredCategory || "stress",
      difficulty: request.preferences?.preferredDifficulty || "beginner",
      duration:
        request.duration || request.preferences?.preferredDuration || 60,
      creator: "AI Generator",
    };

    return {
      pattern: mockPattern,
      reasoning:
        "This pattern was generated based on the provided prompt and user preferences. It aims to provide a calming effect through controlled breathing.",
      adaptations: [
        "Adjusted duration based on user history",
        "Selected stress relief category for calming effect",
      ],
      confidence: 0.85,
    };
  }

  static async enhanceExistingPattern(
    pattern: CustomPattern,
    userFeedback: string,
  ): Promise<CustomPattern> {
    // Placeholder for actual AI API call to enhance an existing pattern
    console.log("Enhancing pattern:", pattern, "with feedback:", userFeedback);

    // Mock enhancement for development
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

  static async personalizePattern(
    pattern: CustomPattern,
    userHistory: SessionData[],
  ): Promise<CustomPattern> {
    // Placeholder for actual AI API call to personalize a pattern based on user history
    console.log(
      "Personalizing pattern:",
      pattern,
      "with user history:",
      userHistory,
    );

    // Mock personalization for development
    const personalizedPattern = { ...pattern };
    if (userHistory.length > 0) {
      const avgDuration =
        userHistory.reduce(
          (sum, session) => sum + session.session_duration,
          0,
        ) / userHistory.length;
      personalizedPattern.duration = Math.round(avgDuration);
      personalizedPattern.description +=
        " (Personalized based on your session history)";
    }

    return personalizedPattern;
  }
}
