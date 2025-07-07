import React, { createContext, useContext, ReactNode } from "react";
import { useLens } from "../hooks/useLens";
import {
  LensAccount,
  LensAuthTokens,
  BreathingSessionPost,
} from "../lib/lens/lens-client";

interface LensContextType {
  // Authentication
  isAuthenticated: boolean;
  currentAccount: LensAccount | null;
  availableAccounts: LensAccount[];
  authTokens: LensAuthTokens | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  error: string | null;
  errorType: string | null;

  // Auth actions
  authenticate: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  loadAvailableAccounts: () => Promise<void>;

  // Social actions
  postBreathingSession: (sessionData: BreathingSessionPost) => Promise<string>;
  shareBreathingPattern: (patternData: {
    name: string;
    description: string;
    nftId: string;
    contractAddress: string;
    imageUri?: string;
  }) => Promise<string>;
  commentOnPost: (postId: string, comment: string) => Promise<string>;
  likePost: (postId: string) => Promise<string>;

  // Timeline
  timeline: any[];
  fetchTimeline: (filters?: {
    contentFocus?: string[];
    tags?: string[];
  }) => Promise<void>;

  // Community data
  communityStats: {
    activeUsers: number;
    currentlyBreathing: number;
    sessionsToday: number;
    totalSessions: number;
  };
  trendingPatterns: any[];

  // State management
  clearError: () => void;
  refreshData: () => Promise<void>;
}

const LensContext = createContext<LensContextType | null>(null);

export const LensProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const lens = useLens();

  const contextValue: LensContextType = {
    // Authentication state
    isAuthenticated: lens.isAuthenticated,
    currentAccount: lens.currentAccount,
    availableAccounts: [], // This needs to be implemented properly
    authTokens: lens.authTokens,
    isLoading: lens.isLoading,
    isAuthenticating: false, // From useLens.isAuthenticating
    error: lens.error,
    errorType: lens.errorType,

    // Auth actions
    authenticate: async () => {
      await lens.authenticate();
    },
    logout: lens.logout,
    refreshAuth: lens.refreshAuth,
    loadAvailableAccounts: async () => {}, // This needs to be implemented properly

    // Social actions
    postBreathingSession: async (sessionData) => {
      const result = await lens.shareBreathingSession(sessionData);
      return result.success ? "success" : result.error || "failed";
    },
    shareBreathingPattern: async (patternData) => {
      const result = await lens.shareBreathingPattern(patternData);
      return result.success ? "success" : result.error || "failed";
    },
    commentOnPost: async (postId, comment) => {
      const result = await lens.commentOnPost(postId, comment);
      return result.success ? "success" : result.error || "failed";
    },
    likePost: async (postId) => {
      const result = await lens.likePost(postId);
      return result.success ? "success" : result.error || "failed";
    },

    // Timeline
    timeline: [], // This will be populated when fetchTimeline is called
    fetchTimeline: async (filters) => {
      if (lens.currentAccount?.address) {
        await lens.getTimeline(lens.currentAccount.address);
      }
    },

    // Community data
    communityStats: lens.communityStats,
    trendingPatterns: lens.trendingPatterns,

    // State management
    clearError: lens.clearError,
    refreshData: lens.refreshData,
  };

  return (
    <LensContext.Provider value={contextValue}>{children}</LensContext.Provider>
  );
};

export const useLensContext = (): LensContextType => {
  const context = useContext(LensContext);
  if (!context) {
    throw new Error("useLensContext must be used within a LensProvider");
  }
  return context;
};

export default LensProvider;
