import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Initialize AI clients with error handling
const genAI = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null;
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  : null;

// Token optimization configurations
const OPTIMIZATION_CONFIG = {
  models: {
    google: "gemini-1.5-flash", // Already cheapest
    openai: "gpt-4o-mini", // Much cheaper than gpt-4
    anthropic: "claude-3-haiku-20240307", // Cheapest Claude model
  },
  maxTokens: {
    session: 400, // Reduced from 1000
    pattern: 300, // Reduced from 1000
  },
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
  },
};

// Simple in-memory cache for repeated requests
const responseCache = new Map();

// Generate cache key for requests
function generateCacheKey(provider, sessionData, analysisType) {
  const key = {
    provider,
    analysisType,
    pattern: sessionData.pattern,
    duration: Math.round((sessionData.duration || 0) / 60) * 60, // Round to nearest minute
    avgBpm: Math.round(sessionData.averageBpm || 0),
    consistency: Math.round((sessionData.consistencyScore || 0) / 10) * 10, // Round to nearest 10
    restlessness: Math.round((sessionData.restlessnessScore || 0) / 10) * 10,
  };
  return JSON.stringify(key);
}

export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const {
      provider,
      sessionData,
      analysisType = "session",
    } = JSON.parse(event.body);

    if (!provider || !sessionData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required parameters" }),
      };
    }

    // Check cache first
    const cacheKey = generateCacheKey(provider, sessionData, analysisType);
    if (OPTIMIZATION_CONFIG.cache.enabled && responseCache.has(cacheKey)) {
      const cached = responseCache.get(cacheKey);
      if (Date.now() - cached.timestamp < OPTIMIZATION_CONFIG.cache.ttl) {
        console.log(`Cache hit for ${provider} ${analysisType}`);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            provider,
            analysisType,
            result: cached.result,
            cached: true,
          }),
        };
      } else {
        responseCache.delete(cacheKey);
      }
    }

    let result;

    switch (provider) {
      case "google":
        result = await analyzeWithGemini(sessionData, analysisType);
        break;
      case "openai":
        result = await analyzeWithOpenAI(sessionData, analysisType);
        break;
      case "anthropic":
        result = await analyzeWithClaude(sessionData, analysisType);
        break;
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Invalid AI provider" }),
        };
    }

    // Cache the result
    if (OPTIMIZATION_CONFIG.cache.enabled) {
      responseCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });

      // Clean up old cache entries periodically
      if (responseCache.size > 100) {
        const oldestKey = responseCache.keys().next().value;
        responseCache.delete(oldestKey);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        provider,
        analysisType,
        result,
      }),
    };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "AI analysis failed",
        message: error.message,
      }),
    };
  }
};

async function analyzeWithGemini(sessionData, analysisType) {
  const model = genAI.getGenerativeModel({
    model: OPTIMIZATION_CONFIG.models.google,
    generationConfig: {
      maxOutputTokens: OPTIMIZATION_CONFIG.maxTokens[analysisType],
      temperature: 0.7,
    },
  });

  const prompt =
    analysisType === "pattern"
      ? createOptimizedPatternPrompt(sessionData)
      : createOptimizedSessionPrompt(sessionData);

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  return parseAIResponse(text, analysisType);
}

