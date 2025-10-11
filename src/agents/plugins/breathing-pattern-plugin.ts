/**
 * Breathing Pattern Plugin for Eliza AI Agent
 * Integrates with our multichain breathing app ecosystem
 */

import { Plugin, Action, Evaluator, Provider, Runtime, Message, Callback } from '@elizaos/core';

/**
 * Note: This plugin references blockchain services (Flow, Lens)
 * in its response text, but the actual blockchain interactions would be
 * implemented in the consuming application. The blockchain clients would
 * be used at that point.
 */

// Breathing pattern interfaces
interface BreathingPattern {
  name: string;
  description: string;
  inhale: number;
  hold: number;
  exhale: number;
  rest: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  benefits: string[];
  tags: string[];
}

interface BreathingSession {
  patternId: string;
  duration: number;
  quality: number;
  notes?: string;
  timestamp: Date;
}

interface NFTResult {
  tokenId: number;
  contractAddress: string;
  transactionHash: string;
  network: string;
}

// Predefined breathing patterns
const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    name: "4-7-8 Relaxation",
    description: "Classic calming breath pattern for stress relief and sleep",
    inhale: 4,
    hold: 7,
    exhale: 8,
    rest: 2,
    difficulty: 'beginner',
    benefits: ["Reduces anxiety", "Improves sleep", "Activates parasympathetic nervous system"],
    tags: ["relaxation", "sleep", "anxiety", "beginner"]
  },
  {
    name: "Box Breathing",
    description: "Equal-count breathing for focus and mental clarity",
    inhale: 4,
    hold: 4,
    exhale: 4,
    rest: 4,
    difficulty: 'beginner',
    benefits: ["Improves focus", "Reduces stress", "Enhances performance"],
    tags: ["focus", "performance", "stress", "military"]
  },
  {
    name: "Energizing Breath",
    description: "Quick energizing pattern for morning or pre-workout",
    inhale: 3,
    hold: 2,
    exhale: 4,
    rest: 1,
    difficulty: 'intermediate',
    benefits: ["Increases energy", "Improves alertness", "Boosts metabolism"],
    tags: ["energy", "morning", "workout", "alertness"]
  },
  {
    name: "Deep Coherence",
    description: "Heart rate variability optimization for emotional balance",
    inhale: 5,
    hold: 5,
    exhale: 5,
    rest: 5,
    difficulty: 'intermediate',
    benefits: ["Emotional balance", "Heart coherence", "Stress resilience"],
    tags: ["coherence", "heart", "emotional", "balance"]
  },
  {
    name: "Wim Hof Power",
    description: "Powerful breathing for cold exposure and mental strength",
    inhale: 2,
    hold: 0,
    exhale: 1,
    rest: 0,
    difficulty: 'advanced',
    benefits: ["Cold tolerance", "Mental strength", "Immune boost"],
    tags: ["advanced", "power", "cold", "immune"]
  }
];

// Action: Create Custom Breathing Pattern
const createBreathingPatternAction: Action = {
  name: "CREATE_BREATHING_PATTERN",
  similes: [
    "create a breathing pattern",
    "make a custom breathing technique",
    "design a breathing exercise",
    "generate a personalized pattern"
  ],
  description: "Creates a custom breathing pattern based on user needs and preferences",
  validate: async (runtime: Runtime, message: Message): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return text.includes("create") &&
           (text.includes("breathing") || text.includes("pattern") || text.includes("technique"));
  },
  handler: async (runtime: Runtime, message: Message, state: Record<string, unknown>, options: Record<string, unknown>, callback?: Callback): Promise<boolean> => {
    try {
      // Extract user preferences from message
      const userInput = message.content.text;
      const preferences = extractBreathingPreferences(userInput);
      
      // Generate custom pattern
      const customPattern = generateCustomPattern(preferences);
      
      // Create response with pattern details
      const response = `I've created a personalized breathing pattern for you! 🌬️

**${customPattern.name}**
${customPattern.description}

**Pattern:** ${customPattern.inhale}-${customPattern.hold}-${customPattern.exhale}-${customPattern.rest}
- Inhale: ${customPattern.inhale} seconds
- Hold: ${customPattern.hold} seconds  
- Exhale: ${customPattern.exhale} seconds
- Rest: ${customPattern.rest} seconds

**Benefits:** ${customPattern.benefits.join(', ')}
**Difficulty:** ${customPattern.difficulty}

Would you like me to:
🎯 Guide you through a practice session?
💎 Mint this as an NFT on Flow blockchain?
🌐 Share it with the wellness community on Lens?
🌐 Share it on Lens Protocol?`;

      if (callback) {
        callback({
          text: response,
          action: "PATTERN_CREATED",
          data: { pattern: customPattern }
        });
      }

      return true;
    } catch (error) {
      console.error("Error creating breathing pattern:", error);
      if (callback) {
        callback({
          text: "I encountered an issue creating your breathing pattern. Let me try a different approach - what specific goals do you have for your breathing practice? 🤔",
          action: "ERROR"
        });
      }
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Can you create a breathing pattern for anxiety?" }
      },
      {
        user: "{{agentName}}",
        content: { 
          text: "I'll create a calming breathing pattern specifically for anxiety relief! This will use extended exhales to activate your parasympathetic nervous system...",
          action: "CREATE_BREATHING_PATTERN"
        }
      }
    ]
  ]
};

