/**
 * useLens Hook - Lens Protocol v3 Implementation
 *
 * Complete rewrite for Lens Protocol v3 using the new client architecture
 * - Uses PublicClient and SessionClient patterns
 * - Proper error handling with Result pattern
 * - Clean state management with React hooks
 * - Type-safe operations throughout
 */

import { useState, useCallback, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { lensAPI } from "../lib/lens/client";
import type {
  Account,
  Post,
  BreathingSession,
  SocialActionResult,
  CommunityStats,
  TrendingPattern,
  BreathingChallenge,
  Achievement,
  UserPreferences,
  Timeline,
} from "../lib/lens/types";

// Hook return interface
export interface UseLensReturn {
  // Authentication state
  isAuthenticated: boolean;
  currentAccount: Account | null;
  isAuthenticating: boolean;
  authError: string | null;

  // Timeline state
  timeline: Post[];
  isLoadingTimeline: boolean;
  timelineError: string | null;
  hasMorePosts: boolean;

  // Highlights and explore
  highlights: Post[];
  isLoadingHighlights: boolean;
  trendingPatterns: TrendingPattern[];

  // Action states
  isPosting: boolean;
  isFollowing: boolean;
  actionError: string | null;

  // Community data
  communityStats: CommunityStats;
  activeUsers: Account[];
  challenges: BreathingChallenge[];

  // User data
  achievements: Achievement[];
  preferences: UserPreferences;

  // Core actions
  authenticate: (address?: string) => Promise<SocialActionResult>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<SocialActionResult>;

  // Content actions
  shareBreathingSession: (
    session: BreathingSession,
  ) => Promise<SocialActionResult>;
  createPost: (content: string, tags?: string[]) => Promise<SocialActionResult>;
  createComment: (
    postId: string,
    content: string,
  ) => Promise<SocialActionResult>;
  followUser: (address: string) => Promise<SocialActionResult>;
  unfollowUser: (address: string) => Promise<SocialActionResult>;

  // Data fetching
  loadTimeline: (refresh?: boolean) => Promise<void>;
  loadMorePosts: () => Promise<void>;
  loadHighlights: () => Promise<void>;
  loadUserProfile: (address: string) => Promise<Account | null>;
  explorePosts: (orderBy?: "latest" | "topRated") => Promise<Post[]>;

  // Community features
  loadCommunityStats: () => Promise<void>;
  loadChallenges: () => Promise<void>;
  joinChallenge: (challengeId: string) => Promise<SocialActionResult>;

  // User management
  loadAchievements: () => Promise<void>;
  updatePreferences: (
    prefs: Partial<UserPreferences>,
  ) => Promise<SocialActionResult>;
}

export const useLens = (): UseLensReturn => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Timeline state
  const [timeline, setTimeline] = useState<Post[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [timelineCursor, setTimelineCursor] = useState<string | undefined>();

  // Highlights and explore
  const [highlights, setHighlights] = useState<Post[]>([]);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(false);
  const [trendingPatterns, setTrendingPatterns] = useState<TrendingPattern[]>(
    [],
  );

  // Action states
  const [isPosting, setIsPosting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Community state
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    activeUsers: 0,
    currentlyBreathing: 0,
    sessionsToday: 0,
    totalSessions: 0,
  });
  const [activeUsers, setActiveUsers] = useState<Account[]>([]);
  const [challenges, setChallenges] = useState<BreathingChallenge[]>([]);

  // User state
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    defaultPattern: "box-breathing",
    sessionReminders: true,
    shareByDefault: false,
    privacyLevel: "public",
    notificationSettings: {
      challenges: true,
      achievements: true,
      social: true,
    },
  });

  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Initialize session on mount
  useEffect(() => {
    const init = async () => {
      try {
        const result = await lensAPI.resumeSession();
        if (result.success) {
          setIsAuthenticated(true);
          const user = lensAPI.getCurrentUser();
          if (user) {
            setCurrentAccount(user);
          }
        }
      } catch (error) {
        console.error("Failed to initialize session:", error);
      }
    };
    init();
  }, []);

  // Authentication
  const authenticate = useCallback(
    async (userAddress?: string): Promise<SocialActionResult> => {
      const addressToUse = userAddress || address;
      if (!addressToUse || !signMessageAsync) {
        return { success: false, error: "No wallet connected" };
      }

      setIsAuthenticating(true);
      setAuthError(null);

      try {
        console.log("Starting Lens v3 authentication for:", addressToUse);

        const result = await lensAPI.login(
          addressToUse,
          async (message: string) => {
            return await signMessageAsync({
              message,
              account: addressToUse as `0x${string}`,
            });
          },
        );

        if (!result.success) {
          throw new Error(result.error || "Authentication failed");
        }

        // Update state
        setIsAuthenticated(true);
        const user = lensAPI.getCurrentUser();
        if (user) {
          setCurrentAccount(user);
        }

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
    [address, signMessageAsync],
  );

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      await lensAPI.logout();
      setIsAuthenticated(false);
      setCurrentAccount(null);
      setTimeline([]);
      setHighlights([]);
      setAuthError(null);
      setActionError(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);

  // Refresh authentication
  const refreshAuth = useCallback(async (): Promise<SocialActionResult> => {
    try {
      const result = await lensAPI.resumeSession();
      if (result.success) {
        setIsAuthenticated(true);
        const user = lensAPI.getCurrentUser();
        if (user) {
          setCurrentAccount(user);
        }
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Refresh failed",
      };
    }
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
        const result = await lensAPI.shareBreathingSession(session);

        if (result.success) {
          // Refresh timeline to show new post
          await loadTimeline(true);
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to share session";
        setActionError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsPosting(false);
      }
    },
    [isAuthenticated],
  );

  // Create general post
  const createPost = useCallback(
    async (content: string, tags?: string[]): Promise<SocialActionResult> => {
      if (!isAuthenticated) {
        return { success: false, error: "Not authenticated" };
      }

      setIsPosting(true);
      setActionError(null);

      try {
        // Create simple metadata
        const metadata = {
          content,
          tags: tags || [],
          locale: "en",
        };

        const contentUri = `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`;

        const result = await lensAPI.createPost(contentUri);

        if (result.success) {
          // Refresh timeline
          await loadTimeline(true);
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create post";
        setActionError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsPosting(false);
      }
    },
    [isAuthenticated],
  );

  // Create comment (simplified for now)
  const createComment = useCallback(
    async (postId: string, content: string): Promise<SocialActionResult> => {
      if (!isAuthenticated) {
        return { success: false, error: "Not authenticated" };
      }

      // For now, we'll treat comments as regular posts mentioning the original
      // This would need to be enhanced with proper commenting functionality
      return createPost(`Commenting on ${postId}: ${content}`);
    },
    [isAuthenticated, createPost],
  );

  // Follow user
  const followUser = useCallback(
    async (userAddress: string): Promise<SocialActionResult> => {
      if (!isAuthenticated) {
        return { success: false, error: "Not authenticated" };
      }

      setIsFollowing(true);
      setActionError(null);

      try {
        const result = await lensAPI.followAccount(userAddress);
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to follow user";
        setActionError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsFollowing(false);
      }
    },
    [isAuthenticated],
  );

  // Unfollow user
  const unfollowUser = useCallback(
    async (userAddress: string): Promise<SocialActionResult> => {
      if (!isAuthenticated) {
        return { success: false, error: "Not authenticated" };
      }

      setIsFollowing(true);
      setActionError(null);

      try {
        const result = await lensAPI.unfollowAccount(userAddress);
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to unfollow user";
        setActionError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsFollowing(false);
      }
    },
    [isAuthenticated],
  );

  // Load timeline
  const loadTimeline = useCallback(
    async (refresh?: boolean): Promise<void> => {
      if (!isAuthenticated) {
        setTimelineError("Not authenticated");
        return;
      }

      setIsLoadingTimeline(true);
      if (refresh) {
        setTimelineError(null);
        setTimelineCursor(undefined);
      }

      try {
        const cursor = refresh ? undefined : timelineCursor;
        const result = await lensAPI.getTimeline(cursor);

        if (!result.success) {
          throw new Error(result.error || "Failed to load timeline");
        }

        if (result.data) {
          const posts = result.data.items;
          if (refresh) {
            setTimeline(posts);
          } else {
            setTimeline((prev) => [...prev, ...posts]);
          }
          setHasMorePosts(result.data.pageInfo.hasMore);
          setTimelineCursor(result.data.pageInfo.next);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load timeline";
        setTimelineError(errorMessage);
      } finally {
        setIsLoadingTimeline(false);
      }
    },
    [isAuthenticated, timelineCursor],
  );

  // Load more posts
  const loadMorePosts = useCallback(async (): Promise<void> => {
    if (!hasMorePosts || isLoadingTimeline) return;
    await loadTimeline(false);
  }, [hasMorePosts, isLoadingTimeline, loadTimeline]);

  // Load highlights (mock implementation)
  const loadHighlights = useCallback(async (): Promise<void> => {
    setIsLoadingHighlights(true);
    try {
      // For now, use the same timeline data
      // This would be replaced with actual highlights/trending content
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setHighlights(timeline.slice(0, 5));
    } catch (error) {
      console.error("Failed to load highlights:", error);
    } finally {
      setIsLoadingHighlights(false);
    }
  }, [timeline]);

  // Load user profile
  const loadUserProfile = useCallback(
    async (userAddress: string): Promise<Account | null> => {
      try {
        const result = await lensAPI.getAccount(userAddress);
        return result.success && result.data ? result.data : null;
      } catch (error) {
        console.error("Failed to load user profile:", error);
        return null;
      }
    },
    [],
  );

  // Explore posts (mock implementation)
  const explorePosts = useCallback(
    async (orderBy: "latest" | "topRated" = "latest"): Promise<Post[]> => {
      try {
        // For now, return timeline data
        // This would be replaced with actual explore/discovery functionality
        await new Promise((resolve) => setTimeout(resolve, 500));
        return timeline;
      } catch (error) {
        console.error("Failed to explore posts:", error);
        return [];
      }
    },
    [timeline],
  );

  // Load community stats (mock implementation)
  const loadCommunityStats = useCallback(async (): Promise<void> => {
    try {
      // Mock data - replace with actual API calls
      setCommunityStats({
        activeUsers: Math.floor(Math.random() * 200) + 50,
        currentlyBreathing: Math.floor(Math.random() * 20) + 5,
        sessionsToday: Math.floor(Math.random() * 500) + 100,
        totalSessions: Math.floor(Math.random() * 10000) + 5000,
      });
    } catch (error) {
      console.error("Failed to load community stats:", error);
    }
  }, []);

  // Load challenges (mock implementation)
  const loadChallenges = useCallback(async (): Promise<void> => {
    try {
      // Mock data - replace with actual API calls
      const mockChallenges: BreathingChallenge[] = [
        {
          id: "challenge-1",
          name: "30-Day Breathing Reset",
          description: "Complete 30 days of mindful breathing practice",
          hashtag: "#30DayBreathingReset",
          duration: "30 days",
          participants: 127,
          reward: "Exclusive NFT Pattern",
          isActive: true,
          endsAt: "2024-12-31",
          createdAt: "2024-11-01",
        },
      ];
      setChallenges(mockChallenges);
    } catch (error) {
      console.error("Failed to load challenges:", error);
    }
  }, []);

  // Join challenge (mock implementation)
  const joinChallenge = useCallback(
    async (challengeId: string): Promise<SocialActionResult> => {
      if (!isAuthenticated) {
        return { success: false, error: "Not authenticated" };
      }

      try {
        // Mock implementation
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to join challenge",
        };
      }
    },
    [isAuthenticated],
  );

  // Load achievements (mock implementation)
  const loadAchievements = useCallback(async (): Promise<void> => {
    try {
      // Mock data
      const mockAchievements: Achievement[] = [
        {
          id: "first-session",
          name: "First Breath",
          description: "Complete your first breathing session",
          icon: "🌱",
          category: "sessions",
          requirement: { type: "sessions_completed", value: 1 },
          unlockedAt: "2024-01-01",
          progress: 1,
          maxProgress: 1,
        },
      ];
      setAchievements(mockAchievements);
    } catch (error) {
      console.error("Failed to load achievements:", error);
    }
  }, []);

  // Update preferences (mock implementation)
  const updatePreferences = useCallback(
    async (prefs: Partial<UserPreferences>): Promise<SocialActionResult> => {
      try {
        setPreferences((prev) => ({ ...prev, ...prefs }));
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to update preferences",
        };
      }
    },
    [],
  );

  return {
    // Authentication state
    isAuthenticated,
    currentAccount,
    isAuthenticating,
    authError,

    // Timeline state
    timeline,
    isLoadingTimeline,
    timelineError,
    hasMorePosts,

    // Highlights and explore
    highlights,
    isLoadingHighlights,
    trendingPatterns,

    // Action states
    isPosting,
    isFollowing,
    actionError,

    // Community data
    communityStats,
    activeUsers,
    challenges,

    // User data
    achievements,
    preferences,

    // Core actions
    authenticate,
    logout,
    refreshAuth,

    // Content actions
    shareBreathingSession,
    createPost,
    createComment,
    followUser,
    unfollowUser,

    // Data fetching
    loadTimeline,
    loadMorePosts,
    loadHighlights,
    loadUserProfile,
    explorePosts,

    // Community features
    loadCommunityStats,
    loadChallenges,
    joinChallenge,

    // User management
    loadAchievements,
    updatePreferences,
  };
};
