import { CustomPattern } from "../patternStorage";
import { BreathingPhase } from "../breathingPatterns";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { DataSanitizer } from "../validation/sanitizer";
import { AIConfigManager } from "./config";

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
      // Use direct provider integration instead of API endpoints
      switch (request.provider.toLowerCase()) {
        case "google":
        case "gemini":
          return await this.analyzeWithGemini(request);
        case "openai":
          return await this.analyzeWithOpenAI(request);
        case "anthropic":
          return await this.analyzeWithAnthropic(request);
        default:
          throw new Error(`Unsupported provider: ${request.provider}`);
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      return {
        error:
          error instanceof Error ? error.message : "Unknown AI analysis error",
      };
    }
  }

  private static async analyzeWithGemini(request: {
    sessionData: SessionData;
    previousSessions?: SessionData[];
    apiKey: string;
  }): Promise<{
    insights?: string[];
    recommendations?: string[];
    error?: string;
  }> {
    try {
      const genAI = new GoogleGenerativeAI(request.apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = this.buildAnalysisPrompt(
        request.sessionData,
        request.previousSessions,
      );
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();

      return this.parseAnalysisResponse(text);
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Gemini analysis failed",
      };
    }
  }

  private static async analyzeWithOpenAI(request: {
    sessionData: SessionData;
    previousSessions?: SessionData[];
    apiKey: string;
  }): Promise<{
    insights?: string[];
    recommendations?: string[];
    error?: string;
  }> {
    try {
      const openai = new OpenAI({
        apiKey: request.apiKey,
        dangerouslyAllowBrowser: true,
      });

      const prompt = this.buildAnalysisPrompt(
        request.sessionData,
        request.previousSessions,
      );
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an expert wellness and breathing coach. Provide insights and recommendations based on breathing session data.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const responseText = completion.choices[0]?.message?.content || "";
      return this.parseAnalysisResponse(responseText);
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "OpenAI analysis failed",
      };
    }
  }

  private static async analyzeWithAnthropic(request: {
    sessionData: SessionData;
    previousSessions?: SessionData[];
    apiKey: string;
  }): Promise<{
    insights?: string[];
    recommendations?: string[];
    error?: string;
  }> {
    try {
      const anthropic = new Anthropic({
        apiKey: request.apiKey,
        dangerouslyAllowBrowser: true,
      });

      const prompt = this.buildAnalysisPrompt(
        request.sessionData,
        request.previousSessions,
      );
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `You are an expert wellness and breathing coach. ${prompt}`,
          },
        ],
      });

      const responseText =
        message.content[0]?.type === "text" ? message.content[0].text : "";
      return this.parseAnalysisResponse(responseText);
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Anthropic analysis failed",
      };
    }
  }

  private static buildAnalysisPrompt(
    sessionData: SessionData,
    previousSessions?: SessionData[],
  ): string {
    const historyText =
      previousSessions && previousSessions.length > 0
        ? `\n\nPrevious sessions:\n${previousSessions
            .map(
              (session, i) =>
                `Session ${i + 1}: ${session.pattern_name}, Duration: ${session.session_duration}s, Hold: ${session.breath_hold_time}s, Restlessness: ${session.restlessness_score}`,
            )
            .join("\n")}`
        : "";

    return `Analyze this breathing session and provide insights and recommendations:

Current Session:
- Pattern: ${sessionData.pattern_name}
- Duration: ${sessionData.session_duration} seconds
- Breath Hold: ${sessionData.breath_hold_time} seconds
- Restlessness Score: ${sessionData.restlessness_score}/100${historyText}

Please provide:
1. Key insights about the session performance
2. Specific recommendations for improvement

Format as JSON with "insights" and "recommendations" arrays.`;
  }

  private static parseAnalysisResponse(responseText: string): {
    insights?: string[];
    recommendations?: string[];
    error?: string;
  } {
    try {
      const sanitizedResponse = DataSanitizer.sanitizeText(responseText, {
        maxLength: 2000,
      });

      // Try to extract JSON
      const jsonMatch = sanitizedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          insights: Array.isArray(parsed.insights) ? parsed.insights : [],
          recommendations: Array.isArray(parsed.recommendations)
            ? parsed.recommendations
            : [],
        };
      }

      // Fallback parsing
      const lines = sanitizedResponse.split("\n").filter((line) => line.trim());
      return {
        insights: lines.slice(0, 3),
        recommendations: lines.slice(3, 6),
      };
    } catch (error) {
      return {
        insights: ["Session completed successfully"],
        recommendations: ["Continue regular practice"],
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
      // Try to get API key for available providers
      const providers = ["google", "openai", "anthropic"];
      let generatedPattern: CustomPattern | null = null;
      let reasoning = "";

      for (const provider of providers) {
        try {
          const apiKey = await AIConfigManager.getApiKey(provider);
          if (apiKey) {
            const result = await this.generateWithProvider(
              request,
              provider,
              apiKey,
            );
            if (result) {
              generatedPattern = result.pattern;
              reasoning = result.reasoning;
              break;
            }
          }
        } catch (error) {
          console.warn(`Pattern generation failed with ${provider}:`, error);
          continue;
        }
      }

      if (generatedPattern) {
        return {
          pattern: generatedPattern,
          reasoning,
          adaptations: [],
          confidence: 0.8,
        };
      }

      // Return a basic fallback pattern if all providers fail
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
    } catch (error) {
      console.error("Pattern generation error:", error);

      // Return a basic fallback pattern if everything fails
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

  private static async generateWithProvider(
    request: PatternGenerationRequest,
    provider: string,
    apiKey: string,
  ): Promise<{ pattern: CustomPattern; reasoning: string } | null> {
    const prompt = this.buildPatternPrompt(request);

    try {
      let responseText = "";

      switch (provider) {
        case "google": {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-pro" });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          responseText = await response.text();
          break;
        }

        case "openai": {
          const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
          const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: "You are an expert breathing pattern designer.",
              },
              { role: "user", content: prompt },
            ],
            max_tokens: 800,
            temperature: 0.8,
          });
          responseText = completion.choices[0]?.message?.content || "";
          break;
        }

        case "anthropic": {
          const anthropic = new Anthropic({
            apiKey,
            dangerouslyAllowBrowser: true,
          });
          const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 800,
            messages: [
              {
                role: "user",
                content: `You are an expert breathing pattern designer. ${prompt}`,
              },
            ],
          });
          responseText =
            message.content[0]?.type === "text" ? message.content[0].text : "";
          break;
        }

        default:
          return null;
      }

      return this.parsePatternResponse(responseText, request);
    } catch (error) {
      console.error(`Pattern generation failed with ${provider}:`, error);
      return null;
    }
  }

  private static buildPatternPrompt(request: PatternGenerationRequest): string {
    const historyText =
      request.userHistory && request.userHistory.length > 0
        ? `\n\nUser's recent sessions:\n${request.userHistory
            .map(
              (session) =>
                `- ${session.pattern_name}: ${session.session_duration}s, Hold: ${session.breath_hold_time}s`,
            )
            .join("\n")}`
        : "";

    return `Create a custom breathing pattern based on: "${request.prompt}"

Preferences:
- Category: ${request.preferences?.preferredCategory || "any"}
- Difficulty: ${request.preferences?.preferredDifficulty || "beginner"}
- Duration: ${request.duration || 60} seconds${historyText}

Respond with JSON format:
{
  "name": "Pattern Name",
  "description": "Brief description",
  "phases": [
    {"name": "inhale", "duration": 4, "text": "Breathe in slowly"},
    {"name": "hold", "duration": 2, "text": "Hold your breath"},
    {"name": "exhale", "duration": 6, "text": "Exhale completely"}
  ],
  "category": "stress|sleep|energy|focus",
  "difficulty": "beginner|intermediate|advanced",
  "reasoning": "Why this pattern works for the request"
}`;
  }

  private static parsePatternResponse(
    responseText: string,
    request: PatternGenerationRequest,
  ): { pattern: CustomPattern; reasoning: string } | null {
    try {
      const sanitizedResponse = DataSanitizer.sanitizeText(responseText, {
        maxLength: 3000,
      });
      const jsonMatch = sanitizedResponse.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        const pattern: CustomPattern = {
          id: `ai-generated-${Date.now()}`,
          name: parsed.name || "AI Generated Pattern",
          description: parsed.description || "Custom breathing pattern",
          phases: Array.isArray(parsed.phases)
            ? parsed.phases
            : [
                { name: "inhale", duration: 4, text: "Breathe in" },
                { name: "hold", duration: 2, text: "Hold" },
                { name: "exhale", duration: 6, text: "Breathe out" },
              ],
          category:
            parsed.category ||
            request.preferences?.preferredCategory ||
            "stress",
          difficulty: parsed.difficulty || "beginner",
          duration: request.duration || 60,
          creator: "AI Assistant",
        };

        return {
          pattern,
          reasoning: parsed.reasoning || "Generated based on your request",
        };
      }
    } catch (error) {
      console.error("Failed to parse pattern response:", error);
    }

    return null;
  }

  static async enhanceExistingPattern(
    pattern: CustomPattern,
    userFeedback: string,
  ): Promise<CustomPattern> {
    console.log("Enhancing pattern:", pattern, "with feedback:", userFeedback);

    try {
      // Try to enhance with available AI providers
      const providers = ["google", "openai", "anthropic"];

      for (const provider of providers) {
        try {
          const apiKey = await AIConfigManager.getApiKey(provider);
          if (apiKey) {
            const enhanced = await this.enhanceWithProvider(
              pattern,
              userFeedback,
              provider,
              apiKey,
            );
            if (enhanced) {
              return enhanced;
            }
          }
        } catch (error) {
          console.warn(`Pattern enhancement failed with ${provider}:`, error);
          continue;
        }
      }

      // If AI enhancement fails, apply basic modifications based on feedback
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
    } catch (error) {
      console.error("Pattern enhancement error:", error);
      return pattern; // Return original pattern if enhancement fails
    }
  }

  private static async enhanceWithProvider(
    pattern: CustomPattern,
    userFeedback: string,
    provider: string,
    apiKey: string,
  ): Promise<CustomPattern | null> {
    const prompt = `Enhance this breathing pattern based on user feedback:

Current Pattern: ${pattern.name}
Description: ${pattern.description}
Phases: ${JSON.stringify(pattern.phases)}
User Feedback: "${userFeedback}"

Please modify the pattern to address the feedback. Respond with enhanced pattern in JSON format:
{
  "name": "Enhanced Pattern Name",
  "description": "Updated description",
  "phases": [{"name": "inhale", "duration": 4, "text": "Instruction"}],
  "category": "${pattern.category}",
  "difficulty": "${pattern.difficulty}"
}`;

    try {
      let responseText = "";

      switch (provider) {
        case "google": {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-pro" });
          const result = await model.generateContent(prompt);
          responseText = await result.response.text();
          break;
        }

        case "openai": {
          const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
          const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: "You are an expert breathing pattern designer.",
              },
              { role: "user", content: prompt },
            ],
            max_tokens: 600,
          });
          responseText = completion.choices[0]?.message?.content || "";
          break;
        }

        case "anthropic": {
          const anthropic = new Anthropic({
            apiKey,
            dangerouslyAllowBrowser: true,
          });
          const message = await anthropic.messages.create({
            model: "claude-3-sonnet-20240229",
            max_tokens: 1500,
            messages: [{ role: "user", content: prompt }],
          });
          responseText =
            message.content[0]?.type === "text" ? message.content[0].text : "";
          break;
        }

        default:
          return null;
      }

      const sanitizedResponse = DataSanitizer.sanitizeText(responseText, {
        maxLength: 2000,
      });
      const jsonMatch = sanitizedResponse.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...pattern,
          id: `enhanced-${pattern.id}-${Date.now()}`,
          name: parsed.name || pattern.name,
          description: parsed.description || pattern.description,
          phases: Array.isArray(parsed.phases) ? parsed.phases : pattern.phases,
        };
      }
    } catch (error) {
      console.error(`Enhancement failed with ${provider}:`, error);
    }

    return null;
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
      // Try to personalize with available AI providers
      const providers = ["google", "openai", "anthropic"];

      for (const provider of providers) {
        try {
          const apiKey = await AIConfigManager.getApiKey(provider);
          if (apiKey) {
            const personalized = await this.personalizeWithProvider(
              pattern,
              userHistory,
              provider,
              apiKey,
            );
            if (personalized) {
              return personalized;
            }
          }
        } catch (error) {
          console.warn(
            `Pattern personalization failed with ${provider}:`,
            error,
          );
          continue;
        }
      }

      // If AI personalization fails, apply basic personalization based on history
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
        const avgRestlessness =
          userHistory
            .filter((session) => session.restlessness_score !== undefined)
            .reduce(
              (sum, session) => sum + (session.restlessness_score || 0),
              0,
            ) /
          userHistory.filter(
            (session) => session.restlessness_score !== undefined,
          ).length;

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
    } catch (error) {
      console.error("Pattern personalization error:", error);
      return pattern; // Return original pattern if personalization fails
    }
  }

  private static async personalizeWithProvider(
    pattern: CustomPattern,
    userHistory: SessionData[],
    provider: string,
    apiKey: string,
  ): Promise<CustomPattern | null> {
    const historyText =
      userHistory.length > 0
        ? userHistory
            .map(
              (session) =>
                `- ${session.pattern_name}: Duration ${session.session_duration}s, Hold ${session.breath_hold_time}s, Restlessness ${session.restlessness_score}/100`,
            )
            .join("\n")
        : "No previous sessions";

    const prompt = `Personalize this breathing pattern based on user's session history:

Current Pattern: ${pattern.name}
Description: ${pattern.description}
Phases: ${JSON.stringify(pattern.phases)}
Difficulty: ${pattern.difficulty}

User History:
${historyText}

Analyze the user's performance and adapt the pattern accordingly. Respond with personalized pattern in JSON format:
{
  "name": "Personalized Pattern Name",
  "description": "Updated description explaining personalization",
  "phases": [{"name": "inhale", "duration": 4, "text": "Instruction"}],
  "difficulty": "beginner|intermediate|advanced"
}`;

    try {
      let responseText = "";

      switch (provider) {
        case "google": {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-pro" });
          const result = await model.generateContent(prompt);
          responseText = await result.response.text();
          break;
        }

        case "openai": {
          const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
          const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert breathing coach who personalizes patterns based on user performance.",
              },
              { role: "user", content: prompt },
            ],
            max_tokens: 600,
          });
          responseText = completion.choices[0]?.message?.content || "";
          break;
        }

        case "anthropic": {
          const anthropic = new Anthropic({
            apiKey,
            dangerouslyAllowBrowser: true,
          });
          const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 600,
            messages: [{ role: "user", content: prompt }],
          });
          responseText =
            message.content[0]?.type === "text" ? message.content[0].text : "";
          break;
        }

        default:
          return null;
      }

      const sanitizedResponse = DataSanitizer.sanitizeText(responseText, {
        maxLength: 2000,
      });
      const jsonMatch = sanitizedResponse.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...pattern,
          id: `personalized-${pattern.id}-${Date.now()}`,
          name: parsed.name || pattern.name,
          description: parsed.description || pattern.description,
          phases: Array.isArray(parsed.phases) ? parsed.phases : pattern.phases,
          difficulty: parsed.difficulty || pattern.difficulty,
        };
      }
    } catch (error) {
      console.error(`Personalization failed with ${provider}:`, error);
    }

    return null;
  }
}
