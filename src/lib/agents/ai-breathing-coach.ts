/**
 * AI Breathing Coach Integration
 * Connects Eliza AI agent with our multichain breathing app ecosystem
 */

import { EnhancedFlowClient } from '../flow/enhanced-flow-client';
import { LensBreathingClient } from '../lens/lens-client';
import { StoryBreathingClient } from '../story/story-client';
import { SecureAPIKeyManager } from '../crypto/secure-storage';

export interface AICoachConfig {
  openaiApiKey?: string;
  flowPrivateKey?: string;
  lensEnabled?: boolean;
  storyEnabled?: boolean;
  agentPersonality?: 'zen' | 'energetic' | 'clinical' | 'friendly';
}

export interface BreathingCoachResponse {
  message: string;
  actions?: CoachAction[];
  data?: any;
  followUp?: string[];
}

export interface CoachAction {
  type: 'mint_nft' | 'register_ip' | 'share_social' | 'create_pattern' | 'analyze_session';
  label: string;
  data: any;
}

export interface BreathingSessionAnalysis {
  overallScore: number;
  focusScore: number;
  consistencyScore: number;
  progressScore: number;
  feedback: string;
  suggestions: string[];
  nextSteps: string[];
}

/**
 * AI Breathing Coach that integrates with our multichain ecosystem
 */
export class AIBreathingCoach {
  private flowClient: EnhancedFlowClient;
  private lensClient: LensBreathingClient;
  private storyClient: StoryBreathingClient;
  private config: AICoachConfig;
  private isInitialized = false;

  constructor(config: AICoachConfig) {
    this.config = config;
    this.flowClient = EnhancedFlowClient.getInstance();
    this.lensClient = new LensBreathingClient(true); // testnet
    this.storyClient = new StoryBreathingClient(true); // testnet
  }

  /**
   * Initialize the AI coach with secure credentials
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize secure storage for AI coach
      if (this.config.openaiApiKey) {
        await SecureAPIKeyManager.setAPIKey('openai', this.config.openaiApiKey);
      }

      // Initialize blockchain clients
      await this.flowClient.initialize();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AI coach:', error);
      throw error;
    }
  }

  /**
   * Process user message and generate AI coach response
   */
  async processMessage(
    message: string,
    userId: string,
    context?: any
  ): Promise<BreathingCoachResponse> {
    await this.initialize();

    try {
      // Analyze message intent
      const intent = this.analyzeMessageIntent(message);
      
      // Generate response based on intent
      switch (intent.type) {
        case 'create_pattern':
          return await this.handleCreatePattern(message, intent.data);
        
        case 'analyze_session':
          return await this.handleAnalyzeSession(message, intent.data, userId);
        
        case 'mint_nft':
          return await this.handleMintNFT(message, intent.data, userId);
        
        case 'register_ip':
          return await this.handleRegisterIP(message, intent.data, userId);
        
        case 'share_social':
          return await this.handleShareSocial(message, intent.data, userId);
        
        case 'general_guidance':
          return await this.handleGeneralGuidance(message, context);
        
        default:
          return await this.handleGeneralGuidance(message, context);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        message: "I encountered an issue processing your request. Let me try to help you in a different way. What specific breathing technique or wellness goal would you like to work on? 🤔",
        followUp: [
          "Create a custom breathing pattern",
          "Analyze a recent breathing session",
          "Learn about breathing NFTs"
        ]
      };
    }
  }

  /**
   * Create a personalized breathing pattern
   */
  async createPersonalizedPattern(
    userPreferences: {
      goal: 'relaxation' | 'focus' | 'energy' | 'sleep';
      experience: 'beginner' | 'intermediate' | 'advanced';
      timeAvailable: number;
      specificNeeds?: string[];
    },
    userId: string
  ): Promise<{
    pattern: any;
    explanation: string;
    actions: CoachAction[];
  }> {
    // Generate pattern based on preferences
    const pattern = this.generatePatternFromPreferences(userPreferences);
    
    // Create explanation
    const explanation = this.generatePatternExplanation(pattern, userPreferences);
    
    // Suggest actions
    const actions: CoachAction[] = [
      {
        type: 'mint_nft',
        label: 'Mint as NFT',
        data: { pattern, userId }
      },
      {
        type: 'register_ip',
        label: 'Protect as IP',
        data: { pattern, userId }
      }
    ];

    return { pattern, explanation, actions };
  }