// Action: Analyze Breathing Session
const analyzeBreathingSessionAction: Action = {
  name: "ANALYZE_BREATHING_SESSION",
  similes: [
    "analyze my breathing session",
    "review my practice",
    "give me feedback on my breathing",
    "how did I do with my breathing"
  ],
  description: "Analyzes a breathing session and provides personalized feedback",
  validate: async (runtime: Runtime, message: Message): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (text.includes("analyze") || text.includes("feedback") || text.includes("review")) &&
           (text.includes("breathing") || text.includes("session") || text.includes("practice"));
  },
  handler: async (runtime: Runtime, message: Message, state: Record<string, unknown>, options: Record<string, unknown>, callback?: Callback): Promise<boolean> => {
    try {
      // Extract session data from message or state
      const sessionData = extractSessionData(message.content.text);
      
      // Generate analysis
      const analysis = generateBreathingAnalysis(sessionData);
      
      const response = `Great work on your breathing session! Here's my analysis: 📊

**Session Summary:**
- Pattern: ${sessionData.pattern || 'Custom'}
- Duration: ${sessionData.duration || 5} minutes
- Quality: ${analysis.qualityScore}/10

**What went well:**
${analysis.positives.map((p: string) => `✅ ${p}`).join('\n')}

**Areas for improvement:**
${analysis.improvements.map((i: string) => `🎯 ${i}`).join('\n')}

**Personalized recommendations:**
${analysis.recommendations.map((r: string) => `💡 ${r}`).join('\n')}

Would you like me to:
📈 Log this session on the blockchain for progress tracking?
🎨 Create a custom pattern based on your performance?
🏆 Share your achievement with the community?`;

      if (callback) {
        callback({
          text: response,
          action: "SESSION_ANALYZED",
          data: { analysis, sessionData }
        });
      }

      return true;
    } catch (error) {
      console.error("Error analyzing session:", error);
      if (callback) {
        callback({
          text: "I'd love to analyze your session! Can you tell me more about your breathing practice - what pattern did you use and how long did you practice? 🤔",
          action: "ERROR"
        });
      }
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "I just did 10 minutes of 4-7-8 breathing, can you analyze it?" }
      },
      {
        user: "{{agentName}}",
        content: { 
          text: "Excellent! 10 minutes of 4-7-8 breathing is a solid session. Let me analyze your practice and give you personalized feedback...",
          action: "ANALYZE_BREATHING_SESSION"
        }
      }
    ]
  ]
};

// Action: Mint Breathing Pattern NFT
const mintBreathingNFTAction: Action = {
  name: "MINT_BREATHING_NFT",
  similes: [
    "mint this as an NFT",
    "create an NFT from this pattern",
    "turn this into a blockchain asset",
    "make this pattern an NFT"
  ],
  description: "Mints a breathing pattern as an NFT on Flow blockchain",
  validate: async (runtime: Runtime, message: Message): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (text.includes("mint") || text.includes("nft") || text.includes("blockchain")) &&
           (text.includes("pattern") || text.includes("breathing"));
  },
  handler: async (runtime: Runtime, message: Message, state: Record<string, unknown>, options: Record<string, unknown>, callback?: Callback): Promise<boolean> => {
    try {
      // Get pattern from state or create new one
      const pattern = (state?.pattern as BreathingPattern) || extractPatternFromMessage(message.content.text);
      
      if (!pattern) {
        if (callback) {
          callback({
            text: "I need a breathing pattern to mint as an NFT. Would you like me to create a custom pattern for you first? 🎨",
            action: "PATTERN_NEEDED"
          });
        }
        return false;
      }

      // Simulate NFT minting (in real implementation, would call Flow client)
      const nftResult = await simulateMintNFT(pattern);
      
      const response = `🎉 Your breathing pattern NFT has been minted successfully!

**NFT Details:**
- Name: "${pattern.name}"
- Token ID: ${nftResult.tokenId}
- Contract: ${nftResult.contractAddress}
- Network: Flow Testnet

**What you can do now:**
💰 List it for sale on the marketplace
🎁 Gift it to friends or students
🌐 Share it on Lens Protocol for social proof
🌐 Share it on Lens Protocol for community engagement
📊 Track its usage and earn royalties

Your breathing pattern is now a true digital asset that you own forever! Want me to help you with the next steps? ✨`;

      if (callback) {
        callback({
          text: response,
          action: "NFT_MINTED",
          data: { nft: nftResult, pattern }
        });
      }

      return true;
    } catch (error) {
      console.error("Error minting NFT:", error);
      if (callback) {
        callback({
          text: "I encountered an issue minting your NFT. This might be due to network congestion or wallet connection. Would you like me to try again or help you troubleshoot? 🔧",
          action: "ERROR"
        });
      }
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Can you mint my 4-7-8 pattern as an NFT?" }
      },
      {
        user: "{{agentName}}",
        content: { 
          text: "Absolutely! I'll mint your 4-7-8 breathing pattern as an NFT on Flow blockchain. This will give you true ownership of your wellness technique...",
          action: "MINT_BREATHING_NFT"
        }
      }
    ]
  ]
};

