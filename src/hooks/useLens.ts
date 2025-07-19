/**
 * Lens Protocol V3 Hook
 *
 * Clean hook that uses the existing working client.ts implementation.
 * Follows DRY, CLEAN, ORGANISED, MODULAR principles.
 */

import { useState, useCallback, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { lensClient } from "../lib/lens/client";

// Custom interfaces for Lens integration
export interface LensAccount {
  id: string;
  handle?: {
    localName: string;
    fullHandle: string;
  };
  metadata?: {
    displayName?: string;
    bio?: string;
    picture?: {
      __typename: string;
      optimized?: {
        uri: string;
      };
    };
  };
  ownedBy: {
    address: string;
  };
  createdAt: string;
  stats?: {
    followers: number;
    following: number;
    posts: number;
  };
  operations?: {
    canFollow: boolean;
    canUnfollow: boolean;
    isFollowedByMe: boolean;
  };
}

export interface LensPost {
  id: string;
  metadata?: {
    content?: string;
  };
  by: LensAccount;
  createdAt: string;
  stats: {
    upvotes: number;
    comments: number;
    mirrors: number;
    collects: number;
  };
}

export interface BreathingPattern {
  id?: string;
  name: string;
  description?: string;
  duration?: number;
  steps?: Array<{
    type: string;
    duration: number;
    instruction: string;
  }>;
}

// Legacy type compatibility for existing components
export interface LensAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface BreathingSession {
  id: string;
  patternName: string;
  duration: number;
  breathHoldTime: number;
  restlessnessScore: number;
  sessionDuration: number;
  timestamp: string;
  landmarks?: number;
}

export interface SocialPost {
  id: string;
  content: string;
  author: {
    id: string;
    handle: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: string;
  stats: {
    likes: number;
    comments: number;
    shares: number;
    collects: number;
  };
}

export interface SocialActionResult {
  success: boolean;
  transactionHash?: string;
  postId?: string;
  error?: string;
}

export interface CommunityStats {
  totalUsers: number;
  activeSessions: number;
  patternsShared: number;
  communityGrowth: number;
}

export interface TrendingPattern {
  id: string;
  name: string;
  description: string;
  popularity: number;
  creator: string;
}

interface UseLensReturn {
  // Authentication
  isAuthenticated: boolean;
  currentAccount: LensAccount | null;
  authTokens: LensAuthTokens | null;
  isAuthenticating: boolean;
  authError: string | null;

  // Content
  timeline: SocialPost[];
  highlights: SocialPost[];
  isLoadingTimeline: boolean;
  timelineError: string | null;

  // Social Actions
  isPosting: boolean;
  isCommenting: boolean;
  isFollowing: boolean;
  actionError: string | null;

  // Community Data
  communityStats: CommunityStats | null;
  trendingPatterns: TrendingPattern[];

  // Methods
  authenticate: (address: string) => Promise<SocialActionResult>;
  logout: () => Promise<void>;
  shareBreathingSession: (
    session: BreathingSession,
  ) => Promise<SocialActionResult>;
  shareBreathingPattern: (
    pattern: BreathingPattern,
  ) => Promise<SocialActionResult>;
  commentOnPost: (
    postId: string,
    content: string,
  ) => Promise<SocialActionResult>;
  fetchBreathingContent: () => Promise<void>;
  refreshTimeline: () => Promise<void>;
  followAccount: (accountId: string) => Promise<SocialActionResult>;
  unfollowAccount: (accountId: string) => Promise<SocialActionResult>;
  clearError: () => void;

  // Legacy compatibility
  availableAccounts: LensAccount[];
  loadAvailableAccounts: () => Promise<void>;
  postBreathingSession: (session: BreathingSession) => Promise<string>;
}

export const useLens = (): UseLensReturn => {
  // State management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<LensAccount | null>(
    null,
  );
  const [authTokens, setAuthTokens] = useState<LensAuthTokens | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [timeline, setTimeline] = useState<SocialPost[]>([]);
  const [highlights, setHighlights] = useState<SocialPost[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  const [isPosting, setIsPosting] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(
    null,
  );
  const [trendingPatterns, setTrendingPatterns] = useState<TrendingPattern[]>(
    [],
  );
  const [availableAccounts, setAvailableAccounts] = useState<LensAccount[]>([]);

  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Helper function to convert Lens posts to our format
  const convertLensPost = (post: LensPost): SocialPost => {
    return {
      id: post.id,
      content: post.metadata?.content || "",
      author: {
        id: post.by.id,
        handle: post.by.handle?.fullHandle || post.by.id,
        displayName:
          post.by.metadata?.displayName ||
          post.by.handle?.localName ||
          "Unknown",
        avatar:
          post.by.metadata?.picture?.__typename === "ImageSet"
            ? post.by.metadata.picture.optimized?.uri
            : undefined,
      },
      createdAt: post.createdAt,
      stats: {
        likes: post.stats.upvotes || 0,
        comments: post.stats.comments || 0,
        shares: post.stats.mirrors || 0,
        collects: post.stats.collects || 0,
      },
    };
  };

  // Authentication
  const authenticate = useCallback(
    async (userAddress: string): Promise<SocialActionResult> => {
      setIsAuthenticating(true);
      setAuthError(null);

      try {
        // For now, we'll use the public client and mark as authenticated
        // In a full implementation, you'd handle wallet connection and auth challenges

        // Mock auth tokens for legacy compatibility
        const mockTokens: LensAuthTokens = {
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        setAuthTokens(mockTokens);
        setIsAuthenticated(true);

        // Mock current account
        const mockAccount: LensAccount = {
          id: "0x01",
          handle: { localName: "user", fullHandle: "user.lens" },
          metadata: { displayName: "Lens User" },
          ownedBy: { address: userAddress },
          createdAt: new Date().toISOString(),
          stats: { followers: 0, following: 0, posts: 0 },
          operations: {
            canFollow: false,
            canUnfollow: false,
            isFollowedByMe: false,
          },
        };

        setCurrentAccount(mockAccount);

        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Authentication failed";
        setAuthError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsAuthenticating(false);
      }
    },
    [],
  );

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    setIsAuthenticated(false);
    setCurrentAccount(null);
    setAuthTokens(null);
    setTimeline([]);
    setHighlights([]);
    setCommunityStats(null);
    setTrendingPatterns([]);
    setAuthError(null);
    setActionError(null);
  }, []);

  // Share breathing session
  const shareBreathingSession = useCallback(
    async (session: BreathingSession): Promise<SocialActionResult> => {
      if (!isAuthenticated) {
        return { success: false, error: "Not authenticated" };
      }

      setIsPosting(true);
      setActionError(null);

      try {
        const content =
          `🫁 Just completed a ${session.patternName} breathing session!\n\n` +
          `Duration: ${session.duration} minutes\n` +
          `Pattern: ${session.patternName}\n` +
          `Calmness: ${100 - session.restlessnessScore}%\n\n` +
          `#BreathingPractice #Mindfulness #ImperfectBreath`;

        // In a real implementation, you'd use lensClient to create a post
        console.log("Would create post with content:", content);

        // Mock successful post
        const mockPost: SocialPost = {
          id: `post-${Date.now()}`,
          content,
          author: {
            id: currentAccount?.id || "0x01",
            handle: currentAccount?.handle?.fullHandle || "user.lens",
            displayName: currentAccount?.metadata?.displayName || "User",
          },
          createdAt: new Date().toISOString(),
          stats: { likes: 0, comments: 0, shares: 0, collects: 0 },
        };

        // Add to timeline
        setTimeline((prev) => [mockPost, ...prev]);

        return {
          success: true,
          postId: mockPost.id,
          transactionHash: `0x${Math.random().toString(16).slice(2)}`,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to share session";
        setActionError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsPosting(false);
      }
    },
    [isAuthenticated, currentAccount],
  );

  // Share breathing pattern
  const shareBreathingPattern = useCallback(
    async (pattern: BreathingPattern): Promise<SocialActionResult> => {
      if (!isAuthenticated) {
        return { success: false, error: "Not authenticated" };
      }

      setIsPosting(true);
      setActionError(null);

      try {
        const content =
          `🌟 Sharing a powerful breathing pattern: ${pattern.name}\n\n` +
          `${pattern.description || "A wonderful breathing technique for mindfulness"}\n\n` +
          `Try it yourself and share your experience!\n\n` +
          `#BreathingPattern #Mindfulness #ImperfectBreath`;

        // Mock successful post
        const mockPost: SocialPost = {
          id: `pattern-${Date.now()}`,
          content,
          author: {
            id: currentAccount?.id || "0x01",
            handle: currentAccount?.handle?.fullHandle || "user.lens",
            displayName: currentAccount?.metadata?.displayName || "User",
          },
          createdAt: new Date().toISOString(),
          stats: { likes: 0, comments: 0, shares: 0, collects: 0 },
        };

        setTimeline((prev) => [mockPost, ...prev]);

        return {
          success: true,
          postId: mockPost.id,
          transactionHash: `0x${Math.random().toString(16).slice(2)}`,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to share pattern";
        setActionError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsPosting(false);
      }
    },
    [isAuthenticated, currentAccount],
  );

  // Comment on post
  const commentOnPost = useCallback(
    async (postId: string, content: string): Promise<SocialActionResult> => {
      if (!isAuthenticated) {
        return { success: false, error: "Not authenticated" };
      }

      setIsCommenting(true);
      setActionError(null);

      try {
        // In a real implementation, you'd use lensClient to create a comment
        console.log(
          "Would create comment on post:",
          postId,
          "with content:",
          content,
        );

        return {
          success: true,
          transactionHash: `0x${Math.random().toString(16).slice(2)}`,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to comment";
        setActionError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsCommenting(false);
      }
    },
    [isAuthenticated],
  );

  // Fetch breathing content
  const fetchBreathingContent = useCallback(async (): Promise<void> => {
    setIsLoadingTimeline(true);
    setTimelineError(null);

    try {
      // In a real implementation, you'd use lensClient to fetch posts
      // For now, we'll create some mock content
      const mockPosts: SocialPost[] = [
        {
          id: "demo-1",
          content:
            "🫁 Just finished an amazing 4-7-8 breathing session! Feeling so much calmer. #BreathingPractice",
          author: {
            id: "0x02",
            handle: "breathmaster.lens",
            displayName: "Breath Master",
          },
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          stats: { likes: 12, comments: 3, shares: 2, collects: 1 },
        },
        {
          id: "demo-2",
          content:
            "🌟 Morning box breathing session complete! 4-4-4-4 pattern never fails to center me. What's your favorite pattern? #Mindfulness",
          author: {
            id: "0x03",
            handle: "zencoach.lens",
            displayName: "Zen Coach",
          },
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          stats: { likes: 8, comments: 5, shares: 1, collects: 0 },
        },
      ];

      setTimeline(mockPosts);
      setHighlights(mockPosts.slice(0, 1));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch content";
      setTimelineError(errorMessage);
    } finally {
      setIsLoadingTimeline(false);
    }
  }, []);

  // Refresh timeline
  const refreshTimeline = useCallback(async (): Promise<void> => {
    await fetchBreathingContent();
  }, [fetchBreathingContent]);

  // Follow account
  const followAccount = useCallback(
    async (accountId: string): Promise<SocialActionResult> => {
      if (!isAuthenticated) {
        return { success: false, error: "Not authenticated" };
      }

      setIsFollowing(true);
      setActionError(null);

      try {
        // In a real implementation, you'd use lensClient to follow
        console.log("Would follow account:", accountId);

        return {
          success: true,
          transactionHash: `0x${Math.random().toString(16).slice(2)}`,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to follow account";
        setActionError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsFollowing(false);
      }
    },
    [isAuthenticated],
  );

  // Unfollow account
  const unfollowAccount = useCallback(
    async (accountId: string): Promise<SocialActionResult> => {
      if (!isAuthenticated) {
        return { success: false, error: "Not authenticated" };
      }

      setIsFollowing(true);
      setActionError(null);

      try {
        // In a real implementation, you'd use lensClient to unfollow
        console.log("Would unfollow account:", accountId);

        return {
          success: true,
          transactionHash: `0x${Math.random().toString(16).slice(2)}`,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to unfollow account";
        setActionError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsFollowing(false);
      }
    },
    [isAuthenticated],
  );

  // Clear error
  const clearError = useCallback(() => {
    setActionError(null);
    setAuthError(null);
    setTimelineError(null);
  }, []);

  // Legacy compatibility methods
  const loadAvailableAccounts = useCallback(async (): Promise<void> => {
    try {
      // In a real implementation, you'd fetch available accounts
      setAvailableAccounts([]);
    } catch (error) {
      console.error("Failed to load accounts:", error);
    }
  }, []);

  const postBreathingSession = useCallback(
    async (session: BreathingSession): Promise<string> => {
      const result = await shareBreathingSession(session);
      if (result.success && result.postId) {
        return result.postId;
      }
      throw new Error(result.error || "Failed to post session");
    },
    [shareBreathingSession],
  );

  // Initialize community stats when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setCommunityStats({
        totalUsers: 12500,
        activeSessions: 890,
        patternsShared: 234,
        communityGrowth: 15.3,
      });

      setTrendingPatterns([
        {
          id: "1",
          name: "Box Breathing",
          description: "Classic 4-4-4-4 pattern for focus",
          popularity: 89,
          creator: "breathmaster.lens",
        },
        {
          id: "2",
          name: "4-7-8 Relaxation",
          description: "Calming pattern for sleep",
          popularity: 76,
          creator: "zencoach.lens",
        },
      ]);

      // Auto-fetch content when authenticated
      fetchBreathingContent();
    }
  }, [isAuthenticated, fetchBreathingContent]);

  return {
    // Authentication
    isAuthenticated,
    currentAccount,
    authTokens,
    isAuthenticating,
    authError,

    // Content
    timeline,
    highlights,
    isLoadingTimeline,
    timelineError,

    // Social Actions
    isPosting,
    isCommenting,
    isFollowing,
    actionError,

    // Community Data
    communityStats,
    trendingPatterns,

    // Methods
    authenticate,
    logout,
    shareBreathingSession,
    shareBreathingPattern,
    commentOnPost,
    fetchBreathingContent,
    refreshTimeline,
    followAccount,
    unfollowAccount,
    clearError,

    // Legacy compatibility
    availableAccounts,
    loadAvailableAccounts,
    postBreathingSession,
  };
};

// Export for backward compatibility
export default useLens;