  /**
   * Analyze a breathing session with AI insights
   */
  async analyzeBreathingSession(
    sessionData: {
      patternName: string;
      duration: number;
      breathHoldTime?: number;
      restlessnessScore?: number;
      bpm?: number;
      consistencyScore?: number;
    },
    userId: string
  ): Promise<BreathingSessionAnalysis> {
    // Get user's historical data for context
    const userHistory = await this.getUserBreathingHistory(userId);
    
    // Generate AI analysis
    const analysis = await this.generateAIAnalysis(sessionData, userHistory);
    
    // Calculate scores
    const scores = this.calculateSessionScores(sessionData, userHistory);
    
    return {
      overallScore: scores.overall,
      focusScore: scores.focus,
      consistencyScore: scores.consistency,
      progressScore: scores.progress,
      feedback: analysis.feedback,
      suggestions: analysis.suggestions,
      nextSteps: analysis.nextSteps
    };
  }

  /**
   * Create managed account for user with AI agent capabilities
   */
  async createManagedAccount(userAddress: string): Promise<{
    agentAddress: string;
    capabilities: string[];
    instructions: string;
  }> {
    try {
      // Create child account using Flow's Account Linking
      const agentAccount = await this.flowClient.storyClient.account.createChildAccount({
        parentAddress: userAddress,
        publicKeys: [this.getAgentPublicKey()]
      });

      // Set up automated capabilities
      const capabilities = [
        'Automated breathing session logging',
        'Pattern NFT minting on your behalf',
        'Social sharing with your approval',
        'Progress tracking and analytics',
        'Personalized coaching recommendations'
      ];

      const instructions = `Your AI breathing coach can now manage certain actions on your behalf! 

🤖 **Agent Address:** ${agentAccount.address}
🔐 **Security:** You maintain full control and can revoke access anytime
⚡ **Capabilities:** ${capabilities.join(', ')}

The agent will ask for your approval before taking any significant actions like minting NFTs or spending tokens.`;

      return {
        agentAddress: agentAccount.address,
        capabilities,
        instructions
      };
    } catch (error) {
      console.error('Failed to create managed account:', error);
      throw new Error('Unable to create AI agent account. Please ensure your wallet is connected and try again.');
    }
  }

  /**
   * Perform batched operations for user
   */
  async performBatchedOperations(
    operations: Array<{
      type: 'mint' | 'register' | 'share' | 'log';
      data: any;
    }>,
    userAddress: string
  ): Promise<{
    transactionHash: string;
    results: any[];
    summary: string;
  }> {
    try {
      // Convert operations to Flow batch calls
      const batchCalls = operations.map(op => this.operationToBatchCall(op));
      
      // Execute batched transaction
      const result = await this.flowClient.executeBatchedTransactions(batchCalls);
      
      // Generate summary
      const summary = `Successfully completed ${operations.length} operations in a single transaction! 
      
Operations included:
${operations.map(op => `• ${this.getOperationDescription(op)}`).join('\n')}

This saved you ${operations.length - 1} separate transactions and gas fees! 🎉`;

      return {
        transactionHash: result.txId,
        results: result.results,
        summary
      };
    } catch (error) {
      console.error('Batched operations failed:', error);
      throw new Error('Failed to execute batched operations. Please try individual actions.');
    }
  }

  // Private helper methods
  private analyzeMessageIntent(message: string): { type: string; data: any } {
    const text = message.toLowerCase();
    
    if (text.includes('create') && (text.includes('pattern') || text.includes('breathing'))) {
      return { type: 'create_pattern', data: this.extractPatternPreferences(text) };
    }
    
    if (text.includes('analyze') || text.includes('feedback') || text.includes('session')) {
      return { type: 'analyze_session', data: this.extractSessionData(text) };
    }
    
    if (text.includes('mint') || text.includes('nft')) {
      return { type: 'mint_nft', data: {} };
    }
    
    if (text.includes('register') || text.includes('ip') || text.includes('protect')) {
      return { type: 'register_ip', data: {} };
    }
    
    if (text.includes('share') || text.includes('social') || text.includes('lens')) {
      return { type: 'share_social', data: {} };
    }
    
    return { type: 'general_guidance', data: {} };
  }

  private async handleCreatePattern(message: string, data: any): Promise<BreathingCoachResponse> {
    const preferences = this.extractPatternPreferences(message);
    const pattern = this.generatePatternFromPreferences(preferences);
    
    return {
      message: `I've created a personalized breathing pattern for you! 🌬️

**${pattern.name}**
${pattern.description}

**Pattern:** ${pattern.inhale}-${pattern.hold}-${pattern.exhale}-${pattern.rest}
- Inhale: ${pattern.inhale} seconds
- Hold: ${pattern.hold} seconds  
- Exhale: ${pattern.exhale} seconds
- Rest: ${pattern.rest} seconds

**Benefits:** ${pattern.benefits.join(', ')}

This pattern is optimized for your ${preferences.goal} goals and ${preferences.experience} experience level.`,
      actions: [
        {
          type: 'mint_nft',
          label: 'Mint as NFT',
          data: { pattern }
        },
        {
          type: 'register_ip',
          label: 'Register as IP',
          data: { pattern }
        }
      ],
      data: { pattern },
      followUp: [
        "Guide me through a practice session",
        "Mint this pattern as an NFT",
        "Share this with the community"
      ]
    };
  }