async function analyzeWithOpenAI(sessionData, analysisType) {
  const prompt =
    analysisType === "pattern"
      ? createOptimizedPatternPrompt(sessionData)
      : createOptimizedSessionPrompt(sessionData);

  const completion = await openai.chat.completions.create({
    model: OPTIMIZATION_CONFIG.models.openai,
    messages: [
      {
        role: "system",
        content: "Zen AI breathing coach. Provide concise, helpful analysis.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: OPTIMIZATION_CONFIG.maxTokens[analysisType],
  });

  return parseAIResponse(completion.choices[0].message.content, analysisType);
}

async function analyzeWithClaude(sessionData, analysisType) {
  const prompt =
    analysisType === "pattern"
      ? createOptimizedPatternPrompt(sessionData)
      : createOptimizedSessionPrompt(sessionData);

  const message = await anthropic.messages.create({
    model: OPTIMIZATION_CONFIG.models.anthropic,
    max_tokens: OPTIMIZATION_CONFIG.maxTokens[analysisType],
    temperature: 0.7,
    system: "Zen AI breathing coach. Provide concise, helpful analysis.",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return parseAIResponse(message.content[0].text, analysisType);
}
// Optimized prompts - much shorter while maintaining quality
function createOptimizedSessionPrompt(sessionData) {
  return `Session: ${sessionData.pattern || "Unknown"}, ${
    sessionData.duration || 0
  }s, ${sessionData.averageBpm || 0}bpm, consistency ${
    sessionData.consistencyScore || 0
  }/100, restlessness ${sessionData.restlessnessScore || 0}/100, hold ${
    sessionData.breathHoldDuration || 0
  }s.

JSON response:
{
  "overallScore": number,
  "suggestions": ["3 brief tips"],
  "nextSteps": ["3 actions"],
  "encouragement": "short positive message"
}`;
}

function createOptimizedPatternPrompt(sessionData) {
  return `User: consistency ${
    sessionData.consistencyScore || 0
  }/100, restlessness ${sessionData.restlessnessScore || 0}/100, ${
    sessionData.averageBpm || 0
  }bpm, ${sessionData.experienceLevel || "beginner"}.

Create breathing pattern JSON:
{
  "name": "Pattern Name",
  "description": "Brief description",
  "phases": [{"type": "inhale|exhale|hold", "duration": seconds, "instruction": "brief"}],
  "reasoning": "why this helps"
}`;
}

function createSessionAnalysisPrompt(sessionData) {
  return `Analyze this breathing session data and provide personalized feedback:

Pattern: ${sessionData.pattern || "Unknown"}
Duration: ${sessionData.duration || 0} seconds
Average BPM: ${sessionData.averageBpm || 0}
Consistency Score: ${sessionData.consistencyScore || 0}/100
Restlessness Score: ${sessionData.restlessnessScore || 0}/100
Breath Hold Duration: ${sessionData.breathHoldDuration || 0} seconds

Please provide analysis in this JSON format:
{
  "provider": "provider_name",
  "analysis": "detailed analysis text",
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "score": {
    "overall": number_0_to_100,
    "focus": number_0_to_100,
    "consistency": number_0_to_100,
    "progress": number_0_to_100
  },
  "nextSteps": ["step1", "step2", "step3"]
}`;
}

function createPatternGenerationPrompt(sessionData) {
  return `Based on this user's breathing session performance, create a personalized breathing pattern:

Current Performance:
- Consistency Score: ${sessionData.consistencyScore || 0}/100
- Restlessness Score: ${sessionData.restlessnessScore || 0}/100
- Average BPM: ${sessionData.averageBpm || 0}
- Experience Level: ${sessionData.experienceLevel || "beginner"}

Create a breathing pattern that would help them improve. Format as JSON:
{
  "name": "Pattern Name",
  "description": "Brief description",
  "phases": [
    {
      "type": "inhale|exhale|hold",
      "duration": number_in_seconds,
      "instruction": "Clear instruction"
    }
  ],
  "reasoning": "Why this pattern will help them"
}`;
}

function parseAIResponse(text, analysisType) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback: create structured response from text
    if (analysisType === "pattern") {
      return {
        name: "Custom Breathing Pattern",
        description: "AI-generated breathing pattern based on your performance",
        phases: [
          { type: "inhale", duration: 4, instruction: "Breathe in slowly" },
          { type: "hold", duration: 2, instruction: "Hold gently" },
          {
            type: "exhale",
            duration: 6,
            instruction: "Breathe out completely",
          },
        ],
        reasoning: text.substring(0, 200) + "...",
      };
    } else {
      return {
        provider: "AI Assistant",
        analysis: text.substring(0, 500) + "...",
        suggestions: [
          "Continue practicing regularly",
          "Focus on consistency",
          "Try longer sessions",
        ],
        score: { overall: 75, focus: 70, consistency: 80, progress: 75 },
        nextSteps: [
          "Practice daily",
          "Explore new patterns",
          "Track your progress",
        ],
      };
    }
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("Failed to parse AI response");
  }
}
