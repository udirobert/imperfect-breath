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
  id: 'guest' | 'email' | 'wallet';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  benefits: string[];
  features?: AuthFeatures;
  priority: number; // Lower = higher priority
  requiresInput: boolean;
}

export interface AuthContext {
  type?: 'profile' | 'nft-purchase' | 'social-share' | 'creator-tools' | 'progress-tracking';
  source?: string;
}

/**
 * ORGANIZED: Core auth method definitions
 */
export const AUTH_METHODS: Record<string, AuthMethod> = {
  guest: {
    id: 'guest',
    title: 'Quick Start',
    description: 'Try breathing sessions immediately',
    icon: Zap,
    benefits: [
      'Instant access',
      'All breathing patterns',
      'No signup required'
    ],
    features: {},
    priority: 1,
    requiresInput: false,
  },
  
  email: {
    id: 'email',
    title: 'Sign In',
    description: 'Create account or sign in with email',
    icon: Mail,
    benefits: [
      'Save your progress',
      'Sync across devices',
      'Personalized insights',
      'Access anywhere'
    ],
    features: {},
    priority: 2,
    requiresInput: true,
  },
  
  wallet: {
    id: 'wallet',
    title: 'Onchain',
    description: 'NFTs, social features, and blockchain tools',
    icon: Wallet,
    benefits: [
      'Own your breathing patterns as NFTs',
      'Social community features',
      'Creator monetization tools',
      'Cross-platform compatibility'
    ],
    features: { blockchain: true, lens: true, flow: true },
    priority: 3,
    requiresInput: false,
  },

  // AGGRESSIVE CONSOLIDATION: Remove duplicate lens and flow methods
  // These are now consolidated into the wallet method above
};

/**
 * AGGRESSIVE CONSOLIDATION: Streamlined auth method recommendations
 * PREVENT BLOAT: Maximum 3 options to reduce cognitive load
 */
export const getRecommendedAuthMethods = (
  context?: AuthContext,
  currentAuthState?: { isAuthenticated: boolean; hasWallet: boolean }
): AuthMethod[] => {
  // If already authenticated, don't show auth methods
  if (currentAuthState?.isAuthenticated) {
    return [];
  }

  // AGGRESSIVE CONSOLIDATION: Context-specific recommendations with max 3 options
  switch (context?.type) {
    case 'nft-purchase':
    case 'creator-tools':
      // Blockchain features need wallet - show only relevant options
      return [AUTH_METHODS.wallet, AUTH_METHODS.email, AUTH_METHODS.guest];
      
    case 'social-share':
      // Social features - prioritize wallet for social auth
      return [AUTH_METHODS.wallet, AUTH_METHODS.email, AUTH_METHODS.guest];
      
    case 'progress-tracking':
      // Progress tracking needs persistent auth
      return [AUTH_METHODS.email, AUTH_METHODS.wallet, AUTH_METHODS.guest];
      
    case 'profile':
    default:
      // ENHANCEMENT FIRST: Progressive enhancement with clear value proposition
      return [AUTH_METHODS.guest, AUTH_METHODS.email, AUTH_METHODS.wallet];
  }
};

/**
 * MODULAR: Get required features based on context
 */
export const getRequiredFeatures = (context?: AuthContext): AuthFeatures => {
  switch (context?.type) {
    case 'nft-purchase':
    case 'creator-tools':
      return { blockchain: true };
      
    case 'social-share':
      return { blockchain: true, lens: true };
      
    case 'progress-tracking':
    case 'profile':
    default:
      return {}; // Basic auth sufficient
  }
};

/**
 * PERFORMANT: Get auth method display configuration
 */
export const getAuthMethodDisplay = (
  methods: AuthMethod[],
  mode: 'full' | 'minimal' | 'contextual' = 'full'
) => {
  switch (mode) {
    case 'minimal':
      // Show only top 2 methods
      return methods.slice(0, 2);
      
    case 'contextual':
      // Show methods based on context priority
      return methods.sort((a, b) => a.priority - b.priority);
      
    case 'full':
    default:
      // Show all methods
      return methods;
  }
};