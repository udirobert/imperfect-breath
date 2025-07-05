import React, { createContext, useContext, ReactNode } from 'react';
import { useLens } from '@/hooks/useLens';
import { LensAccount, LensAuthTokens, BreathingSessionPost } from '@/lib/lens/lens-client';

interface LensContextType {
  // Authentication
  isAuthenticated: boolean;
  currentAccount: LensAccount | null;
  availableAccounts: LensAccount[];
  authTokens: LensAuthTokens | null;
  isLoading: boolean;
  error: string | null;

  // Auth actions
  authenticate: (accountAddress: string) => Promise<LensAuthTokens>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<LensAuthTokens>;
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
  quotePost: (postId: string, quoteText: string) => Promise<string>;

  // Timeline
  timeline: any[];
  highlights: any[];
  fetchTimeline: (filters?: { contentFocus?: string[]; tags?: string[] }) => Promise<void>;
  fetchHighlights: () => Promise<void>;
  fetchBreathingContent: () => Promise<void>;

  // State management
  isPosting: boolean;
  isCommenting: boolean;
  clearError: () => void;
}

const LensContext = createContext<LensContextType | null>(null);

export const LensProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const lens = useLens();

  const contextValue: LensContextType = {
    // Authentication state
    isAuthenticated: lens.auth.isAuthenticated,
    currentAccount: lens.auth.currentAccount,
    availableAccounts: lens.auth.availableAccounts,
    authTokens: lens.auth.authTokens,
    isLoading: lens.auth.isLoading,
    error: lens.auth.error || lens.social.error || lens.timeline.error,

    // Auth actions
    authenticate: lens.auth.authenticate,
    logout: lens.auth.logout,
    refreshAuth: lens.auth.refreshAuth,
    loadAvailableAccounts: lens.auth.loadAvailableAccounts,

    // Social actions
    postBreathingSession: lens.social.postBreathingSession,
    shareBreathingPattern: lens.social.shareBreathingPattern,
    commentOnPost: lens.social.commentOnPost,
    quotePost: lens.social.quotePost,

    // Timeline
    timeline: lens.timeline.timeline,
    highlights: lens.timeline.highlights,
    fetchTimeline: lens.timeline.fetchTimeline,
    fetchHighlights: lens.timeline.fetchHighlights,
    fetchBreathingContent: lens.timeline.fetchBreathingContent,

    // State management
    isPosting: lens.social.isPosting,
    isCommenting: lens.social.isCommenting,
    clearError: () => {
      lens.auth.clearError();
      lens.social.clearError();
      lens.timeline.clearError();
    }
  };

  return (
    <LensContext.Provider value={contextValue}>
      {children}
    </LensContext.Provider>
  );
};

export const useLensContext = (): LensContextType => {
  const context = useContext(LensContext);
  if (!context) {
    throw new Error('useLensContext must be used within a LensProvider');
  }
  return context;
};

export default LensProvider;