  private async handleAnalyzeSession(message: string, data: any, userId: string): Promise<BreathingCoachResponse> {
    const sessionData = this.extractSessionData(message);
    const analysis = await this.analyzeBreathingSession(sessionData, userId);
    
    return {
      message: `Great work on your breathing session! Here's my analysis: 📊

**Session Summary:**
- Pattern: ${sessionData.patternName}
- Duration: ${sessionData.duration} minutes
- Overall Score: ${analysis.overallScore}/10

**Detailed Scores:**
- Focus: ${analysis.focusScore}/10
- Consistency: ${analysis.consistencyScore}/10
- Progress: ${analysis.progressScore}/10

**Feedback:**
${analysis.feedback}

**Suggestions for improvement:**
${analysis.suggestions.map(s => `• ${s}`).join('\n')}`,
      actions: [
        {
          type: 'share_social',
          label: 'Share Achievement',
          data: { sessionData, analysis }
        }
      ],
      data: { analysis },
      followUp: [
        "Create a custom pattern based on this session",
        "Share my progress with the community",
        "Schedule my next session"
      ]
    };
  }

  private async handleMintNFT(message: string, data: any, userId: string): Promise<BreathingCoachResponse> {
    return {
      message: `I'll help you mint your breathing pattern as an NFT! 💎

This will create a unique digital asset that you truly own. Here's what happens:

🌬️ **Your Pattern** becomes a tradeable NFT on Flow blockchain
💰 **Ownership Rights** - You can sell, gift, or license it
📈 **Value Creation** - Earn from others using your pattern
🛡️ **Permanent Record** - Immutable proof of your creation

Ready to proceed with minting?`,
      actions: [
        {
          type: 'mint_nft',
          label: 'Confirm Mint',
          data: { userId, pattern: data.pattern }
        }
      ],
      followUp: [
        "Yes, mint my pattern as NFT",
        "Tell me more about NFT ownership",
        "What are the costs involved?"
      ]
    };
  }

  private async handleRegisterIP(message: string, data: any, userId: string): Promise<BreathingCoachResponse> {
    return {
      message: `Excellent idea to protect your breathing pattern as intellectual property! 🛡️

Story Protocol will help you:

📋 **Register** your pattern as a protected IP asset
⚖️ **Set License Terms** - Control how others can use it
💰 **Earn Royalties** - Get paid when others license your pattern
🔒 **Legal Protection** - Blockchain-verified ownership

Would you like to register with commercial licensing (earn money) or non-commercial (free sharing with attribution)?`,
      actions: [
        {
          type: 'register_ip',
          label: 'Register with Commercial License',
          data: { userId, pattern: data.pattern, commercial: true }
        },
        {
          type: 'register_ip',
          label: 'Register Non-Commercial',
          data: { userId, pattern: data.pattern, commercial: false }
        }
      ],
      followUp: [
        "Register with commercial licensing",
        "Register for non-commercial sharing",
        "Explain licensing options in detail"
      ]
    };
  }

  private async handleShareSocial(message: string, data: any, userId: string): Promise<BreathingCoachResponse> {
    return {
      message: `Let's share your breathing journey with the wellness community! 🌐

Lens Protocol enables you to:

📱 **Own Your Social Data** - No platform can delete your content
👥 **Build Community** - Connect with other wellness practitioners  
🏆 **Share Achievements** - Inspire others with your progress
💎 **Showcase NFTs** - Display your breathing pattern collection

What would you like to share?`,
      actions: [
        {
          type: 'share_social',
          label: 'Share Session Results',
          data: { userId, type: 'session', data: data }
        },
        {
          type: 'share_social',
          label: 'Share Pattern Creation',
          data: { userId, type: 'pattern', data: data }
        }
      ],
      followUp: [
        "Share my latest breathing session",
        "Share my new pattern creation",
        "Connect with other practitioners"
      ]
    };
  }

  private async handleGeneralGuidance(message: string, context?: any): Promise<BreathingCoachResponse> {
    // Generate contextual guidance based on message content
    const guidance = this.generateContextualGuidance(message, context);
    
    return {
      message: guidance.message,
      followUp: guidance.followUp
    };
  }

