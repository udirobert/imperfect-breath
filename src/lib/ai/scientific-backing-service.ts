/**
 * Scientific Backing Service
 * Integrates with Perplexity API to provide real-time scientific research backing
 * for AI analysis claims as a premium feature
 */

export interface ScientificSource {
  title: string;
  url: string;
  authors?: string[];
  journal?: string;
  year?: number;
  relevanceScore: number;
  summary: string;
}

export interface ScientificBacking {
  sources: ScientificSource[];
  claims: string[];
  confidence: number;
  lastUpdated: string;
}

export interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta?: {
      role?: string;
      content?: string;
    };
  }>;
  citations?: string[];
}

export class ScientificBackingService {
  private static readonly PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
  private static readonly MODEL = 'llama-3.1-sonar-large-128k-online';
  
  /**
   * Get scientific backing for breathing technique claims
   */
  static async getScientificBacking(
    technique: string,
    claims: string[],
    userTier: 'free' | 'premium' = 'free'
  ): Promise<ScientificBacking | null> {
    // Only provide scientific backing for premium users
    if (userTier !== 'premium') {
      return null;
    }

    try {
      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) {
        console.warn('Perplexity API key not configured');
        return null;
      }

      const query = this.buildResearchQuery(technique, claims);
      const response = await this.queryPerplexity(query, apiKey);
      
      return this.parseScientificResponse(response);
    } catch (error) {
      console.error('Error fetching scientific backing:', error);
      return null;
    }
  }

  /**
   * Build research query for Perplexity API
   */
  private static buildResearchQuery(technique: string, claims: string[]): string {
    const claimsText = claims.join('; ');
    
    return `Find recent peer-reviewed scientific research and clinical studies that support or contradict these claims about ${technique} breathing technique: ${claimsText}. 

Please provide:
1. Specific studies with authors, journals, and publication years
2. Key findings that relate to the claims
3. Any contradictory evidence
4. Overall scientific consensus

Focus on studies from reputable journals published in the last 10 years. Include PubMed, Google Scholar, and other academic sources.`;
  }

  /**
   * Query Perplexity API for scientific research
   */
  private static async queryPerplexity(query: string, apiKey: string): Promise<PerplexityResponse> {
    const response = await fetch(this.PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a scientific research assistant specializing in respiratory physiology and breathing techniques. Provide accurate, evidence-based information with proper citations.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
        top_p: 0.9,
        return_citations: true,
        search_domain_filter: ['pubmed.ncbi.nlm.nih.gov', 'scholar.google.com', 'ncbi.nlm.nih.gov'],
        search_recency_filter: 'year'
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Parse Perplexity response into structured scientific backing
   */
  private static parseScientificResponse(response: PerplexityResponse): ScientificBacking {
    const content = response.choices[0]?.message?.content || '';
    const citations = response.citations || [];

    // Extract sources from the response content
    const sources = this.extractSources(content, citations);
    
    // Extract validated claims
    const claims = this.extractClaims(content);

    // Calculate confidence based on number and quality of sources
    const confidence = this.calculateConfidence(sources);

    return {
      sources,
      claims,
      confidence,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Extract scientific sources from response content
   */
  private static extractSources(content: string, citations: string[]): ScientificSource[] {
    const sources: ScientificSource[] = [];
    
    // Parse citations and content for study references
    const studyPattern = /(?:(\w+(?:\s+et\s+al\.?)?)\s*\((\d{4})\))|(?:(\d{4}).*?(\w+(?:\s+et\s+al\.?)?))/gi;
    const matches = content.matchAll(studyPattern);

    for (const match of matches) {
      const authors = match[1] || match[4] || 'Unknown';
      const year = parseInt(match[2] || match[3] || '0');
      
      // Try to find corresponding citation URL
      const citationUrl = citations.find(url => 
        url.includes('pubmed') || 
        url.includes('scholar.google') || 
        url.includes('ncbi.nlm.nih.gov')
      ) || '';

      sources.push({
        title: `Research study by ${authors}`,
        url: citationUrl,
        authors: [authors],
        year,
        relevanceScore: this.calculateRelevanceScore(content, authors),
        summary: this.extractStudySummary(content, authors)
      });
    }

    // Add citation URLs as additional sources
    citations.forEach(url => {
      if (!sources.some(s => s.url === url)) {
        sources.push({
          title: this.extractTitleFromUrl(url),
          url,
          relevanceScore: 0.7,
          summary: 'Scientific source from research database'
        });
      }
    });

    return sources.slice(0, 5); // Limit to top 5 sources
  }

  /**
   * Extract validated claims from response
   */
  private static extractClaims(content: string): string[] {
    const claims: string[] = [];
    
    // Look for statements that indicate scientific support
    const supportPatterns = [
      /studies show that/gi,
      /research indicates/gi,
      /evidence suggests/gi,
      /clinical trials demonstrate/gi,
      /meta-analysis reveals/gi
    ];

    const sentences = content.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      if (supportPatterns.some(pattern => pattern.test(sentence))) {
        const cleanSentence = sentence.trim();
        if (cleanSentence.length > 20 && cleanSentence.length < 200) {
          claims.push(cleanSentence);
        }
      }
    });

    return claims.slice(0, 3); // Limit to top 3 claims
  }

  /**
   * Calculate confidence score based on sources
   */
  private static calculateConfidence(sources: ScientificSource[]): number {
    if (sources.length === 0) return 0;

    const avgRelevance = sources.reduce((sum, s) => sum + s.relevanceScore, 0) / sources.length;
    const sourceCount = Math.min(sources.length / 5, 1); // Normalize to 0-1
    const recentSources = sources.filter(s => s.year && s.year >= 2020).length / sources.length;

    return Math.round((avgRelevance * 0.4 + sourceCount * 0.4 + recentSources * 0.2) * 100);
  }

  /**
   * Calculate relevance score for a source
   */
  private static calculateRelevanceScore(content: string, authors: string): number {
    const authorMentions = (content.match(new RegExp(authors, 'gi')) || []).length;
    return Math.min(0.5 + (authorMentions * 0.1), 1.0);
  }

  /**
   * Extract study summary from content
   */
  private static extractStudySummary(content: string, authors: string): string {
    const sentences = content.split(/[.!?]+/);
    const relevantSentence = sentences.find(s => 
      s.includes(authors) && s.length > 30 && s.length < 150
    );
    
    return relevantSentence?.trim() || 'Scientific study supporting breathing technique benefits';
  }

  /**
   * Extract title from URL
   */
  private static extractTitleFromUrl(url: string): string {
    if (url.includes('pubmed')) return 'PubMed Research Article';
    if (url.includes('scholar.google')) return 'Google Scholar Research';
    if (url.includes('ncbi.nlm.nih.gov')) return 'NCBI Scientific Publication';
    return 'Scientific Research Source';
  }

  /**
   * Get cached scientific backing (for development/testing)
   */
  static getCachedScientificBacking(technique: string): ScientificBacking {
    return {
      sources: [
        {
          title: 'Effects of controlled breathing on stress and anxiety: A systematic review',
          url: 'https://pubmed.ncbi.nlm.nih.gov/example1',
          authors: ['Smith, J.', 'Johnson, M.'],
          journal: 'Journal of Clinical Psychology',
          year: 2023,
          relevanceScore: 0.95,
          summary: 'Systematic review demonstrates significant stress reduction through controlled breathing techniques'
        },
        {
          title: 'Physiological mechanisms of breathing-based interventions',
          url: 'https://pubmed.ncbi.nlm.nih.gov/example2',
          authors: ['Brown, A.', 'Davis, K.'],
          journal: 'Respiratory Physiology & Neurobiology',
          year: 2022,
          relevanceScore: 0.88,
          summary: 'Research shows breathing techniques activate parasympathetic nervous system responses'
        }
      ],
      claims: [
        'Clinical studies demonstrate that controlled breathing reduces cortisol levels by up to 25%',
        'Research indicates improved heart rate variability through regular breathing practice',
        'Meta-analysis reveals significant anxiety reduction in 78% of participants using breathing techniques'
      ],
      confidence: 87,
      lastUpdated: new Date().toISOString()
    };
  }
}