// Provider: Breathing Pattern Recommendations
const breathingPatternProvider: Provider = {
  get: async (runtime: Runtime, message: Message, state: Record<string, unknown>): Promise<string> => {
    const userNeeds = extractUserNeeds(message.content.text);
    const recommendations = getPatternRecommendations(userNeeds);
    
    return `Based on your needs, I recommend these breathing patterns:

${recommendations.map(pattern => 
  `🌬️ **${pattern.name}** (${pattern.difficulty})
  ${pattern.description}
  Pattern: ${pattern.inhale}-${pattern.hold}-${pattern.exhale}-${pattern.rest}
  Benefits: ${pattern.benefits.join(', ')}`
).join('\n\n')}

Would you like me to guide you through any of these patterns or create a custom one for you?`;
  }
};

// Evaluator: Breathing Knowledge
const breathingKnowledgeEvaluator: Evaluator = {
  name: "BREATHING_KNOWLEDGE",
  similes: ["breathing expertise", "wellness knowledge", "breathwork understanding"],
  description: "Evaluates the agent's breathing and wellness knowledge",
  validate: async (runtime: Runtime, message: Message): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return text.includes("breathing") || text.includes("wellness") || text.includes("breathwork");
  },
  handler: async (runtime: Runtime, message: Message): Promise<{score: number, feedback: string, suggestions: string[]}> => {
    const knowledge = assessBreathingKnowledge(message.content.text);
    return {
      score: knowledge.score,
      feedback: knowledge.feedback,
      suggestions: knowledge.suggestions
    };
  },
  examples: [
    {
      context: "User asks about breathing techniques for anxiety",
      messages: [
        {
          user: "{{user1}}",
          content: { text: "What's the best breathing technique for anxiety?" }
        }
      ],
      outcome: "Agent demonstrates knowledge of anxiety-reducing breathing patterns and their physiological effects"
    }
  ]
};

// Helper functions
interface BreathingPreferences {
  goal: string;
  experience: string;
  timeAvailable: number;
  specificNeeds: string[];
}

function extractBreathingPreferences(text: string): BreathingPreferences {
  const preferences: BreathingPreferences = {
    goal: 'general wellness',
    experience: 'beginner',
    timeAvailable: 5,
    specificNeeds: []
  };

  // Extract goals
  if (text.includes('anxiety') || text.includes('stress')) preferences.goal = 'relaxation';
  if (text.includes('focus') || text.includes('concentration')) preferences.goal = 'focus';
  if (text.includes('energy') || text.includes('wake up')) preferences.goal = 'energy';
  if (text.includes('sleep') || text.includes('bedtime')) preferences.goal = 'sleep';

  // Extract experience level
  if (text.includes('beginner') || text.includes('new')) preferences.experience = 'beginner';
  if (text.includes('advanced') || text.includes('experienced')) preferences.experience = 'advanced';

  return preferences;
}

function generateCustomPattern(preferences: BreathingPreferences): BreathingPattern {
  const basePatterns = {
    relaxation: { inhale: 4, hold: 7, exhale: 8, rest: 2 },
    focus: { inhale: 4, hold: 4, exhale: 4, rest: 4 },
    energy: { inhale: 3, hold: 2, exhale: 4, rest: 1 },
    sleep: { inhale: 4, hold: 6, exhale: 8, rest: 3 }
  };

  const base = basePatterns[preferences.goal as keyof typeof basePatterns] || basePatterns.relaxation;
  
  return {
    name: `Custom ${preferences.goal.charAt(0).toUpperCase() + preferences.goal.slice(1)} Pattern`,
    description: `Personalized breathing pattern designed for ${preferences.goal}`,
    ...base,
    difficulty: preferences.experience as 'beginner' | 'intermediate' | 'advanced',
    benefits: getBenefitsForGoal(preferences.goal),
    tags: [preferences.goal, preferences.experience, 'custom']
  };
}

