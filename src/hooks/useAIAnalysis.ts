import { useState, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useFlow } from '../hooks/useFlow';
import { config, debugLog } from '../config/environment';
import { SupabaseService } from '../lib/supabase';
import { useBreathingSessionValidation } from '../hooks/useValidation';
import { DataSanitizer } from '../lib/validation/sanitizer';
import { AIConfigManager } from '../lib/ai/config';

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

export type AIProvider = 'google' | 'openai' | 'anthropic';

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

  // Generic function to analyze with any provider
  const analyzeWithProvider = useCallback(async (
    sessionData: SessionData,
    providerId: string
  ): Promise<AIAnalysisResult> => {
    try {
      // Validate and sanitize session data first
      const validation = validateSession(sessionData);
      if (!validation.isValid) {
        throw new Error(`Invalid session data: ${validation.errors.join(', ')}`);
      }

      const sanitizedData = validation.sanitizedData;

      // Get API key
      const apiKey = await AIConfigManager.getApiKey(providerId);
      
      if (!apiKey) {
        throw new Error(`${providerId} API key not configured. Please add your API key in settings.`);
      }

      // Use the appropriate provider
      switch (providerId) {
        case 'google':
          // Ensure data is properly shaped
          const geminiData: SessionData = {
            ...sessionData,
            patternName: sanitizedData.patternName || sessionData.patternName,
            sessionDuration: sanitizedData.duration || sessionData.sessionDuration,
            breathHoldTime: sanitizedData.breathHoldTime,
            restlessnessScore: sanitizedData.restlessnessScore,
            bpm: sanitizedData.bpm,
            consistencyScore: sanitizedData.consistencyScore
          };
          
          // Call analyzeWithGemini
          return analyzeWithGemini(geminiData, apiKey);
        case 'openai':
          // Implementation would go here
          throw new Error('OpenAI integration not implemented yet');
        case 'anthropic':
          // Implementation would go here
          throw new Error('Anthropic integration not implemented yet');
        default:
          throw new Error(`Unknown provider: ${providerId}`);
      }
    } catch (err) {
      console.error(`${providerId} analysis failed:`, err);
      return createErrorFallback(sessionData, err instanceof Error ? err.message : 'Unknown error');
    }
  }, [validateSession]);

  const analyzeWithGemini = useCallback(async (
    sessionData: SessionData,
    apiKey: string
  ): Promise<AIAnalysisResult> => {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = buildAnalysisPrompt(sessionData);
      debugLog('Sending prompt to Gemini:', prompt);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();

      debugLog('Gemini response:', text);

      // Sanitize the response text
      const sanitizedResponse = DataSanitizer.sanitizeText(text, { maxLength: 5000 });

      // Attempt to parse the JSON response
      let parsedResult: any;
      try {
        // Clean the response text to extract JSON
        const jsonMatch = sanitizedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (jsonError) {
        console.error("Failed to parse Gemini response as JSON:", sanitizedResponse, jsonError);
        // Fallback if JSON parsing fails
        parsedResult = createFallbackAnalysis(sessionData, sanitizedResponse);
      }

      // Sanitize the parsed result
      const analysisResult: AIAnalysisResult = {
        provider: 'gemini',
        analysis: DataSanitizer.sanitizeText(parsedResult.analysis || 'Analysis completed successfully.', { maxLength: 2000 }),
        suggestions: Array.isArray(parsedResult.suggestions) 
          ? parsedResult.suggestions.map((s: string) => DataSanitizer.sanitizeText(s, { maxLength: 200 }))
          : ['Continue practicing regularly'],
        nextSteps: Array.isArray(parsedResult.nextSteps) 
          ? parsedResult.nextSteps.map((s: string) => DataSanitizer.sanitizeText(s, { maxLength: 200 }))
          : ['Try a longer session next time'],
        score: {
          overall: Math.min(100, Math.max(0, DataSanitizer.sanitizeNumber(parsedResult.score?.overall, false) || 75)),
          focus: Math.min(100, Math.max(0, DataSanitizer.sanitizeNumber(parsedResult.score?.focus, false) || 70)),
          consistency: Math.min(100, Math.max(0, DataSanitizer.sanitizeNumber(parsedResult.score?.consistency, false) || 80)),
          progress: Math.min(100, Math.max(0, DataSanitizer.sanitizeNumber(parsedResult.score?.progress, false) || 75))
        }
      };

      debugLog('Processed analysis result:', analysisResult);
      return analysisResult;
    } catch (err) {
      console.error('Gemini analysis failed:', err);
      throw err; // Re-throw to be handled by the main analyzeWithProvider function
    }
  }, []);

  const analyzeSession = useCallback(async (
    sessionData: SessionData,
    userId?: string
  ): Promise<AIAnalysisResult[]> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const results: AIAnalysisResult[] = [];

      // Analyze with Gemini
      const geminiResult = await analyzeWithProvider(sessionData, 'google');
      if (geminiResult) {
        results.push(geminiResult);
      }

      // Store analysis results in database if user is provided
      if (userId && results.length > 0) {
        try {
          // Find the user's latest session to update with AI analysis
          const userSessions = await SupabaseService.getUserSessions(userId, 1);
          if (userSessions && userSessions.length > 0) {
            const latestSession = userSessions[0];
            await SupabaseService.updateSession(latestSession.id, {
              ai_score: results[0].score.overall,
              ai_feedback: results[0],
              ai_suggestions: results[0].suggestions
            });
          }
        } catch (dbError) {
          console.error('Failed to store AI analysis in database:', dbError);
          // Don't throw here, as the analysis was successful
        }
      }

      setAnalyses(results);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      console.error('Session analysis error:', err);
      
      // Return fallback analysis even on error
      const fallbackResult = createErrorFallback(sessionData, errorMessage);
      setAnalyses([fallbackResult]);
      return [fallbackResult];
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeWithProvider]);

  const logAnalysisToBlockchain = useCallback(async (
    sessionData: SessionData,
    analysisResult: AIAnalysisResult
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
        { value: sessionData.patternName, type: 'String' },
        { value: sessionData.sessionDuration.toFixed(2), type: 'UFix64' },
        { value: analysisResult.score.overall.toFixed(2), type: 'UFix64' },
        { value: (sessionData.bpm || 0).toFixed(2), type: 'UFix64' },
        { value: (sessionData.consistencyScore || 0).toFixed(2), type: 'UFix64' },
        { value: (sessionData.restlessnessScore || 0).toFixed(2), type: 'UFix64' }
      ]);

      debugLog('Analysis logged to blockchain:', result.transactionId);
      return result.transactionId;
    } catch (err) {
      console.error('Failed to log analysis to blockchain:', err);
      return null;
    }
  }, [executeTransaction]);

  return {
    analyses,
    isAnalyzing,
    error,
    analyzeSession,
    analyzeWithProvider,
    logAnalysisToBlockchain,
    clearAnalyses: () => setAnalyses([]),
    clearError: () => setError(null)
  };
};

