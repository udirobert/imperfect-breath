/**
 * Auth Method Definitions - Single Source of Truth
 *
 * ORGANIZED: Domain-driven auth method configuration
 * DRY: Centralized auth method definitions
 * CLEAN: Clear separation of auth method concerns
 */

import { Mail, Wallet, Zap, Users, Coins } from "lucide-react";
import type { AuthFeatures } from "./useAuth";

export interface AuthMethod {
  id: "guest" | "email" | "wallet" | "lens" | "flow";
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  benefits: string[];
  features?: AuthFeatures;
  priority: number; // Lower = higher priority
  requiresInput: boolean;
}

export interface AuthContext {
  type?:
    | "profile"
    | "nft-purchase"
    | "social-share"
    | "creator-tools"
    | "progress-tracking";
  source?: string;
}

/**
 * ORGANIZED: Core auth method definitions
 */
export const AUTH_METHODS: Record<string, AuthMethod> = {
  guest: {
    id: "guest",
    title: "Quick Start",
    description: "Try breathing sessions immediately",
    icon: Zap,
    benefits: [
      "Instant access",
      "All breathing patterns",
      "No signup required",
    ],
    features: {},
    priority: 1,
    requiresInput: false,
  },

  email: {
    id: "email",
    title: "Sign In",
    description: "Create account or sign in with email",
    icon: Mail,
    benefits: [
      "Save your progress",
      "Sync across devices",
      "Personalized insights",
      "Access anywhere",
    ],
    features: {},
    priority: 2,
    requiresInput: true,
  },

  wallet: {
    id: "wallet",
    title: "Web3 Wallet",
    description: "Connect your existing crypto wallet",
    icon: Wallet,
    benefits: [
      "Connect existing wallet",
      "Full self-custody",
      "Multi-chain support",
      "Hardware wallet compatible",
    ],
    features: { blockchain: true },
    priority: 3,
    requiresInput: false,
  },

  lens: {
    id: "lens",
    title: "Lens Social",
    description: "Decentralized social features with Lens Protocol",
    icon: Users,
    benefits: [
      "Own your social graph",
      "Decentralized social features",
      "Share breathing patterns",
      "Connect with community",
    ],
    features: { blockchain: true, lens: true },
    priority: 4,
    requiresInput: false,
  },

  flow: {
    id: "flow",
    title: "Flow Blockchain",
    description: "NFTs and onchain actions on Flow (Forte)",
    icon: Coins,
    benefits: [
      "Mint breathing pattern NFTs",
      "Flow ecosystem access",
      "Low-cost transactions",
      "Creator monetization",
    ],
    features: { blockchain: true, flow: true },
    priority: 5,
    requiresInput: false,
  },
};

/**
 * Context-aware auth method recommendations
 * Shows relevant auth methods based on user intent
 */
export const getRecommendedAuthMethods = (
  context?: AuthContext,
  currentAuthState?: { isAuthenticated: boolean; hasWallet: boolean },
): AuthMethod[] => {
  // If already authenticated, don't show auth methods
  if (currentAuthState?.isAuthenticated) {
    return [];
  }

  // Context-specific recommendations
  switch (context?.type) {
    case "nft-purchase":
    case "creator-tools":
      // NFT and creator features - show Flow for minting, fallback options
      return [
        AUTH_METHODS.flow,
        AUTH_METHODS.wallet,
        AUTH_METHODS.email,
        AUTH_METHODS.guest,
      ];

    case "social-share":
      // Social features - prioritize Lens for social graph
      return [
        AUTH_METHODS.lens,
        AUTH_METHODS.wallet,
        AUTH_METHODS.email,
        AUTH_METHODS.guest,
      ];

    case "progress-tracking":
      // Progress tracking needs persistent auth
      return [AUTH_METHODS.email, AUTH_METHODS.wallet, AUTH_METHODS.guest];

    case "profile":
    default:
      // ENHANCEMENT FIRST: Progressive enhancement - show all options
      return [
        AUTH_METHODS.guest,
        AUTH_METHODS.email,
        AUTH_METHODS.lens,
        AUTH_METHODS.flow,
        AUTH_METHODS.wallet,
      ];
  }
};

/**
 * MODULAR: Get required features based on context
 */
export const getRequiredFeatures = (context?: AuthContext): AuthFeatures => {
  switch (context?.type) {
    case "nft-purchase":
    case "creator-tools":
      return { blockchain: true, flow: true };

    case "social-share":
      return { blockchain: true, lens: true };

    case "progress-tracking":
    case "profile":
    default:
      return {}; // Basic auth sufficient
  }
};

/**
 * PERFORMANT: Get auth method display configuration
 */
export const getAuthMethodDisplay = (
  methods: AuthMethod[],
  mode: "full" | "minimal" | "contextual" = "full",
) => {
  switch (mode) {
    case "minimal":
      // Show only top 3 methods for simplicity
      return methods.slice(0, 3);

    case "contextual":
      // Show methods based on context priority
      return methods.sort((a, b) => a.priority - b.priority);

    case "full":
    default:
      // Show all methods, limit to 5 to prevent overwhelm
      return methods.slice(0, 5);
  }
};
