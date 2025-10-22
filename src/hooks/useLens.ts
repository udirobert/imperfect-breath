/**
 * useLens Hook - Lens Protocol v3 Implementation
 *
 * ENHANCEMENT FIRST: Uses new BlockchainAuthService for official SDK integration
 * AGGRESSIVE CONSOLIDATION: Consolidates with unified auth service
 * DRY: Single source of truth for blockchain operations
 * MAINTAINS BACKWARD COMPATIBILITY: Preserves existing interface
 */

import { useState, useCallback, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { blockchainAuthService } from "../services/blockchain/BlockchainAuthService";
import { lensAPI } from "../lib/lens";
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

// Remove old lensAPI import and usage

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

  // Authoring state
  authorAddress: string | null;
  setAuthoringAccount: (address: string) => void;

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
    sessionOrContent: BreathingSession | string,
    sessionScore?: number,
    patternName?: string,
  ) => Promise<SocialActionResult>;
  createPost: (content: string, tags?: string[]) => Promise<SocialActionResult>;
  postSession: (
    content: string,
    sessionScore?: number,
    patternName?: string,
  ) => Promise<SocialActionResult>;
  createComment: (
    postId: string,
    content: string,
  ) => Promise<SocialActionResult>;
  likePost: (publicationId: string) => Promise<SocialActionResult>;
  mirrorPost: (publicationId: string) => Promise<SocialActionResult>;
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
  const [authorAddress, setAuthorAddress] = useState<string | null>(null);

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
        // Resume session through the new service
        const result = await blockchainAuthService.resumeSession();
        if (result.success && result.lensSession) {
          setIsAuthenticated(true);
          // For backward compatibility, we'll create an account object from the session
          // In a real scenario, you'd fetch account details from the session
          const storedAuthor = (blockchainAuthService as any).getAuthorAddress?.();
          if (storedAuthor) setAuthorAddress(storedAuthor);
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

        // Use the new service for authentication
        const result = await blockchainAuthService.authenticateLens(
          addressToUse,
          async (message: any) => {
            return await signMessageAsync({
              message,
            });
          },
        );

        if (result.success) {
          // Update state
          setIsAuthenticated(true);
          const storedAuthor = (blockchainAuthService as any).getAuthorAddress?.();
          if (storedAuthor) setAuthorAddress(storedAuthor);
          // In a real implementation, fetch current user from the service
        } else {
          throw new Error(result.error || "Authentication failed");
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
      // Use the new service for logout
      await blockchainAuthService.logout();
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
      const result = await blockchainAuthService.resumeSession();
      if (result.success && result.lensSession) {
        setIsAuthenticated(true);
      }
      return {
        success: !!result.lensSession,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Refresh failed",
      };
    }
  }, []);

  // Share breathing session (enhanced for all use cases)
  const shareBreathingSession = useCallback(
    async (
      sessionOrContent: BreathingSession | string,
      sessionScore?: number,
      patternName?: string,
    ): Promise<SocialActionResult> => {
      if (!isAuthenticated) {
        return { success: false, error: "Not authenticated" };
      }

      setIsPosting(true);
      setActionError(null);

      try {
        const session = blockchainAuthService.getCurrentLensSession();
        if (!session) {
          throw new Error("No active Lens session");
        }

        // Build content from session data
        let content: string;
        let tags: string[] = ['breathing', 'mindfulness', 'wellness'];
        
        if (typeof sessionOrContent === "string") {
          content = sessionOrContent;
        } else {
          const minutes = Math.round(sessionOrContent.duration / 60);
          content = `🌬️ Just completed a ${sessionOrContent.patternName} breathing session!\n\n`;
          content += `⏱️ Duration: ${minutes} minute${minutes !== 1 ? "s" : ""}\n`;
          if (sessionScore) content += `📊 Score: ${sessionScore}/100\n`;
          if (sessionOrContent.cycles) content += `🔄 Cycles: ${sessionOrContent.cycles}\n`;
          content += `\nSharing my progress on my wellness journey 🧘‍♀️`;
          
          // Add pattern-specific tag
          tags.push(sessionOrContent.patternName.toLowerCase().replace(/\s+/g, ''));
        }

        // Create metadata and upload to Grove with fallback
        const { createTextPostMetadata } = await import("@/lib/lens/createLensPostMetadata");
        const { uploadWithFallback } = await import("@/lib/lens/uploadToGrove");
        const metadata = createTextPostMetadata(content, undefined, tags);
        const lensUri = await uploadWithFallback(metadata);
         
         // Create post using Lens SDK with proper metadata
         const { post } = await import("@lens-protocol/client/actions");
         const { uri, evmAddress } = await import("@lens-protocol/client");
         
         const payload: any = { contentUri: uri(lensUri) };
         if (authorAddress) {
           payload.author = evmAddress(authorAddress as `0x${string}`);
         }
         const result = await post(session, payload);

        if (result.isErr()) {
          throw new Error(result.error.message);
        }

        // Show success toast
        const { toast } = await import("sonner");
        toast.success("Shared to Lens!", {
          description: "Your session has been posted to your feed",
        });

        // Refresh timeline to show new post
        await loadTimeline(true);

        return { success: true };
      } catch (error) {
        const { getUserFriendlyError } = await import("@/lib/errors/user-messages");
        const errorMessage = getUserFriendlyError(error instanceof Error ? error : String(error));
        setActionError(errorMessage);
        
        const { toast } = await import("sonner");
        toast.error("Failed to share", {
          description: errorMessage,
        });
        
        return { success: false, error: errorMessage };
      } finally {
        setIsPosting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAuthenticated, authorAddress],
  );

  // Convenience wrapper for mobile sharing
  const postSession = useCallback(
    async (
      content: string,
      sessionScore?: number,
      patternName?: string,
    ): Promise<SocialActionResult> => {
      return shareBreathingSession(content, sessionScore, patternName);
    },
    [shareBreathingSession],
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
        const session = blockchainAuthService.getCurrentLensSession();
        if (!session) {
          throw new Error("No active Lens session");
        }

        // Create metadata and upload to Grove with fallback
        const { createTextPostMetadata } = await import("@/lib/lens/createLensPostMetadata");
        const { uploadWithFallback } = await import("@/lib/lens/uploadToGrove");
        const metadata = createTextPostMetadata(content, undefined, tags || []);
        const lensUri = await uploadWithFallback(metadata);

        // Create post using Lens SDK
        const { post } = await import("@lens-protocol/client/actions");
        const { uri, evmAddress } = await import("@lens-protocol/client");
        
        const payload: any = { contentUri: uri(lensUri) };
        if (authorAddress) {
          payload.author = evmAddress(authorAddress as `0x${string}`);
        }
        const result = await post(session, payload);

        if (result.isErr()) {
          throw new Error(result.error.message);
        }

        const { toast } = await import("sonner");
        toast.success("Post created!", {
          description: "Your post has been shared on Lens",
        });

        // Refresh timeline
        await loadTimeline(true);

        return { success: true };
      } catch (error) {
        const { getUserFriendlyError } = await import("@/lib/errors/user-messages");
        const errorMessage = getUserFriendlyError(error instanceof Error ? error : String(error));
        setActionError(errorMessage);
        
        const { toast } = await import("sonner");
        toast.error("Failed to create post", {
          description: errorMessage,
        });
        
        return { success: false, error: errorMessage };
      } finally {
        setIsPosting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAuthenticated, authorAddress],
  );

  // Create comment on a post
  const createComment = useCallback(
    async (postId: string, content: string): Promise<SocialActionResult> => {
      if (!isAuthenticated) {
        return { success: false, error: "Not authenticated" };
      }

      setIsPosting(true);
      setActionError(null);

      try {
        const result = await lensAPI.commentOn(postId, content);
        if (!result.success) {
          throw new Error(result.error || "Failed to add comment");
        }

        const { toast } = await import("sonner");
        toast.success("Comment added!", {
          description: "Your comment has been posted",
        });

        return { success: true };
      } catch (error) {
        const { getUserFriendlyError } = await import("@/lib/errors/user-messages");
        const errorMessage = getUserFriendlyError(error instanceof Error ? error : String(error));
        setActionError(errorMessage);
        
        const { toast } = await import("sonner");
        toast.error("Failed to add comment", {
          description: errorMessage,
        });
        
        return { success: false, error: errorMessage };
      } finally {
        setIsPosting(false);
      }
    },
    [isAuthenticated, authorAddress],
  );

  // Like a publication
  const likePost = useCallback(
    async (publicationId: string): Promise<SocialActionResult> => {
      if (!isAuthenticated) {
        return { success: false, error: "Not authenticated" };
      }
      try {
        const result = await lensAPI.likePost(publicationId);
        if (!result.success) {
          throw new Error(result.error || "Failed to like");
        }
        const { toast } = await import("sonner");
        toast.success("Liked", { description: "You liked this post" });
        return { success: true };
      } catch (error) {
        const { getUserFriendlyError } = await import("@/lib/errors/user-messages");
        const errorMessage = getUserFriendlyError(error instanceof Error ? error : String(error));
        const { toast } = await import("sonner");
        toast.error("Failed to like", { description: errorMessage });
        return { success: false, error: errorMessage };
      }
    },
    [isAuthenticated],
  );

  // Mirror (repost) a publication
  const mirrorPost = useCallback(
    async (publicationId: string): Promise<SocialActionResult> => {
      if (!isAuthenticated) {
        return { success: false, error: "Not authenticated" };
      }
      try {
        const result = await lensAPI.mirrorPost(publicationId);
        if (!result.success) {
          throw new Error(result.error || "Failed to mirror");
        }
        const { toast } = await import("sonner");
        toast.success("Reposted", { description: "You mirrored this post" });
        return { success: true };
      } catch (error) {
        const { getUserFriendlyError } = await import("@/lib/errors/user-messages");
        const errorMessage = getUserFriendlyError(error instanceof Error ? error : String(error));
        const { toast } = await import("sonner");
        toast.error("Failed to mirror", { description: errorMessage });
        return { success: false, error: errorMessage };
      }
    },
    [isAuthenticated],
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
        if (!result.success) {
          throw new Error(result.error || "Failed to follow user");
        }

        const { toast } = await import("sonner");
        toast.success("Following user", {
          description: `You are now following ${userAddress.slice(0, 8)}...`,
        });

        return { success: true };
      } catch (error) {
        const { getUserFriendlyError } = await import("@/lib/errors/user-messages");
        const errorMessage = getUserFriendlyError(error instanceof Error ? error : String(error));
        setActionError(errorMessage);
        
        const { toast } = await import("sonner");
        toast.error("Failed to follow", {
          description: errorMessage,
        });
        
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
        if (!result.success) {
          throw new Error(result.error || "Failed to unfollow user");
        }

        const { toast } = await import("sonner");
        toast.success("Unfollowed user", {
          description: `You unfollowed ${userAddress.slice(0, 8)}...`,
        });

        return { success: true };
      } catch (error) {
        const { getUserFriendlyError } = await import("@/lib/errors/user-messages");
        const errorMessage = getUserFriendlyError(error instanceof Error ? error : String(error));
        setActionError(errorMessage);
        
        const { toast } = await import("sonner");
        toast.error("Failed to unfollow", {
          description: errorMessage,
        });
        
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
        // Use local Lens client wrapper for timeline
        const response = await lensAPI.getTimeline(refresh ? undefined : timelineCursor);
        if (!response.success || !response.data) {
          throw new Error(response.error || "Failed to load timeline");
        }

        const { items, pageInfo } = response.data;
        // Items are FeedPost; strip feedReason to get Post
        const posts: Post[] = items.map((item) => {
          const { feedReason, ...rest } = item as any;
          return rest as Post;
        });

        if (refresh) {
          setTimeline(posts);
        } else {
          setTimeline((prev) => [...prev, ...posts]);
        }

        setHasMorePosts(Boolean(pageInfo?.next));
        setTimelineCursor(pageInfo?.next);
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
        const session = blockchainAuthService.getCurrentLensSession();
        if (!session) {
          throw new Error("No active Lens session");
        }

        // Use local Lens client to fetch account
        const result = await lensAPI.getAccount(userAddress);
        if (!result.success || !result.data) {
          throw new Error(result.error || "Failed to fetch account");
        }

        return result.data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load user profile";
        setTimelineError(errorMessage);
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

    // Authoring state
    authorAddress,
    setAuthoringAccount: (addr: string) => {
      setAuthorAddress(addr);
      (blockchainAuthService as any).setAuthorAddress?.(addr);
    },

    // Community data
    communityStats,
    activeUsers,
    challenges,

    // User data
    achievements,
    preferences,

    // Content actions
    authenticate,
    logout,
    refreshAuth,
    shareBreathingSession,
    createPost,
    postSession,
    createComment,
    likePost,
    mirrorPost,
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
    loadAchievements,
    updatePreferences,
    joinChallenge,
  };
};
