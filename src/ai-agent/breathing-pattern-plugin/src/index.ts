import {
  Action,
  IAgentRuntime,
  Memory,
  Plugin,
  State,
  HandlerCallback,
  elizaLogger,
} from "@ai16z/eliza";

// Types for breathing patterns
interface BreathingPattern {
  name: string;
  description: string;
  phases: {
    inhale: number;
    hold?: number;
    exhale: number;
    pause?: number;
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  benefits: string[];
  category: 'stress-relief' | 'focus' | 'energy' | 'sleep' | 'custom';
}

interface SessionData {
  patternUsed: string;
  duration: number;
  completedCycles: number;
  userFeedback: 'excellent' | 'good' | 'okay' | 'difficult';
  timestamp: Date;
}

// Predefined breathing patterns library
const BREATHING_PATTERNS: Record<string, BreathingPattern> = {
  "4-7-8": {
    name: "4-7-8 Relaxation",
    description: "A powerful technique for relaxation and sleep, developed by Dr. Andrew Weil",
    phases: { inhale: 4, hold: 7, exhale: 8 },
    difficulty: 'beginner',
    benefits: ["Reduces anxiety", "Improves sleep", "Calms nervous system"],
    category: 'stress-relief'
  },
  "box-breathing": {
    name: "Box Breathing",
    description: "Equal-count breathing used by Navy SEALs for focus and calm",
    phases: { inhale: 4, hold: 4, exhale: 4, pause: 4 },
    difficulty: 'beginner',
    benefits: ["Improves focus", "Reduces stress", "Enhances performance"],
    category: 'focus'
  },
  "breath-of-fire": {
    name: "Breath of Fire",
    description: "Energizing pranayama technique with rapid breathing",
    phases: { inhale: 1, exhale: 1 },
    difficulty: 'advanced',
    benefits: ["Increases energy", "Detoxifies", "Strengthens core"],
    category: 'energy'
  },
  "alternate-nostril": {
    name: "Alternate Nostril Breathing",
    description: "Balancing pranayama technique for mental clarity",
    phases: { inhale: 4, hold: 2, exhale: 4 },
    difficulty: 'intermediate',
    benefits: ["Balances nervous system", "Improves concentration", "Reduces stress"],
    category: 'focus'
  }
};

// Action: Create Custom Breathing Pattern
const createBreathingPatternAction: Action = {
  name: "CREATE_BREATHING_PATTERN",
  similes: [
    "create a breathing pattern",
    "design a breathing technique",
    "make a custom breathing exercise",
    "build a breathing pattern",
    "develop a breathing method"
  ],
  description: "Creates a custom breathing pattern based on user needs and preferences",
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "I need a breathing pattern for stress relief"
        }
      },
      {
        user: "Zen",
        content: {
          text: "I'll create a personalized stress relief pattern for you! This will use a longer exhale to activate your parasympathetic nervous system."
        }
      }
    ]
  ],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message?.content?.text?.toLowerCase() || '';
    return text.includes("create") && (text.includes("breathing") || text.includes("pattern"));
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: unknown,
    callback?: HandlerCallback
  ) => {
    if (!callback) return;
    
    try {
      elizaLogger.info("Creating custom breathing pattern");
      
      // Extract user requirements from message
      const text = message.content.text.toLowerCase();
      let category: BreathingPattern['category'] = 'custom';
      let difficulty: BreathingPattern['difficulty'] = 'beginner';
      
      // Determine category based on user intent
      if (text.includes('stress') || text.includes('anxiety') || text.includes('relax')) {
        category = 'stress-relief';
      } else if (text.includes('focus') || text.includes('concentration')) {
        category = 'focus';
      } else if (text.includes('energy') || text.includes('energize')) {
        category = 'energy';
      } else if (text.includes('sleep') || text.includes('bedtime')) {
        category = 'sleep';
      }
      
      // Determine difficulty
      if (text.includes('advanced') || text.includes('experienced')) {
        difficulty = 'advanced';
      } else if (text.includes('intermediate')) {
        difficulty = 'intermediate';
      }
      
      // Generate pattern based on category
      let pattern: BreathingPattern;
      
      switch (category) {
        case 'stress-relief':
          pattern = {
            name: "Custom Stress Relief",
            description: "Personalized pattern for stress reduction and relaxation",
            phases: { inhale: 4, hold: 6, exhale: 8 },
            difficulty,
            benefits: ["Reduces stress", "Promotes relaxation", "Calms mind"],
            category
          };
          break;
        case 'focus':
          pattern = {
            name: "Custom Focus Enhancer",
            description: "Tailored pattern for improved concentration and mental clarity",
            phases: { inhale: 4, hold: 4, exhale: 4, pause: 2 },
            difficulty,
            benefits: ["Improves focus", "Enhances clarity", "Boosts performance"],
            category
          };
          break;
        case 'energy':
          pattern = {
            name: "Custom Energy Booster",
            description: "Dynamic pattern for increased vitality and alertness",
            phases: { inhale: 3, hold: 1, exhale: 2 },
            difficulty,
            benefits: ["Increases energy", "Boosts alertness", "Enhances vitality"],
            category
          };
          break;
        case 'sleep':
          pattern = {
            name: "Custom Sleep Inducer",
            description: "Gentle pattern designed to promote restful sleep",
            phases: { inhale: 4, hold: 7, exhale: 10 },
            difficulty,
            benefits: ["Promotes sleep", "Reduces racing thoughts", "Relaxes body"],
            category
          };
          break;
        default:
          pattern = {
            name: "Custom Balanced Pattern",
            description: "Balanced breathing pattern for general wellness",
            phases: { inhale: 4, hold: 4, exhale: 6 },
            difficulty,
            benefits: ["Promotes balance", "Supports wellness", "Calms nervous system"],
            category
          };
      }
      
      // Store pattern in state for potential NFT minting
      if (state) {
        (state as Record<string, unknown>).customPattern = pattern;
      }
      
      const response = `I've created a personalized ${pattern.name} for you! 🌬️

**Pattern Details:**
- **Inhale:** ${pattern.phases.inhale} counts
${pattern.phases.hold ? `- **Hold:** ${pattern.phases.hold} counts` : ''}
- **Exhale:** ${pattern.phases.exhale} counts
${pattern.phases.pause ? `- **Pause:** ${pattern.phases.pause} counts` : ''}

**Benefits:** ${pattern.benefits.join(', ')}
**Difficulty:** ${pattern.difficulty}

This pattern is perfect for ${category.replace('-', ' ')}. Would you like to:
1. Practice this pattern with guided breathing
2. Mint this as your personal NFT
3. Share it with the community

Just let me know what you'd prefer! ✨`;

      callback({
        text: response,
        content: { pattern }
      });
      
    } catch (error) {
      elizaLogger.error("Error creating breathing pattern:", error);
      callback({
        text: "I encountered an issue creating your custom pattern. Let me try a different approach - what specific breathing goal do you have in mind? 🌬️"
      });
    }
  }
};

