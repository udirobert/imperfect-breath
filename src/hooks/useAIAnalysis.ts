import { useState, useCallback } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { useFlow } from "../hooks/useFlow";
import { config, debugLog } from "../config/environment";
import { supabase } from "../integrations/supabase/client";
import { useBreathingSessionValidation } from "../hooks/useValidation";
import { DataSanitizer } from "../lib/validation/sanitizer";
import { AIConfigManager } from "../lib/ai/config";
import { AITrialManager } from "../lib/ai/trial-manager";
import { SecureAIClient } from "../lib/ai/secure-client";

export interface SessionData {
  patternName: string;
  sessionDuration: number; // in seconds
  breathHoldTime?: number;
  restlessnessScore?: number;
  bpm?: number;
  consistencyScore?: number;
  cycleCount?: number;
  timestamp?: string;
  landmarks?: number;
}

export type AIProvider = "google" | "openai" | "anthropic";

export interface AIAnalysisResult {
  provider: string;
  analysis: string;
  suggestions: string[];
  nextSteps: string[];
  score: {
    overall: number;
    focus: number;
    consistency: number;
    progress: number;
  };
  error?: string;
}

export const useAIAnalysis = () => {
  const [analyses, setAnalyses] = useState<AIAnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { executeTransaction } = useFlow();
  const { validateSession } = useBreathingSessionValidation();

  const analyzeWithGemini = useCallback(
    async (
      sessionData: SessionData,
      apiKey: string,
    ): Promise<AIAnalysisResult> => {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = buildAnalysisPrompt(sessionData);
        debugLog("Sending prompt to Gemini:", prompt);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        debugLog("Gemini response:", text);

        // Sanitize the response text
        const sanitizedResponse = DataSanitizer.sanitizeText(text, {
          maxLength: 5000,
        });

        // Attempt to parse the JSON response
        let parsedResult: {
          analysis?: string;
          suggestions?: string[];
          nextSteps?: string[];
          score?: {
            overall?: number;
            focus?: number;
            consistency?: number;
            progress?: number;
          };
        };
        try {
          // Clean the response text to extract JSON
          const jsonMatch = sanitizedResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResult = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("No JSON found in response");
          }
        } catch (jsonError) {
          console.error(
            "Failed to parse Gemini response as JSON:",
            sanitizedResponse,
            jsonError,
          );
          // Fallback if JSON parsing fails
          parsedResult = createFallbackAnalysis(sessionData, sanitizedResponse);
        }

        // Sanitize the parsed result
        const analysisResult: AIAnalysisResult = {
          provider: "gemini",
          analysis: DataSanitizer.sanitizeText(
            parsedResult.analysis || "Analysis completed successfully.",
            { maxLength: 2000 },
          ),
          suggestions: Array.isArray(parsedResult.suggestions)
            ? parsedResult.suggestions.map((s: string) =>
                DataSanitizer.sanitizeText(s, { maxLength: 200 }),
              )
            : ["Continue practicing regularly"],
          nextSteps: Array.isArray(parsedResult.nextSteps)
            ? parsedResult.nextSteps.map((s: string) =>
                DataSanitizer.sanitizeText(s, { maxLength: 200 }),
              )
            : ["Try a longer session next time"],
          score: {
            overall: Math.min(
              100,
              Math.max(
                0,
                DataSanitizer.sanitizeNumber(
                  parsedResult.score?.overall || calculateDynamicScores(sessionData).overall,
                  false,
                ) ?? calculateDynamicScores(sessionData).overall,
              ),
            ),
            focus: Math.min(
              100,
              Math.max(
                0,
                DataSanitizer.sanitizeNumber(
                  parsedResult.score?.focus || calculateDynamicScores(sessionData).focus,
                  false,
                ) ?? calculateDynamicScores(sessionData).focus,
              ),
            ),
            consistency: Math.min(
              100,
              Math.max(
                0,
                DataSanitizer.sanitizeNumber(
                  parsedResult.score?.consistency || calculateDynamicScores(sessionData).consistency,
                  false,
                ) ?? calculateDynamicScores(sessionData).consistency,
              ),
            ),
            progress: Math.min(
              100,
              Math.max(
                0,
                DataSanitizer.sanitizeNumber(
                  parsedResult.score?.progress || calculateDynamicScores(sessionData).progress,
                  false,
                ) ?? calculateDynamicScores(sessionData).progress,
              ),
            ),
          },
        };

        debugLog("Processed analysis result:", analysisResult);
        return analysisResult;
      } catch (err) {
        console.error("Gemini analysis failed:", err);
        throw err; // Re-throw to be handled by the main analyzeWithProvider function
      }
    },
    [],
  );

  const analyzeWithOpenAI = useCallback(
    async (
      sessionData: SessionData,
      apiKey: string,
    ): Promise<AIAnalysisResult> => {
      try {
        const openai = new OpenAI({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true, // Only for client-side usage, consider server-side for production
        });

        const prompt = buildAnalysisPrompt(sessionData);
        debugLog("Sending prompt to OpenAI:", prompt);

        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "You are an expert wellness and breathing coach. Analyze the breathing session data and provide structured feedback in JSON format.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        });

        const responseText = completion.choices[0]?.message?.content || "";
        debugLog("OpenAI response:", responseText);

        // Sanitize the response text
        const sanitizedResponse = DataSanitizer.sanitizeText(responseText, {
          maxLength: 5000,
        });

        // Attempt to parse the JSON response
        let parsedResult: {
          analysis?: string;
          suggestions?: string[];
          nextSteps?: string[];
          score?: {
            overall?: number;
            focus?: number;
            consistency?: number;
            progress?: number;
          };
        };
        try {
          const jsonMatch = sanitizedResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResult = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("No JSON found in response");
          }
        } catch (jsonError) {
          console.error(
            "Failed to parse OpenAI response as JSON:",
            sanitizedResponse,
            jsonError,
          );
          parsedResult = createFallbackAnalysis(sessionData, sanitizedResponse);
        }

        const analysisResult: AIAnalysisResult = {
          provider: "openai",
          analysis: DataSanitizer.sanitizeText(
            parsedResult.analysis || "Analysis completed successfully.",
            { maxLength: 2000 },
          ),
          suggestions: Array.isArray(parsedResult.suggestions)
            ? parsedResult.suggestions.map((s: string) =>
                DataSanitizer.sanitizeText(s, { maxLength: 200 }),
              )
            : ["Continue practicing regularly"],
          nextSteps: Array.isArray(parsedResult.nextSteps)
            ? parsedResult.nextSteps.map((s: string) =>
                DataSanitizer.sanitizeText(s, { maxLength: 200 }),
              )
            : ["Try a longer session next time"],
          score: {
            overall: Math.min(
              100,
              Math.max(
                0,
                DataSanitizer.sanitizeNumber(
                  parsedResult.score?.overall || calculateDynamicScores(sessionData).overall,
                  false,
                ) ?? calculateDynamicScores(sessionData).overall,
              ),
            ),
            focus: Math.min(
              100,
              Math.max(
                0,
                DataSanitizer.sanitizeNumber(
                  parsedResult.score?.focus || calculateDynamicScores(sessionData).focus,
                  false,
                ) ?? calculateDynamicScores(sessionData).focus,
              ),
            ),
            consistency: Math.min(
              100,
              Math.max(
                0,
                DataSanitizer.sanitizeNumber(
                  parsedResult.score?.consistency || calculateDynamicScores(sessionData).consistency,
                  false,
                ) ?? calculateDynamicScores(sessionData).consistency,
              ),
            ),
            progress: Math.min(
              100,
              Math.max(
                0,
                DataSanitizer.sanitizeNumber(
                  parsedResult.score?.progress || calculateDynamicScores(sessionData).progress,
                  false,
                ) ?? calculateDynamicScores(sessionData).progress,
              ),
            ),
          },
        };

        debugLog("Processed OpenAI analysis result:", analysisResult);
        return analysisResult;
      } catch (err) {
        console.error("OpenAI analysis failed:", err);
        throw err;
      }
    },
    [],
  );

  const analyzeWithAnthropic = useCallback(
    async (
      sessionData: SessionData,
      apiKey: string,
    ): Promise<AIAnalysisResult> => {
      try {
        const anthropic = new Anthropic({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true, // Only for client-side usage, consider server-side for production
        });

        const prompt = buildAnalysisPrompt(sessionData);
        debugLog("Sending prompt to Anthropic:", prompt);

        const message = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are an expert wellness and breathing coach. ${prompt}`,
            },
          ],
        });

        const responseText =
          message.content[0]?.type === "text" ? message.content[0].text : "";
        debugLog("Anthropic response:", responseText);

        // Sanitize the response text
        const sanitizedResponse = DataSanitizer.sanitizeText(responseText, {
          maxLength: 5000,
        });

        // Attempt to parse the JSON response
        let parsedResult: {
          analysis?: string;
          suggestions?: string[];
          nextSteps?: string[];
          score?: {
            overall?: number;
            focus?: number;
            consistency?: number;
            progress?: number;
          };
        };
        try {
          const jsonMatch = sanitizedResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResult = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("No JSON found in response");
          }
        } catch (jsonError) {
          console.error(
            "Failed to parse Anthropic response as JSON:",
            sanitizedResponse,
            jsonError,
          );
          parsedResult = createFallbackAnalysis(sessionData, sanitizedResponse);
        }

        const analysisResult: AIAnalysisResult = {
          provider: "anthropic",
          analysis: DataSanitizer.sanitizeText(
            parsedResult.analysis || "Analysis completed successfully.",
            { maxLength: 2000 },
          ),
          suggestions: Array.isArray(parsedResult.suggestions)
            ? parsedResult.suggestions.map((s: string) =>
                DataSanitizer.sanitizeText(s, { maxLength: 200 }),
              )
            : ["Continue practicing regularly"],
          nextSteps: Array.isArray(parsedResult.nextSteps)
            ? parsedResult.nextSteps.map((s: string) =>
                DataSanitizer.sanitizeText(s, { maxLength: 200 }),
              )
            : ["Try a longer session next time"],
          score: {
            overall: Math.min(
              100,
              Math.max(
                0,
                DataSanitizer.sanitizeNumber(
                  parsedResult.score?.overall || calculateDynamicScores(sessionData).overall,
                  false,
                ) ?? calculateDynamicScores(sessionData).overall,
              ),
            ),
            focus: Math.min(
              100,
              Math.max(
                0,
                DataSanitizer.sanitizeNumber(
                  parsedResult.score?.focus || calculateDynamicScores(sessionData).focus,
                  false,
                ) ?? calculateDynamicScores(sessionData).focus,
              ),
            ),
            consistency: Math.min(
              100,
              Math.max(
                0,
                DataSanitizer.sanitizeNumber(
                  parsedResult.score?.consistency || calculateDynamicScores(sessionData).consistency,
                  false,
                ) ?? calculateDynamicScores(sessionData).consistency,
              ),
            ),
            progress: Math.min(
              100,
              Math.max(
                0,
                DataSanitizer.sanitizeNumber(
                  parsedResult.score?.progress || calculateDynamicScores(sessionData).progress,
                  false,
                ) ?? calculateDynamicScores(sessionData).progress,
              ),
            ),
          },
        };

        debugLog("Processed Anthropic analysis result:", analysisResult);
        return analysisResult;
      } catch (err) {
        console.error("Anthropic analysis failed:", err);
        throw err;
      }
    },
    [],
  );

  // Generic function to analyze with any provider
  const analyzeWithProvider = useCallback(
    async (
      sessionData: SessionData,
      providerId: string,
    ): Promise<AIAnalysisResult> => {
      try {
        // Validate and sanitize session data first
        const validation = validateSession(sessionData);
        if (!validation.isValid) {
          throw new Error(
            `Invalid session data: ${validation.errors.join(", ")}`,
          );
        }

        const sanitizedData = validation.sanitizedData;

        // Get API key
        const apiKey = await AIConfigManager.getApiKey(providerId);

        if (!apiKey) {
          throw new Error(
            `${providerId} API key not configured. Please add your API key in settings.`,
          );
        }

        // Use the appropriate provider
        switch (providerId) {
          case "google": {
            // Ensure data is properly shaped
            const geminiData: SessionData = {
              ...sessionData,
              patternName: sanitizedData.patternName || sessionData.patternName,
              sessionDuration:
                sanitizedData.duration || sessionData.sessionDuration,
              breathHoldTime: sanitizedData.breathHoldTime,
              restlessnessScore: sanitizedData.restlessnessScore,
              bpm: sanitizedData.bpm,
              consistencyScore: sanitizedData.consistencyScore,
            };

            // Call analyzeWithGemini
            return analyzeWithGemini(geminiData, apiKey);
          }
          case "openai":
            return analyzeWithOpenAI(sessionData, apiKey);
          case "anthropic":
            return analyzeWithAnthropic(sessionData, apiKey);
          default:
            throw new Error(`Unknown provider: ${providerId}`);
        }
      } catch (err) {
        console.error(`${providerId} analysis failed:`, err);
        return createErrorFallback(
          sessionData,
          err instanceof Error ? err.message : "Unknown error",
        );
      }
    },
    [
      validateSession,
      analyzeWithGemini,
      analyzeWithOpenAI,
      analyzeWithAnthropic,
    ],
  );

  const analyzeSession = useCallback(
    async (
      sessionData: SessionData,
      userId?: string,
    ): Promise<AIAnalysisResult[]> => {
      // Prevent AI analysis for classic sessions
      if ((sessionData as any).sessionType === "classic") {
        console.log("Blocking AI analysis for classic session");
        return [];
      }

      setIsAnalyzing(true);
      setError(null);

      try {
        // Initialize trial manager
        await AITrialManager.initialize();
        
        // Determine analysis mode
        const analysisMode = await AITrialManager.getAnalysisMode();
        
        if (analysisMode === 'blocked') {
          const trialMessage = await AITrialManager.getTrialMessage();
          throw new Error(trialMessage);
        }

        const results: AIAnalysisResult[] = [];

        if (analysisMode === 'trial') {
          // Use server-side AI with our keys (one-time trial)
          try {
            const trialUsed = await AITrialManager.useTrial();
            if (!trialUsed) {
              throw new Error("Trial usage failed");
            }

            // Use secure client for server-side analysis
            const serverResult = await SecureAIClient.analyzeSession('google', {
              pattern: sessionData.patternName,
              duration: sessionData.sessionDuration,
              averageBpm: sessionData.bpm,
              consistencyScore: sessionData.consistencyScore,
              restlessnessScore: sessionData.restlessnessScore,
              breathHoldDuration: sessionData.breathHoldTime
            });

            results.push({
              provider: 'trial-google',
              analysis: serverResult.analysis,
              suggestions: serverResult.suggestions,
              nextSteps: serverResult.nextSteps,
              score: serverResult.score
            });

          } catch (trialError) {
            console.error("Trial analysis failed:", trialError);
            // Fall back to basic analysis
            const fallbackResult = createTrialFallback(sessionData);
            results.push(fallbackResult);
          }
        } else {
          // Use user's configured API keys
          const configuredProviders = AIConfigManager.getConfiguredProviders();

          // Analyze with available providers
          for (const provider of configuredProviders) {
            try {
              const result = await analyzeWithProvider(sessionData, provider.id);
              if (result) {
                results.push(result);
              }
            } catch (providerError) {
              console.error(`Analysis failed for ${provider.id}:`, providerError);
              // Continue with other providers
            }
          }

          // Fallback to user's Gemini if no other providers work
          if (results.length === 0) {
            try {
              const geminiResult = await analyzeWithProvider(
                sessionData,
                "google",
              );
              if (geminiResult) {
                results.push(geminiResult);
              }
            } catch (geminiError) {
              console.error("Fallback Gemini analysis failed:", geminiError);
            }
          }
        }

        // Store analysis results in database if user is provided
        if (userId && results.length > 0) {
          try {
            // Find the user's latest session to update with AI analysis
            const { data: userSessions, error } = await supabase
              .from('breathing_sessions')
              .select('*')
              .eq('user_id', userId)
              .order('started_at', { ascending: false })
              .limit(1);

            if (error) throw error;

            if (userSessions && userSessions.length > 0) {
              const latestSession = userSessions[0];
              const { error: updateError } = await supabase
                .from('breathing_sessions')
                .update({
                  ai_score: results[0].score.overall,
                  ai_feedback: results[0],
                  ai_suggestions: results[0].suggestions,
                })
                .eq('id', latestSession.id);
                
              if (updateError) throw updateError;
            }
          } catch (dbError) {
            console.error("Failed to store AI analysis in database:", dbError);
            // Don't throw here, as the analysis was successful
          }
        }

        setAnalyses(results);
        return results;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Analysis failed";
        setError(errorMessage);
        console.error("Session analysis error:", err);

        // Return fallback analysis even on error
        const fallbackResult = createErrorFallback(sessionData, errorMessage);
        setAnalyses([fallbackResult]);
        return [fallbackResult];
      } finally {
        setIsAnalyzing(false);
      }
    },
    [analyzeWithProvider],
  );

  const logAnalysisToBlockchain = useCallback(
    async (
      sessionData: SessionData,
      analysisResult: AIAnalysisResult,
    ): Promise<string | null> => {
      try {
        const transaction = `
        import ImperfectBreath from 0xImperfectBreath

        transaction(
          patternName: String,
          duration: UFix64,
          aiScore: UFix64,
          bpm: UFix64,
          consistencyScore: UFix64,
          restlessnessScore: UFix64
        ) {
          prepare(signer: AuthAccount) {
            let collection = signer.borrow<&ImperfectBreath.Collection>(
              from: ImperfectBreath.CollectionStoragePath
            ) ?? panic("Could not borrow collection reference")

            // This would need to be implemented in the contract
            // For now, we'll just log the session data
          }
        }
      `;

        const result = await executeTransaction(transaction, [
          { value: sessionData.patternName, type: "String" },
          { value: sessionData.sessionDuration.toFixed(2), type: "UFix64" },
          { value: analysisResult.score.overall.toFixed(2), type: "UFix64" },
          { value: (sessionData.bpm || 0).toFixed(2), type: "UFix64" },
          {
            value: (sessionData.consistencyScore || 0).toFixed(2),
            type: "UFix64",
          },
          {
            value: (sessionData.restlessnessScore || 0).toFixed(2),
            type: "UFix64",
          },
        ]);

        debugLog("Analysis logged to blockchain:", result);
        return result ? String(result) : null;
      } catch (err) {
        console.error("Failed to log analysis to blockchain:", err);
        return null;
      }
    },
    [executeTransaction],
  );

  return {
    analyses,
    isAnalyzing,
    error,
    analyzeSession,
    analyzeWithProvider,
    analyzeWithOpenAI,
    analyzeWithAnthropic,
    logAnalysisToBlockchain,
    clearAnalyses: () => setAnalyses([]),
    clearError: () => setError(null),
  };
};

// Helper functions
function buildAnalysisPrompt(sessionData: SessionData): string {
  return `
Analyze the following breathing session data and provide structured feedback in JSON format.

Session Data:
- Pattern Name: ${sessionData.patternName}
- Session Duration: ${sessionData.sessionDuration} seconds (${Math.round(sessionData.sessionDuration / 60)} minutes)
- Breath Hold Time: ${sessionData.breathHoldTime || "N/A"} seconds
- Restlessness Score: ${sessionData.restlessnessScore || "N/A"}/100
- BPM: ${sessionData.bpm || "N/A"}
- Consistency Score: ${sessionData.consistencyScore || "N/A"}/100
- Cycles Completed: ${sessionData.cycleCount || "N/A"}

Please provide a JSON response with the following structure:
{
  "analysis": "Detailed analysis of the session performance and areas for improvement",
  "suggestions": ["Array of 3-5 specific suggestions for improvement"],
  "nextSteps": ["Array of 3-5 recommended next actions or exercises"],
  "score": {
    "overall": 85,
    "focus": 80,
    "consistency": 90,
    "progress": 85
  }
}

Focus on:
1. Breathing technique and consistency
2. Session duration and completion
3. Areas for improvement
4. Positive reinforcement
5. Specific actionable advice

Scores should be between 0-100 based on the session data provided.
`;
}

function createFallbackAnalysis(
  sessionData: SessionData,
  rawText: string,
): {
  analysis: string;
  suggestions: string[];
  nextSteps: string[];
  score: {
    overall: number;
    focus: number;
    consistency: number;
    progress: number;
  };
} {
  const duration = Math.round(sessionData.sessionDuration / 60);
  const baseScore = Math.min(100, Math.max(50, 60 + duration * 2));

  return {
    analysis:
      rawText.length > 50
        ? rawText.substring(0, 200) + "..."
        : `Good session! You completed ${duration} minutes of ${sessionData.patternName} breathing practice.`,
    suggestions: [
      "Continue practicing regularly to build consistency",
      "Try extending your session duration gradually",
      "Focus on maintaining steady breathing rhythm",
    ],
    nextSteps: [
      "Practice the same pattern tomorrow",
      "Try a slightly more challenging pattern",
      "Set a regular practice schedule",
    ],
    score: {
      overall: baseScore,
      focus: baseScore - 5,
      consistency: sessionData.consistencyScore || baseScore,
      progress: baseScore + 5,
    },
  };
}

/**
 * Calculate dynamic scores based on actual session data
 */
function calculateDynamicScores(sessionData: SessionData): {
  overall: number;
  focus: number;
  consistency: number;
  progress: number;
} {
  const duration = Math.round(sessionData.sessionDuration / 60);
  const durationScore = Math.min(100, Math.max(50, 60 + duration * 5)); // 5 points per minute

  // Base scores on actual session metrics
  const restlessnessScore = sessionData.restlessnessScore || 0;
  const stillnessScore = Math.max(0, 100 - restlessnessScore);

  // Calculate focus score based on stillness and duration
  const focusScore = Math.round((stillnessScore * 0.7) + (durationScore * 0.3));

  // Consistency score from session data or estimated from duration
  const consistencyScore = sessionData.consistencyScore ||
    Math.min(100, Math.max(60, 70 + duration * 3));

  // Progress score based on completion and performance
  const progressScore = Math.min(100, Math.max(65, durationScore + 10));

  // Overall score as weighted average
  const overallScore = Math.round(
    (focusScore * 0.3) +
    (consistencyScore * 0.3) +
    (progressScore * 0.2) +
    (durationScore * 0.2)
  );

  return {
    overall: overallScore,
    focus: focusScore,
    consistency: consistencyScore,
    progress: progressScore,
  };
}

function createErrorFallback(
  sessionData: SessionData,
  errorMessage: string,
): AIAnalysisResult {
  const duration = Math.round(sessionData.sessionDuration / 60);
  const dynamicScores = calculateDynamicScores(sessionData);

  return {
    provider: "fallback",
    analysis: `Session completed successfully! You practiced ${sessionData.patternName} for ${duration} minutes. While AI analysis is temporarily unavailable, completing your breathing practice is an achievement in itself.`,
    suggestions: [
      "Continue your regular practice routine",
      "Focus on breathing rhythm and consistency",
      "Try to practice at the same time each day",
    ],
    nextSteps: [
      "Schedule your next breathing session",
      "Explore different breathing patterns",
      "Track your progress over time",
    ],
    score: dynamicScores,
    error: `AI analysis unavailable: ${errorMessage}`,
  };
}

function createTrialFallback(sessionData: SessionData): AIAnalysisResult {
  const duration = Math.round(sessionData.sessionDuration / 60);
  const dynamicScores = calculateDynamicScores(sessionData);

  return {
    provider: "trial",
    analysis: `Great work! You completed ${duration} minutes of ${sessionData.patternName} breathing practice. This was your free AI analysis trial. For detailed personalized insights, please add your own AI provider API keys in the settings.`,
    suggestions: [
      "You've used your free trial - add API keys for detailed analysis",
      "Continue practicing regularly to build consistency",
      "Focus on maintaining steady breathing rhythm",
      "Try extending your session duration gradually",
    ],
    nextSteps: [
      "Visit AI Settings to add your API keys for unlimited analysis",
      "Practice the same pattern for a few more sessions",
      "Experiment with different breathing techniques",
    ],
    score: dynamicScores,
  };
}