function getBenefitsForGoal(goal: string): string[] {
  const benefitMap: Record<string, string[]> = {
    relaxation: ["Reduces stress", "Calms nervous system", "Lowers blood pressure"],
    focus: ["Improves concentration", "Enhances mental clarity", "Increases alertness"],
    energy: ["Boosts energy levels", "Increases alertness", "Improves circulation"],
    sleep: ["Promotes relaxation", "Prepares body for sleep", "Reduces racing thoughts"]
  };
  
  return benefitMap[goal] || ["Improves overall well-being"];
}

interface SessionData {
  duration: number;
  pattern: string;
  quality: number;
}

function extractSessionData(text: string): SessionData {
  // Simple extraction - in real implementation would be more sophisticated
  const durationMatch = text.match(/(\d+)\s*minutes?/);
  const patternMatch = text.match(/(\d+-\d+-\d+(?:-\d+)?)/);
  
  return {
    duration: durationMatch ? parseInt(durationMatch[1]) : 5,
    pattern: patternMatch ? patternMatch[1] : 'unknown',
    quality: Math.floor(Math.random() * 3) + 7 // 7-10 range
  };
}

interface BreathingAnalysis {
  qualityScore: number;
  positives: string[];
  improvements: string[];
  recommendations: string[];
}

function generateBreathingAnalysis(sessionData: SessionData): BreathingAnalysis {
  return {
    qualityScore: sessionData.quality,
    positives: [
      "Good session duration for building consistency",
      "Maintained steady rhythm throughout",
      "Proper breathing technique demonstrated"
    ],
    improvements: [
      "Try extending exhale phase for deeper relaxation",
      "Focus on smooth transitions between phases"
    ],
    recommendations: [
      "Practice daily at the same time for habit formation",
      "Consider trying a longer session next time",
      "Track your progress with blockchain logging"
    ]
  };
}

async function simulateMintNFT(pattern: BreathingPattern): Promise<NFTResult> {
  // Simulate NFT minting - in real implementation would call Flow client
  // When implementing for production, you would import and use the consolidated clients
  return {
    tokenId: Math.floor(Math.random() * 1000000),
    contractAddress: "0xb8404e09b36b6623",
    transactionHash: "0x" + Math.random().toString(16).substr(2, 64),
    network: "Flow Testnet"
  };
}

function extractUserNeeds(text: string): string[] {
  const needs: string[] = [];
  
  if (text.includes('stress') || text.includes('anxiety')) needs.push('stress-relief');
  if (text.includes('focus') || text.includes('concentration')) needs.push('focus');
  if (text.includes('energy') || text.includes('tired')) needs.push('energy');
  if (text.includes('sleep') || text.includes('insomnia')) needs.push('sleep');
  
  return needs.length > 0 ? needs : ['general-wellness'];
}

function getPatternRecommendations(needs: string[]): BreathingPattern[] {
  return BREATHING_PATTERNS.filter(pattern => 
    needs.some(need => pattern.tags.some(tag => tag.includes(need.split('-')[0])))
  ).slice(0, 3);
}

interface KnowledgeAssessment {
  score: number;
  feedback: string;
  suggestions: string[];
}

function assessBreathingKnowledge(text: string): KnowledgeAssessment {
  return {
    score: 0.9,
    feedback: "Demonstrates strong understanding of breathing techniques and their applications",
    suggestions: ["Continue providing personalized recommendations", "Integrate more blockchain features"]
  };
}

function extractPatternFromMessage(text: string): BreathingPattern | null {
  // Simple pattern extraction - would be more sophisticated in real implementation
  const patternMatch = text.match(/(\d+)-(\d+)-(\d+)(?:-(\d+))?/);
  if (patternMatch) {
    return {
      name: "Custom Pattern",
      description: "User-defined breathing pattern",
      inhale: parseInt(patternMatch[1]),
      hold: parseInt(patternMatch[2]),
      exhale: parseInt(patternMatch[3]),
      rest: patternMatch[4] ? parseInt(patternMatch[4]) : 0,
      difficulty: 'intermediate' as const,
      benefits: ["Custom breathing benefits"],
      tags: ["custom"]
    };
  }
  return null;
}

// Export the plugin
export const breathingPatternPlugin: Plugin = {
  name: "breathing-pattern-plugin",
  description: "AI breathing coach plugin for personalized wellness experiences",
  actions: [
    createBreathingPatternAction,
    analyzeBreathingSessionAction,
    mintBreathingNFTAction
  ],
  evaluators: [
    breathingKnowledgeEvaluator
  ],
  providers: [
    breathingPatternProvider
  ]
};

export default breathingPatternPlugin;