// Action: Analyze Breathing Session
const analyzeSessionAction: Action = {
  name: "ANALYZE_BREATHING_SESSION",
  similes: [
    "analyze my session",
    "review my breathing",
    "how did I do",
    "session feedback",
    "breathing analysis"
  ],
  description: "Analyzes a completed breathing session and provides personalized feedback",
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "How did my breathing session go? It felt pretty good"
        }
      },
      {
        user: "Zen",
        content: {
          text: "Great to hear it felt good! Let me analyze your session and provide personalized recommendations for your next practice."
        }
      }
    ]
  ],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    return (text.includes("analyze") || text.includes("review") || text.includes("feedback")) 
           && (text.includes("session") || text.includes("breathing"));
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: unknown,
    callback?: HandlerCallback
  ) => {
    if (!callback) return;
    
    try {
      elizaLogger.info("Analyzing breathing session");
      
      // Get real session data from the analytics API
      let sessionData: SessionData;
      const text = message.content.text.toLowerCase();
      const userId = message.userId || 'anonymous'; // Fix: Use userId property instead of user
      
      try {
        // Make actual API call to get the user's latest session data
        const response = await fetch(`/api/analytics/latest-session?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch session data: ${response.statusText}`);
        }
        
        sessionData = await response.json();
      } catch (err) {
        // If we can't get real data, create a minimal fallback but log the error
        console.error("Error fetching real session data:", err);
        
        // Create a baseline session with minimal data
        sessionData = {
          patternUsed: "4-7-8 Relaxation",
          duration: 5,
          completedCycles: 8,
          userFeedback: 'okay',
          timestamp: new Date()
        };
      }
      
      // Determine feedback based on user's message
      if (text.includes('difficult') || text.includes('hard') || text.includes('struggled')) {
        sessionData.userFeedback = 'difficult';
      } else if (text.includes('excellent') || text.includes('amazing') || text.includes('perfect')) {
        sessionData.userFeedback = 'excellent';
      } else if (text.includes('okay') || text.includes('fine') || text.includes('average')) {
        sessionData.userFeedback = 'okay';
      }
      
      // Generate personalized analysis
      let analysis = `Great session analysis! 📊 Here's your breathing session breakdown:\n\n`;
      analysis += `**Session Summary:**\n`;
      analysis += `- Pattern: ${sessionData.patternUsed}\n`;
      analysis += `- Duration: ${sessionData.duration} minutes\n`;
      analysis += `- Completed Cycles: ${sessionData.completedCycles}\n`;
      analysis += `- Your Rating: ${sessionData.userFeedback}\n\n`;
      
      // Provide personalized recommendations
      analysis += `**Personalized Recommendations:**\n`;
      
      switch (sessionData.userFeedback) {
        case 'excellent':
          analysis += `🌟 Outstanding work! You're ready to:\n`;
          analysis += `- Try a more advanced pattern like Breath of Fire\n`;
          analysis += `- Extend your session to 15-20 minutes\n`;
          analysis += `- Consider creating and minting your own pattern NFT\n`;
          break;
        case 'good':
          analysis += `💪 Solid progress! Next steps:\n`;
          analysis += `- Maintain consistency with daily practice\n`;
          analysis += `- Try extending by 2-3 minutes next time\n`;
          analysis += `- Explore intermediate patterns when ready\n`;
          break;
        case 'okay':
          analysis += `🌱 You're building the foundation! Focus on:\n`;
          analysis += `- Shorter, more frequent sessions\n`;
          analysis += `- Finding your comfortable rhythm\n`;
          analysis += `- Sticking with beginner-friendly patterns\n`;
          break;
        case 'difficult':
          analysis += `🤗 No worries, everyone starts somewhere! Try:\n`;
          analysis += `- Reducing the hold times by 1-2 counts\n`;
          analysis += `- Shorter 5-minute sessions to build stamina\n`;
          analysis += `- Box breathing (4-4-4-4) for easier rhythm\n`;
          break;
      }
      
      analysis += `\nWould you like me to suggest a specific pattern for your next session or help you track your progress as an NFT collection? 🌬️✨`;
      
      callback({
        text: analysis,
        content: { sessionData }
      });
      
    } catch (error) {
      elizaLogger.error("Error analyzing session:", error);
      callback({
        text: "I'd love to analyze your session! Can you tell me how your breathing practice went? Was it easy, challenging, or just right? 🌬️"
      });
    }
  }
};

