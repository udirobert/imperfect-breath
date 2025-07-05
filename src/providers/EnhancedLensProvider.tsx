import React, { createContext, useContext, ReactNode } from "react";
import { useLens } from "@/hooks/useLens";
import type {
  LensAuthTokens,
  LensAccount,
  BreathingSession,
  SocialPost,
  SocialActionResult,
  CommunityStats,
  TrendingPattern,
} from "@/lib/lens/types";

interface EnhancedLensContextType {
  // Authentication
  isAuthenticated: boolean;
  currentAccount: LensAccount | null;
  authTokens: LensAuthTokens | null;

  // Loading states
  isLoading: boolean;
  isAuthenticating: boolean;

  // Error handling
  error: string | null;
  errorType: string | null;

  // Authentication actions
  authenticate: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;

  // Social actions
  shareBreathingSession: (
    session: BreathingSession
  ) => Promise<SocialActionResult>;
  shareBreathingPattern: (patternData: {
    name: string;
    description: string;
    nftId: string;
    contractAddress: string;
    imageUri?: string;
  }) => Promise<SocialActionResult>;

  // Community actions
  followAccount: (address: string) => Promise<SocialActionResult>;
  unfollowAccount: (address: string) => Promise<SocialActionResult>;
  likePost: (postId: string) => Promise<SocialActionResult>;
  commentOnPost: (
    postId: string,
    comment: string
  ) => Promise<SocialActionResult>;

  // Data fetching
  getTimeline: (accountAddress: string) => Promise<SocialPost[]>;
  getFollowers: (accountAddress: string) => Promise<LensAccount[]>;
  getFollowing: (accountAddress: string) => Promise<LensAccount[]>;

  // Community data
  communityStats: CommunityStats;
  trendingPatterns: TrendingPattern[];

  // Utilities
  refreshData: () => Promise<void>;
  clearError: () => void;
  invalidateCache: (key?: string) => void;
}

const EnhancedLensContext = createContext<EnhancedLensContextType | null>(null);

/**
 * Enhanced Lens Provider with improved error handling, caching and retry mechanisms
 */
export const EnhancedLensProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // The hook itself now contains all the enhanced functionality
  const lensHook = useLens();

  return (
    <EnhancedLensContext.Provider value={lensHook}>
      {children}
    </EnhancedLensContext.Provider>
  );
};

/**
 * Hook to access the enhanced Lens context
 */
export const useEnhancedLens = (): EnhancedLensContextType => {
  const context = useContext(EnhancedLensContext);
  if (!context) {
    throw new Error(
      "useEnhancedLens must be used within an EnhancedLensProvider"
    );
  }
  return context;
};

export default EnhancedLensProvider;