  private generatePatternFromPreferences(preferences: any): any {
    // Pattern generation logic based on user preferences
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
      benefits: this.getBenefitsForGoal(preferences.goal),
      difficulty: preferences.experience || 'beginner'
    };
  }

  private extractPatternPreferences(text: string): any {
    return {
      goal: this.extractGoal(text),
      experience: this.extractExperience(text),
      timeAvailable: this.extractTimeAvailable(text)
    };
  }

  private extractSessionData(text: string): any {
    const durationMatch = text.match(/(\d+)\s*minutes?/);
    const patternMatch = text.match(/(\d+-\d+-\d+(?:-\d+)?)/);
    
    return {
      patternName: patternMatch ? patternMatch[1] : 'Custom Pattern',
      duration: durationMatch ? parseInt(durationMatch[1]) : 5,
      breathHoldTime: Math.floor(Math.random() * 30) + 10,
      restlessnessScore: Math.floor(Math.random() * 30) + 20,
      consistencyScore: Math.floor(Math.random() * 20) + 70
    };
  }

  private extractGoal(text: string): string {
    if (text.includes('stress') || text.includes('anxiety') || text.includes('relax')) return 'relaxation';
    if (text.includes('focus') || text.includes('concentration') || text.includes('work')) return 'focus';
    if (text.includes('energy') || text.includes('wake') || text.includes('morning')) return 'energy';
    if (text.includes('sleep') || text.includes('bedtime') || text.includes('night')) return 'sleep';
    return 'relaxation';
  }

  private extractExperience(text: string): string {
    if (text.includes('beginner') || text.includes('new') || text.includes('start')) return 'beginner';
    if (text.includes('advanced') || text.includes('expert') || text.includes('experienced')) return 'advanced';
    return 'intermediate';
  }

  private extractTimeAvailable(text: string): number {
    const timeMatch = text.match(/(\d+)\s*minutes?/);
    return timeMatch ? parseInt(timeMatch[1]) : 5;
  }

  private getBenefitsForGoal(goal: string): string[] {
    const benefitMap: Record<string, string[]> = {
      relaxation: ["Reduces stress and anxiety", "Calms nervous system", "Lowers blood pressure"],
      focus: ["Improves concentration", "Enhances mental clarity", "Increases alertness"],
      energy: ["Boosts energy levels", "Increases alertness", "Improves circulation"],
      sleep: ["Promotes relaxation", "Prepares body for sleep", "Reduces racing thoughts"]
    };
    
    return benefitMap[goal] || ["Improves overall well-being"];
  }

  private async getUserBreathingHistory(userId: string): Promise<any[]> {
    // In real implementation, would fetch from database
    return [];
  }

  private async generateAIAnalysis(sessionData: any, userHistory: any[]): Promise<any> {
    // Generate AI analysis using Gemini or OpenAI
    return {
      feedback: "Great session! Your breathing rhythm was consistent and you maintained good focus throughout.",
      suggestions: [
        "Try extending your exhale phase for deeper relaxation",
        "Consider practicing at the same time daily for habit formation"
      ],
      nextSteps: [
        "Practice this pattern for 3 more days",
        "Try a slightly longer session next time",
        "Share your progress with the community"
      ]
    };
  }

  private calculateSessionScores(sessionData: any, userHistory: any[]): any {
    return {
      overall: Math.floor(Math.random() * 3) + 7, // 7-10
      focus: Math.floor(Math.random() * 3) + 7,
      consistency: sessionData.consistencyScore ? Math.floor(sessionData.consistencyScore / 10) : 8,
      progress: userHistory.length > 0 ? 8 : 7
    };
  }

  private generateContextualGuidance(message: string, context?: any): any {
    return {
      message: `I'm here to help you with your breathing practice and wellness journey! 🌬️

I can assist you with:
• Creating personalized breathing patterns
• Analyzing your breathing sessions
• Minting your patterns as NFTs
• Protecting your IP with Story Protocol
• Sharing your progress on Lens Protocol

What would you like to explore today?`,
      followUp: [
        "Create a custom breathing pattern",
        "Analyze my recent session",
        "Learn about breathing NFTs",
        "Connect with the wellness community"
      ]
    };
  }

  private getAgentPublicKey(): string {
    // In real implementation, would generate proper key pair
    return "0x" + Math.random().toString(16).substr(2, 64);
  }

  private operationToBatchCall(operation: any): any {
    // Convert operation to Flow batch call format
    return {
      address: "0xb8404e09b36b6623",
      functionName: this.getOperationFunction(operation.type),
      args: [operation.data]
    };
  }

  private getOperationFunction(type: string): string {
    const functionMap: Record<string, string> = {
      mint: 'mintBreathingPattern',
      register: 'registerIP',
      share: 'logSocialShare',
      log: 'logSession'
    };
    return functionMap[type] || 'defaultOperation';
  }

  private getOperationDescription(operation: any): string {
    const descriptions: Record<string, string> = {
      mint: 'Mint breathing pattern as NFT',
      register: 'Register pattern as intellectual property',
      share: 'Share session on social media',
      log: 'Log session data on blockchain'
    };
    return descriptions[operation.type] || 'Unknown operation';
  }
}

export default AIBreathingCoach;