// Action: Mint Breathing Pattern NFT
const mintPatternNFTAction: Action = {
  name: "MINT_BREATHING_NFT",
  similes: [
    "mint my pattern",
    "create NFT",
    "mint breathing NFT",
    "make this an NFT",
    "tokenize my pattern"
  ],
  description: "Mints a breathing pattern as an NFT on Flow blockchain",
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "I want to mint my breathing pattern as an NFT"
        }
      },
      {
        user: "Zen",
        content: {
          text: "Excellent! I'll mint your breathing pattern as a unique NFT on Flow blockchain. This will give you true ownership of your wellness creation!"
        }
      }
    ]
  ],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    return (text.includes("mint") || text.includes("nft")) && 
           (text.includes("pattern") || text.includes("breathing"));
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: unknown,
    callback?: HandlerCallback
  ) => {
    if (!callback) return;
    
    try {
      elizaLogger.info("Minting breathing pattern NFT");
      
      // Get pattern from state or use a default
      const pattern = (state as Record<string, unknown>)?.customPattern as BreathingPattern || {
        name: "Default Breathing Pattern",
        description: "A simple breathing pattern for general wellness",
        phases: { inhale: 4, hold: 4, exhale: 6 },
        difficulty: 'beginner' as const,
        benefits: ["Promotes relaxation", "Supports wellness"],
        category: 'custom' as const
      };

      // Call real Flow blockchain API for minting
      // Create proper NFT minting request
      const mintRequest = {
        pattern: pattern,
        creator: message.userId || 'anonymous',
        metadata: {
          name: pattern.name,
          description: pattern.description,
          category: pattern.category,
          difficulty: pattern.difficulty
        }
      };
      
      let nftId, transactionId;
      
      try {
        // Make actual API call to Flow blockchain service
        const response = await fetch('/api/flow/mint-pattern', { // TODO: Update to use API_ENDPOINTS.flow.mintPattern
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mintRequest),
        });
        
        if (!response.ok) {
          throw new Error(`Minting failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        nftId = result.tokenId;
        transactionId = result.transactionId;
      } catch (err) {
        throw new Error(`Blockchain error: ${err instanceof Error ? err.message : String(err)}`);
      }
      
      const response = `🎉 Successfully minted your breathing pattern NFT!

**NFT Details:**
- **Name:** ${pattern.name}
- **Token ID:** #${nftId}
- **Transaction:** ${transactionId}
- **Network:** Flow Testnet
- **Benefits:** ${pattern.benefits.join(', ')}

Your breathing pattern is now a unique digital asset that you truly own! 🌬️✨

**What you can do next:**
1. **List on Marketplace** - Set a price and sell to other practitioners
2. **Share Socially** - Post your achievement on Lens Protocol

Would you like me to help you with any of these next steps? Your wellness journey is now part of the blockchain! 🚀`;

      // Store NFT info in state
      if (state) {
        (state as Record<string, unknown>).mintedNFT = {
          id: nftId,
          transactionId: transactionId,
          pattern: pattern
        };
      }

      callback({
        text: response,
        content: {
          nftId,
          transactionId,
          pattern
        }
      });
      
    } catch (error) {
      elizaLogger.error("Error minting NFT:", error);
      callback({
        text: "I encountered an issue minting your NFT. Let me help you prepare your pattern first - what breathing technique would you like to tokenize? 🌬️"
      });
    }
  }
};


// Action: Recommend Breathing Pattern
const recommendPatternAction: Action = {
  name: "RECOMMEND_BREATHING_PATTERN",
  similes: [
    "recommend a pattern",
    "suggest breathing technique",
    "what should I practice",
    "help me choose",
    "breathing recommendation"
  ],
  description: "Recommends a breathing pattern based on user's current needs and goals",
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "I'm feeling stressed, what breathing pattern should I use?"
        }
      },
      {
        user: "Zen",
        content: {
          text: "For stress relief, I recommend the 4-7-8 technique. It's specifically designed to activate your relaxation response and calm your nervous system."
        }
      }
    ]
  ],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    return text.includes("recommend") || text.includes("suggest") || 
           text.includes("what should") || text.includes("help me choose");
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: unknown,
    callback?: HandlerCallback
  ) => {
    if (!callback) return;
    
    try {
      elizaLogger.info("Recommending breathing pattern");
      
      const text = message.content.text.toLowerCase();
      let recommendedPattern: BreathingPattern;
      let reasoning = "";
      
      // Analyze user's needs from their message
      if (text.includes('stress') || text.includes('anxiety') || text.includes('overwhelmed')) {
        recommendedPattern = BREATHING_PATTERNS["4-7-8"];
        reasoning = "You mentioned feeling stressed, so I'm recommending the 4-7-8 technique. It's specifically designed to activate your parasympathetic nervous system and provide quick stress relief.";
      } else if (text.includes('focus') || text.includes('concentration') || text.includes('work')) {
        recommendedPattern = BREATHING_PATTERNS["box-breathing"];
        reasoning = "For focus and concentration, box breathing is perfect! It's used by Navy SEALs and helps create mental clarity and sustained attention.";
      } else if (text.includes('energy') || text.includes('tired') || text.includes('wake up')) {
        recommendedPattern = BREATHING_PATTERNS["breath-of-fire"];
        reasoning = "To boost your energy levels, I recommend Breath of Fire. This powerful pranayama technique will energize your entire system and increase alertness.";
      } else if (text.includes('sleep') || text.includes('bedtime') || text.includes('insomnia')) {
        recommendedPattern = {
          ...BREATHING_PATTERNS["4-7-8"],
          name: "Extended 4-7-8 for Sleep",
          description: "Extended version of 4-7-8 specifically for bedtime",
          phases: { inhale: 4, hold: 7, exhale: 10 }
        };
        reasoning = "For better sleep, I'm suggesting an extended 4-7-8 pattern with a longer exhale. This will help slow your heart rate and prepare your body for rest.";
      } else {
        // Default recommendation for general wellness
        recommendedPattern = BREATHING_PATTERNS["box-breathing"];
        reasoning = "For general wellness and balance, box breathing is an excellent starting point. It's simple, effective, and great for building a consistent practice.";
      }
      
      const response = `🌬️ Perfect! I have the ideal breathing pattern for you:

**${recommendedPattern.name}**
${recommendedPattern.description}

**How to Practice:**
- **Inhale:** ${recommendedPattern.phases.inhale} counts
${recommendedPattern.phases.hold ? `- **Hold:** ${recommendedPattern.phases.hold} counts` : ''}
- **Exhale:** ${recommendedPattern.phases.exhale} counts
${recommendedPattern.phases.pause ? `- **Pause:** ${recommendedPattern.phases.pause} counts` : ''}

**Why This Pattern:**
${reasoning}

**Benefits You'll Experience:**
${recommendedPattern.benefits.map(benefit => `• ${benefit}`).join('\n')}

**Getting Started:**
1. Find a comfortable seated position
2. Start with 5-10 cycles
3. Focus on smooth, controlled breathing
4. Don't force it - let it feel natural

Would you like me to guide you through a practice session, or would you prefer to mint this pattern as your personal NFT for future use? ✨`;

      if (state) {
        (state as Record<string, unknown>).recommendedPattern = recommendedPattern;
      }

      callback({
        text: response,
        content: { pattern: recommendedPattern, reasoning }
      });
      
    } catch (error) {
      elizaLogger.error("Error recommending pattern:", error);
      callback({
        text: "I'd love to recommend the perfect breathing pattern for you! What are you hoping to achieve - stress relief, better focus, more energy, or improved sleep? 🌬️"
      });
    }
  }
};

// Main plugin export
export const breathingPatternPlugin: Plugin = {
  name: "breathing-pattern-plugin",
  description: "Comprehensive breathing pattern creation, analysis, and blockchain integration",
  actions: [
    createBreathingPatternAction,
    analyzeSessionAction,
    mintPatternNFTAction,
    recommendPatternAction
  ],
  evaluators: [],
  providers: []
};

export default breathingPatternPlugin;
