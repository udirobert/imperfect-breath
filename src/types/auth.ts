import { Mail, Wallet, Users, Coins, Zap } from "lucide-react";

export interface AuthMethod {
  id: "guest" | "email" | "wallet" | "lens" | "flow";
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  benefits: string[];
  priority: number;
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
    priority: 2,
    requiresInput: true,
  },

  wallet: {
    id: "wallet",
    title: "Wallet",
    description: "Connect your crypto wallet",
    icon: Wallet,
    benefits: [
      "Connect crypto wallet",
      "Full ownership",
      "Works across chains",
    ],
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
    priority: 5,
    requiresInput: false,
  },
};

export const getRecommendedAuthMethods = (
  context?: AuthContext,
  currentAuthState?: { isAuthenticated: boolean; hasWallet: boolean },
): AuthMethod[] => {
  if (currentAuthState?.isAuthenticated) {
    return [];
  }

  switch (context?.type) {
    case "nft-purchase":
    case "creator-tools":
      return [
        AUTH_METHODS.flow,
        AUTH_METHODS.wallet,
        AUTH_METHODS.email,
        AUTH_METHODS.guest,
      ];

    case "social-share":
      return [
        AUTH_METHODS.lens,
        AUTH_METHODS.wallet,
        AUTH_METHODS.email,
        AUTH_METHODS.guest,
      ];

    case "progress-tracking":
      return [AUTH_METHODS.email, AUTH_METHODS.wallet, AUTH_METHODS.guest];

    case "profile":
    default:
      return [
        AUTH_METHODS.guest,
        AUTH_METHODS.email,
        AUTH_METHODS.lens,
        AUTH_METHODS.flow,
        AUTH_METHODS.wallet,
      ];
  }
};

export const getAuthMethodDisplay = (
  methods: AuthMethod[],
  mode: "full" | "minimal" | "contextual" = "full",
) => {
  switch (mode) {
    case "minimal":
      return methods.slice(0, 3);

    case "contextual":
      return methods.sort((a, b) => a.priority - b.priority);

    case "full":
    default:
      return methods.slice(0, 5);
  }
};
