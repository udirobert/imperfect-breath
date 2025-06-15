// AI Provider Implementations
import { AIAnalysisRequest, AIAnalysisResponse, ANALYSIS_SYSTEM_PROMPT, formatSessionPrompt } from './config';

export class OpenAIProvider {
  static async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: ANALYSIS_SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: formatSessionPrompt(request.sessionData, request.previousSessions)
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      return this.parseResponse(content, 'openai');
    } catch (error) {
      return {
        provider: 'openai',
        analysis: '',
        suggestions: [],
        score: { overall: 0, focus: 0, consistency: 0, progress: 0 },
        nextSteps: [],
        error: `OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static parseResponse(content: string, provider: string): AIAnalysisResponse {
    // Extract numerical scores using regex
    const overallMatch = content.match(/overall[:\s]*(\d+)/i);
    const focusMatch = content.match(/focus[:\s]*(\d+)/i);
    const consistencyMatch = content.match(/consistency[:\s]*(\d+)/i);
    const progressMatch = content.match(/progress[:\s]*(\d+)/i);

    // Extract suggestions and next steps
    const suggestions = this.extractList(content, /suggestions?[:\s]*\n?([\s\S]*?)(?:\n\n|next steps|$)/i);
    const nextSteps = this.extractList(content, /next steps?[:\s]*\n?([\s\S]*?)$/i);

    // Get main analysis (everything before suggestions/scores)
    const analysisMatch = content.match(/^([\s\S]*?)(?:suggestions?:|scores?:|next steps?:|$)/i);
    const analysis = analysisMatch ? analysisMatch[1].trim() : content;

    return {
      provider,
      analysis,
      suggestions,
      score: {
        overall: overallMatch ? parseInt(overallMatch[1]) : 75,
        focus: focusMatch ? parseInt(focusMatch[1]) : 75,
        consistency: consistencyMatch ? parseInt(consistencyMatch[1]) : 75,
        progress: progressMatch ? parseInt(progressMatch[1]) : 75
      },
      nextSteps
    };
  }

  private static extractList(content: string, regex: RegExp): string[] {
    const match = content.match(regex);
    if (!match) return [];

    return match[1]
      .split(/\n|•|\*|-/)
      .map(item => item.trim())
      .filter(item => item && item.length > 10)
      .slice(0, 5); // Limit to 5 items
  }
}

export class AnthropicProvider {
  static async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': request.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          system: ANALYSIS_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: formatSessionPrompt(request.sessionData, request.previousSessions)
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text || '';

      return OpenAIProvider['parseResponse'](content, 'anthropic');
    } catch (error) {
      return {
        provider: 'anthropic',
        analysis: '',
        suggestions: [],
        score: { overall: 0, focus: 0, consistency: 0, progress: 0 },
        nextSteps: [],
        error: `Anthropic analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export class GoogleProvider {
  static async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    try {
      const prompt = `${ANALYSIS_SYSTEM_PROMPT}\n\n${formatSessionPrompt(request.sessionData, request.previousSessions)}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${request.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return OpenAIProvider['parseResponse'](content, 'google');
    } catch (error) {
      return {
        provider: 'google',
        analysis: '',
        suggestions: [],
        score: { overall: 0, focus: 0, consistency: 0, progress: 0 },
        nextSteps: [],
        error: `Google analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export class AIAnalyzer {
  static async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    switch (request.provider) {
      case 'openai':
        return OpenAIProvider.analyze(request);
      case 'anthropic':
        return AnthropicProvider.analyze(request);
      case 'google':
        return GoogleProvider.analyze(request);
      default:
        throw new Error(`Unknown AI provider: ${request.provider}`);
    }
  }

  static async analyzeWithMultipleProviders(
    request: Omit<AIAnalysisRequest, 'provider' | 'apiKey'>,
    providers: Array<{ provider: string; apiKey: string }>
  ): Promise<AIAnalysisResponse[]> {
    const analyses = await Promise.allSettled(
      providers.map(({ provider, apiKey }) =>
        this.analyze({ ...request, provider, apiKey })
      )
    );

    return analyses.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          provider: providers[index].provider,
          analysis: '',
          suggestions: [],
          score: { overall: 0, focus: 0, consistency: 0, progress: 0 },
          nextSteps: [],
          error: `Analysis failed: ${result.reason}`
        };
      }
    });
  }
}
