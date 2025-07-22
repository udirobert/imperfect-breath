/**
 * Messaging Configuration for Context-Aware Authentication
 * 
 * This configuration drives the progressive authentication strategy,
 * providing context-specific messaging and benefits for each auth type.
 */

export type AuthType = 'none' | 'supabase' | 'evm' | 'flow';
export type AuthContext = 'social' | 'nft' | 'progress' | 'instructor' | 'wellness';

export const MESSAGING = {
  hero: {
    wellness: "Transform your breathing with AI-powered guidance",
    instructor: "Teach mindful breathing with professional tools",
    community: "Join a community of mindful breathers",
  },
  
  cta: {
    primary: "Start Free Session",
    secondary: "Save Your Progress", // Triggers Supabase auth
    tertiary: "Join Community", // Triggers EVM for social
    instructor: "Start Teaching",
  },
  
  auth: {
    supabase: {
      context: "Track your progress and see improvement over time",
      benefits: [
        "Session history & analytics",
        "Progress tracking over time", 
        "Personalized breathing insights",
        "Achievement system",
        "Custom pattern creation"
      ],
      cta: "Create Free Account",
      skip: "Continue as Guest"
    },
    
    evm: {
      context: "Connect with the Lens community",
      benefits: [
        "Share sessions with community",
        "Follow favorite instructors", 
        "Join breathing challenges",
        "Earn social reputation",
        "Access exclusive content"
      ],
      cta: "Connect Social Wallet",
      skip: "Skip Social Features"
    },
    
    flow: {
      context: "Own your breathing patterns as NFTs",
      benefits: [
        "Mint unique breathing patterns",
        "Trade patterns with community",
        "Prove pattern authenticity", 
        "Earn from pattern creation",
        "Build digital collection"
      ],
      cta: "Connect Flow Wallet",
      skip: "Skip NFT Features"
    }
  },

  // Context-specific prompts
  prompts: {
    progress: {
      title: "Save Your Progress?",
      description: "Create a free account to track your breathing journey and see improvement over time.",
      trigger: "After completing 3rd session"
    },
    
    social: {
      title: "Share With Community?", 
      description: "Connect your wallet to share this session, follow instructors, and join challenges.",
      trigger: "On first social action attempt"
    },
    
    nft: {
      title: "Own This Pattern?",
      description: "Mint your breathing pattern as an NFT to prove authenticity and potentially earn from it.",
      trigger: "On pattern creation or marketplace visit"
    },
    
    instructor: {
      title: "Ready to Teach?",
      description: "Access professional tools to create courses and manage your breathing instruction business.",
      trigger: "On instructor CTA click"
    }
  },

  // Feature explanations
  features: {
    anonymous: [
      "Unlimited breathing sessions",
      "Basic pattern library",
      "Simple progress tracking (local)"
    ],
    
    supabase: [
      "Everything in Anonymous, plus:",
      "Cloud progress sync",
      "Advanced analytics",
      "Custom pattern creation",
      "Achievement system"
    ],
    
    social: [
      "Everything in Progress Tracking, plus:",
      "Community sharing",
      "Social challenges", 
      "Follow instructors",
      "Reputation system"
    ],
    
    nft: [
      "Everything in Social, plus:",
      "Pattern NFT minting",
      "Marketplace trading",
      "Creator monetization",
      "Ownership verification"
    ]
  }
} as const;

// Helper functions for messaging logic
export const getAuthMessage = (authType: AuthType, context: AuthContext) => {
  if (authType === 'none') return null;
  
  const authConfig = MESSAGING.auth[authType as keyof typeof MESSAGING.auth];
  return authConfig || null;
};

export const getPromptForContext = (context: AuthContext) => {
  return MESSAGING.prompts[context as keyof typeof MESSAGING.prompts] || null;
};

export const getFeaturesForAuthLevel = (authLevel: AuthType) => {
  const levelMap: Record<AuthType, keyof typeof MESSAGING.features> = {
    'none': 'anonymous',
    'supabase': 'supabase', 
    'evm': 'social',
    'flow': 'nft'
  };
  
  return MESSAGING.features[levelMap[authLevel]] || MESSAGING.features.anonymous;
};