// Helper functions
function buildAnalysisPrompt(sessionData: SessionData): string {
  return `
Analyze the following breathing session data and provide structured feedback in JSON format.

Session Data:
- Pattern Name: ${sessionData.patternName}
- Session Duration: ${sessionData.sessionDuration} seconds (${Math.round(sessionData.sessionDuration / 60)} minutes)
- Breath Hold Time: ${sessionData.breathHoldTime || 'N/A'} seconds
- Restlessness Score: ${sessionData.restlessnessScore || 'N/A'}/100
- BPM: ${sessionData.bpm || 'N/A'}
- Consistency Score: ${sessionData.consistencyScore || 'N/A'}/100
- Cycles Completed: ${sessionData.cycleCount || 'N/A'}

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

function createFallbackAnalysis(sessionData: SessionData, rawText: string): any {
  const duration = Math.round(sessionData.sessionDuration / 60);
  const baseScore = Math.min(100, Math.max(50, 60 + (duration * 2)));

  return {
    analysis: rawText.length > 50 ? rawText.substring(0, 200) + '...' : 
      `Good session! You completed ${duration} minutes of ${sessionData.patternName} breathing practice.`,
    suggestions: [
      'Continue practicing regularly to build consistency',
      'Try extending your session duration gradually',
      'Focus on maintaining steady breathing rhythm'
    ],
    nextSteps: [
      'Practice the same pattern tomorrow',
      'Try a slightly more challenging pattern',
      'Set a regular practice schedule'
    ],
    score: {
      overall: baseScore,
      focus: baseScore - 5,
      consistency: sessionData.consistencyScore || baseScore,
      progress: baseScore + 5
    }
  };
}

function createErrorFallback(sessionData: SessionData, errorMessage: string): AIAnalysisResult {
  const duration = Math.round(sessionData.sessionDuration / 60);
  
  return {
    provider: 'fallback',
    analysis: `Session completed successfully! You practiced ${sessionData.patternName} for ${duration} minutes. While AI analysis is temporarily unavailable, completing your breathing practice is an achievement in itself.`,
    suggestions: [
      'Continue your regular practice routine',
      'Focus on breathing rhythm and consistency',
      'Try to practice at the same time each day'
    ],
    nextSteps: [
      'Schedule your next breathing session',
      'Explore different breathing patterns',
      'Track your progress over time'
    ],
    score: {
      overall: 75,
      focus: 70,
      consistency: sessionData.consistencyScore || 75,
      progress: 80
    },
    error: `AI analysis unavailable: ${errorMessage}`
  };
}
