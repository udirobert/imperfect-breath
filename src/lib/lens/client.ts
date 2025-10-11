/**
 * Lens Protocol v3 Client Implementation (Simplified)
 *
 * Simplified implementation that maintains the v3 architecture
 * while using mock data until the full SDK integration is complete
 * - Proper TypeScript typing
 * - Clean error handling
 * - Session management
 * - Ready for real v3 SDK integration
 */

import type {
  Account,
  Post,
  BreathingSession,
  SocialActionResult,
  LensAuthTokens,
  Timeline,
} from "./types";

// Lens v3 Content Curation Strategy
const WELLNESS_KEYWORDS = [
  "breathing",
  "breathwork",
  "meditation",
  "mindfulness",
  "wellness",
  "pranayama",
  "breath hold",
  "wim hof",
  "box breathing",
  "4-7-8",
  "coherent breathing",
  "yoga",
  "zen",
  "calm",
  "relaxation",
  "stress relief",
  "anxiety relief",
  "focus",
  "concentration",
  "peace",
  "tranquil",
  "self-care",
  "mental health",
  "healing",
  "therapeutic",
  "holistic",
];

const BREATHING_PATTERNS = [
  "box-breathing",
  "478-breathing",
  "wim-hof",
  "coherent-breathing",
  "triangle-breathing",
  "alternate-nostril",
  "belly-breathing",
  "tactical-breathing",
  "resonant-breathing",
  "breath-retention",
];

// Our app identifier for content filtering
const IMPERFECT_BREATH_APP_ID = "imperfect-breath";
const LENS_WELLNESS_GROUP_ID = "wellness-breathwork-community";
const LENS_MINDFULNESS_FEED_ID = "mindfulness-feed";

// Content curation configuration
const CONTENT_CURATION_CONFIG = {
  // Primary: Content from our app
  ownAppContent: {
    appId: IMPERFECT_BREATH_APP_ID,
    weight: 1.0, // Highest priority
  },

  // Secondary: Wellness-focused Groups and Feeds
  wellnessGroups: [
    LENS_WELLNESS_GROUP_ID,
    "breathwork-practitioners",
    "meditation-daily",
    "mindfulness-community",
    "wellness-journey",
  ],

  // Curated feeds for wellness content
  wellnessFeeds: [
    LENS_MINDFULNESS_FEED_ID,
    "daily-wellness",
    "breathwork-feed",
    "meditation-insights",
  ],

  // Keyword-based filtering
  keywords: {
    include: WELLNESS_KEYWORDS,
    exclude: ["crypto", "trading", "financial", "politics", "controversial"],
  },

  // Quality filters
  qualityThresholds: {
    minReactions: 2, // Minimum engagement
    minContentLength: 50, // Avoid spam
    maxContentLength: 2000, // Avoid excessive posts
  },
};

/**
 * Simplified Lens v3 API Client
 */
export class LensV3API {
  private isAuthenticated = false;
  private currentUser: Account | null = null;
  private sessionData: {
    address: string;
    signature: string;
    authenticatedAt: number;
    expiresAt: number;
  } | null = null;

  /**
   * Login to Lens Protocol with wallet
   */
  async login(
    walletAddress: string,
    signMessage: (message: string) => Promise<string>,
  ): Promise<SocialActionResult> {
    try {
      console.log("🌿 Starting Lens v3 login for:", walletAddress);

      // Simulate challenge-response flow
      const challengeMessage = `Welcome to Imperfect Breath!\n\nSign this message to authenticate with Lens Protocol.\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;

      // Get signature
      const signature = await signMessage(challengeMessage);

      if (!signature) {
        throw new Error("Signature required for authentication");
      }

      // Authenticate with signature
      this.isAuthenticated = true;
      
      // Store session data
      this.sessionData = {
        address: walletAddress,
        signature,
        authenticatedAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };

      // Create user account from wallet address
      this.currentUser = {
        id: walletAddress,
        address: walletAddress,
        username: {
          localName: `user${walletAddress.slice(-4)}`,
          fullHandle: `user${walletAddress.slice(-4)}.lens`,
          ownedBy: walletAddress,
        },
        ownedBy: { address: walletAddress },
        metadata: {
          name: "Lens User",
          bio: "Welcome to the breathing community!",
        },
        stats: {
          posts: 0,
          followers: 0,
          following: 0,
        },
        timestamp: new Date().toISOString(),
      };

      // Store session data
      this.sessionData = {
        address: walletAddress,
        signature,
        authenticatedAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };

      // Store in localStorage for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("lens-session", JSON.stringify(this.sessionData));
        localStorage.setItem("lens-user", JSON.stringify(this.currentUser));
      }

      console.log("✅ Lens login successful (mock)");
      return { success: true };
    } catch (error) {
      console.error("❌ Lens login error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  }

  /**
   * Resume existing session from storage
   */
  async resumeSession(): Promise<SocialActionResult> {
    try {
      if (typeof window === "undefined") {
        return { success: false, error: "No window available" };
      }

      const sessionData = localStorage.getItem("lens-session");
      const userData = localStorage.getItem("lens-user");

      if (!sessionData || !userData) {
        return { success: false, error: "No session to resume" };
      }

      const session = JSON.parse(sessionData);
      const user = JSON.parse(userData);

      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        this.clearLocalStorage();
        return { success: false, error: "Session expired" };
      }

      this.isAuthenticated = true;
      this.currentUser = user;
      this.sessionData = session;

      console.log("✅ Session resumed successfully");
      return { success: true };
    } catch (error) {
      this.clearLocalStorage();
      return {
        success: false,
        error: error instanceof Error ? error.message : "Session resume failed",
      };
    }
  }

  /**
   * Get current session details
   */
  async getCurrentSession(): Promise<
    SocialActionResult & {
      data?: {
        address: string;
        signature: string;
        authenticatedAt: number;
        expiresAt: number;
      };
    }
  > {
    if (!this.isAuthenticated || !this.sessionData) {
      return { success: false, error: "Not authenticated" };
    }

    return {
      success: true,
      data: this.sessionData,
    };
  }

  /**
   * Get account information
   */
  async getAccount(
    address: string,
  ): Promise<SocialActionResult & { data?: Account }> {
    try {
      // Return current user if requesting own account
      if (this.isAuthenticated && this.currentUser?.address === address) {
        return {
          success: true,
          data: this.currentUser,
        };
      }

      // Mock other accounts
      const mockAccount: Account = {
        id: address,
        address,
        username: {
          localName: `user${address.slice(-4)}`,
          fullHandle: `user${address.slice(-4)}.lens`,
          ownedBy: address,
        },
        ownedBy: { address },
        metadata: {
          name: "Lens User",
          bio: "A member of the breathing community",
        },
        stats: {
          posts: Math.floor(Math.random() * 50),
          followers: Math.floor(Math.random() * 200),
          following: Math.floor(Math.random() * 100),
        },
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        data: mockAccount,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch account",
      };
    }
  }

  /**
   * Create a post
   */
  async createPost(
    contentUri: string,
  ): Promise<SocialActionResult & { data?: { id: string; txHash: string } }> {
    if (!this.isAuthenticated || !this.currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      // Parse content from URI if it's a data URI
      let content = "New post shared!";
      if (contentUri.startsWith("data:application/json,")) {
        const jsonData = decodeURIComponent(
          contentUri.replace("data:application/json,", ""),
        );
        const metadata = JSON.parse(jsonData);
        content = metadata.content || content;
      }

      // Mock post creation
      const newPost: Post = {
        id: `post-${Date.now()}`,
        content,
        author: {
          id: this.currentUser.id,
          address: this.currentUser.address,
          username: this.currentUser.username,
          metadata: this.currentUser.metadata,
        },
        timestamp: new Date().toISOString(),
        stats: {
          reactions: 0,
          comments: 0,
          reposts: 0,
        },
      };

      // In a real app, this would be handled by the backend posting to Lens
      console.log("Post would be added to Lens timeline:", newPost);

      console.log("✅ Post created successfully (mock)");
      return {
        success: true,
        data: {
          id: newPost.id,
          txHash: `0x${Math.random().toString(16).slice(2)}`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Post creation failed",
      };
    }
  }

  /**
   * Get timeline/feed posts
   */
  async getTimeline(
    cursor?: string,
  ): Promise<SocialActionResult & { data?: Timeline }> {
    if (!this.isAuthenticated) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      // Simulate API call to Lens v3
      await new Promise((resolve) => setTimeout(resolve, 800));
      // Get curated content from multiple Lens v3 sources
      const curatedPosts = await this.getCuratedWellnessContent(cursor);

      const timeline: Timeline = {
        items: curatedPosts.map((post) => ({
          ...post,
          feedReason: {
            type: this.determineFeedReason(post),
            context: this.getFeedContext(post),
          },
        })),
        pageInfo: {
          next:
            curatedPosts.length >= 10
              ? (parseInt(cursor || "0") + 10).toString()
              : undefined,
          prev:
            cursor && parseInt(cursor) > 0
              ? Math.max(0, parseInt(cursor) - 10).toString()
              : undefined,
          hasMore: curatedPosts.length >= 10,
        },
      };

      return {
        success: true,
        data: timeline,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Timeline fetch failed",
      };
    }
  }

  /**
   * Follow an account
   */
  async followAccount(accountAddress: string): Promise<SocialActionResult> {
    if (!this.isAuthenticated) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      // Mock follow action
      await new Promise((resolve) => setTimeout(resolve, 300));

      console.log(`✅ Followed account ${accountAddress} (mock)`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Follow failed",
      };
    }
  }

  /**
   * Unfollow an account
   */
  async unfollowAccount(accountAddress: string): Promise<SocialActionResult> {
    if (!this.isAuthenticated) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      // Mock unfollow action
      await new Promise((resolve) => setTimeout(resolve, 300));

      console.log(`✅ Unfollowed account ${accountAddress} (mock)`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unfollow failed",
      };
    }
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    try {
      this.clearLocalStorage();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.isAuthenticated = false;
      this.currentUser = null;
      this.sessionData = null;
    }
  }

  /**
   * Share a breathing session as a post
   */
  async shareBreathingSession(
    session: BreathingSession,
  ): Promise<SocialActionResult> {
    if (!this.isAuthenticated) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      // Create content for breathing session
      const minutes = Math.round(session.duration / 60);
      let content = `🌬️ Just completed a ${session.patternName} breathing session!\n\n`;
      content += `⏱️ Duration: ${minutes} minute${minutes !== 1 ? "s" : ""}\n`;

      if (session.score) {
        content += `📊 Score: ${session.score}/100\n`;
      }

      if (session.cycles) {
        content += `🔄 Cycles: ${session.cycles}\n`;
      }

      if (session.breathHoldTime) {
        content += `💨 Max breath hold: ${session.breathHoldTime}s\n`;
      }

      content += `\n#breathing #mindfulness #wellness #${session.patternName.toLowerCase().replace(/\s+/g, "")}`;

      // Create metadata
      const metadata = {
        content,
        tags: [
          "breathing",
          "mindfulness",
          "wellness",
          session.patternName.toLowerCase().replace(/\s+/g, ""),
        ],
        attributes: [
          { key: "sessionType", value: "breathing" },
          { key: "pattern", value: session.patternName },
          { key: "duration", value: session.duration.toString() },
        ],
      };

      const contentUri = `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`;

      // Create the post
      return await this.createPost(contentUri);
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to share breathing session",
      };
    }
  }

  /**
   * Get curated wellness content from Lens v3
   * Combines multiple sources: Groups, Feeds, Keywords, and our App content
   */
  private async getCuratedWellnessContent(cursor?: string): Promise<Post[]> {
    try {
      const limit = 10;
      const offset = cursor ? parseInt(cursor) : 0;

      // In real implementation, these would be actual Lens v3 API calls:

      // 1. Primary: Get posts from our app
      const ownAppPosts = await this.fetchPostsByApp(
        IMPERFECT_BREATH_APP_ID,
        limit / 4,
      );

      // 2. Get posts from wellness groups
      const groupPosts = await this.fetchPostsFromGroups(
        CONTENT_CURATION_CONFIG.wellnessGroups,
        limit / 4,
      );

      // 3. Get posts from curated wellness feeds
      const feedPosts = await this.fetchPostsFromFeeds(
        CONTENT_CURATION_CONFIG.wellnessFeeds,
        limit / 4,
      );

      // 4. Get keyword-filtered posts from global timeline
      const keywordPosts = await this.fetchPostsByKeywords(
        CONTENT_CURATION_CONFIG.keywords.include,
        limit / 4,
      );

      // Combine and deduplicate
      const allPosts = [
        ...ownAppPosts,
        ...groupPosts,
        ...feedPosts,
        ...keywordPosts,
      ];

      // Remove duplicates and apply quality filters
      const uniquePosts = this.deduplicateAndFilter(allPosts);

      // Sort by relevance and recency
      const sortedPosts = this.sortByRelevanceAndTime(uniquePosts);

      // Apply pagination
      return sortedPosts.slice(offset, offset + limit);
    } catch (error) {
      console.error("Failed to get curated content:", error);
      return this.getFallbackContent();
    }
  }

  /**
   * Fetch posts from our specific app (highest priority)
   */
  private async fetchPostsByApp(appId: string, limit: number): Promise<Post[]> {
    // Real implementation would use Lens v3 API:
    // const posts = await lensClient.fetchPosts({
    //   where: { metadata: { appId } },
    //   limit,
    //   orderBy: 'latest'
    // });

    // Mock implementation with our app's content
    return [
      {
        id: `${appId}-1`,
        content:
          "🌬️ Just shared my morning breathing routine! 4-7-8 pattern helped me start the day with clarity and focus.\n\n✨ Try it: Inhale for 4, hold for 7, exhale for 8\n\n#breathing #morningroutine #478breathing #imperfectbreath",
        author: {
          id: "0x1111",
          address: "0x1111111111111111111111111111111111111111",
          username: {
            localName: "breathingcoach",
            fullHandle: "breathingcoach.lens",
          },
          metadata: {
            name: "Maya Patel",
          },
        },
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        stats: { reactions: 15, comments: 4, reposts: 3 },
      },
    ];
  }

  /**
   * Fetch posts from wellness-focused Lens Groups
   */
  private async fetchPostsFromGroups(
    groupIds: string[],
    limit: number,
  ): Promise<Post[]> {
    // Real implementation would use Lens v3 Groups API:
    // const posts = await Promise.all(
    //   groupIds.map(groupId =>
    //     lensClient.fetchGroupPosts({ groupId, limit: Math.ceil(limit / groupIds.length) })
    //   )
    // );

    // Mock wellness group content
    return [
      {
        id: "group-wellness-1",
        content:
          "Daily reminder: Your breath is always with you as an anchor to the present moment 🧘‍♀️\n\nTake 3 deep breaths right now and notice how you feel.\n\n#mindfulness #presentmoment #breathawareness",
        author: {
          id: "0x2222",
          address: "0x2222222222222222222222222222222222222222",
          username: {
            localName: "zenmind",
            fullHandle: "zenmind.lens",
          },
          metadata: { name: "Elena Rodriguez" },
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        stats: { reactions: 28, comments: 8, reposts: 5 },
      },
    ];
  }

  /**
   * Fetch posts from curated wellness feeds
   */
  private async fetchPostsFromFeeds(
    feedIds: string[],
    limit: number,
  ): Promise<Post[]> {
    // Real implementation would use Lens v3 Feeds API:
    // const posts = await Promise.all(
    //   feedIds.map(feedId =>
    //     lensClient.fetchFeedPosts({ feedId, limit: Math.ceil(limit / feedIds.length) })
    //   )
    // );

    // Mock curated feed content
    return [
      {
        id: "feed-mindfulness-1",
        content:
          "Week 3 of my Wim Hof journey 🔥❄️\n\nBreath retention times are improving:\n• Week 1: 45 seconds\n• Week 2: 1 minute 15 seconds  \n• Week 3: 1 minute 45 seconds\n\nThe cold exposure is becoming easier too!\n\n#wimhof #breathwork #coldexposure #progress",
        author: {
          id: "0x3333",
          address: "0x3333333333333333333333333333333333333333",
          username: {
            localName: "icebathking",
            fullHandle: "icebathking.lens",
          },
          metadata: {
            name: "Marcus Silva",
          },
        },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        stats: { reactions: 22, comments: 12, reposts: 4 },
      },
    ];
  }

  /**
   * Fetch posts by wellness keywords from global timeline
   */
  private async fetchPostsByKeywords(
    keywords: string[],
    limit: number,
  ): Promise<Post[]> {
    // Real implementation would search posts by content:
    // const posts = await lensClient.searchPosts({
    //   query: keywords.join(' OR '),
    //   limit,
    //   contentFilter: CONTENT_CURATION_CONFIG.keywords.exclude.map(word => `-${word}`).join(' ')
    // });

    // Mock keyword-filtered content
    return [
      {
        id: "keyword-meditation-1",
        content:
          "Meditation doesn't have to be perfect 🧘‍♂️\n\nSome days my mind is like a hurricane, other days it's calm like a lake. Both are valid experiences.\n\nThe practice is in returning to the breath, again and again.\n\n#meditation #mindfulness #selfcompassion #breathwork",
        author: {
          id: "0x4444",
          address: "0x4444444444444444444444444444444444444444",
          username: {
            localName: "peacefulmind",
            fullHandle: "peacefulmind.lens",
          },
          metadata: {
            name: "Dr. Sarah Kim",
          },
        },
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        stats: { reactions: 34, comments: 15, reposts: 7 },
      },
    ];
  }

  /**
   * Remove duplicate posts and apply quality filters
   */
  private deduplicateAndFilter(posts: Post[]): Post[] {
    const seen = new Set<string>();
    const config = CONTENT_CURATION_CONFIG.qualityThresholds;

    return posts.filter((post) => {
      // Remove duplicates
      if (seen.has(post.id)) return false;
      seen.add(post.id);

      // Apply quality filters
      const totalReactions =
        (post.stats?.reactions || 0) + (post.stats?.comments || 0);
      if (totalReactions < config.minReactions) return false;

      if (post.content.length < config.minContentLength) return false;
      if (post.content.length > config.maxContentLength) return false;

      // Filter out excluded keywords
      const lowerContent = post.content.toLowerCase();
      if (
        CONTENT_CURATION_CONFIG.keywords.exclude.some((keyword) =>
          lowerContent.includes(keyword.toLowerCase()),
        )
      )
        return false;

      return true;
    });
  }

  /**
   * Sort posts by relevance (our app first) and recency
   */
  private sortByRelevanceAndTime(posts: Post[]): Post[] {
    return posts.sort((a, b) => {
      // Our app content gets highest priority
      const aIsOurApp = a.id.startsWith(IMPERFECT_BREATH_APP_ID);
      const bIsOurApp = b.id.startsWith(IMPERFECT_BREATH_APP_ID);

      if (aIsOurApp && !bIsOurApp) return -1;
      if (!aIsOurApp && bIsOurApp) return 1;

      // Then by engagement score
      const aEngagement =
        (a.stats?.reactions || 0) + (a.stats?.comments || 0) * 2;
      const bEngagement =
        (b.stats?.reactions || 0) + (b.stats?.comments || 0) * 2;

      if (aEngagement !== bEngagement) {
        return bEngagement - aEngagement;
      }

      // Finally by recency
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  /**
   * Determine feed reason for content discovery
   */
  private determineFeedReason(
    post: Post,
  ): "following" | "trending" | "recommended" {
    if (post.id.startsWith(IMPERFECT_BREATH_APP_ID)) return "recommended";
    if (post.id.startsWith("group-")) return "trending";
    if ((post.stats?.reactions || 0) > 20) return "trending";
    return "recommended";
  }

  /**
   * Get context for why this post was shown
   */
  private getFeedContext(post: Post): string {
    if (post.id.startsWith(IMPERFECT_BREATH_APP_ID)) {
      return "From Imperfect Breath community";
    }
    if (post.id.startsWith("group-")) {
      return "From wellness groups you might like";
    }
    if (post.id.startsWith("feed-")) {
      return "From curated mindfulness feeds";
    }
    return "Wellness content you might enjoy";
  }

  /**
   * Fallback content when curation fails
   */
  private getFallbackContent(): Post[] {
    return [
      {
        id: "fallback-1",
        content:
          "Welcome to the Imperfect Breath community! 🌬️\n\nConnect your breathing practice with others on this journey of mindfulness and wellness.\n\n#community #breathing #mindfulness",
        author: {
          id: "0x0000",
          address: "0x0000000000000000000000000000000000000000",
          username: {
            localName: "imperfectbreath",
            fullHandle: "imperfectbreath.lens",
          },
          metadata: {
            name: "Imperfect Breath",
          },
        },
        timestamp: new Date().toISOString(),
        stats: { reactions: 0, comments: 0, reposts: 0 },
      },
    ];
  }

  /**
   * Clear local storage
   */
  private clearLocalStorage(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("lens-session");
      localStorage.removeItem("lens-user");
    }
  }

  // Getters
  isAuth(): boolean {
    return this.isAuthenticated;
  }

  getCurrentUser(): Account | null {
    return this.currentUser;
  }

  getSession(): {
    address: string;
    signature: string;
    authenticatedAt: number;
    expiresAt: number;
  } | null {
    return this.sessionData;
  }
}

// Export singleton instance
export const lensAPI = new LensV3API();

// Helper functions for session management
export const isClientAuthenticated = (): boolean => {
  return lensAPI.isAuth();
};

export const getCurrentSession = (): {
  address: string;
  signature: string;
  authenticatedAt: number;
  expiresAt: number;
} | null => {
  return lensAPI.getSession();
};

export const getSessionClient = (): {
  address: string;
  signature: string;
  authenticatedAt: number;
  expiresAt: number;
} | null => {
  return lensAPI.getSession();
};

export const initializeSession = async (): Promise<boolean> => {
  try {
    const result = await lensAPI.resumeSession();
    return result.success;
  } catch (error) {
    console.error("Failed to initialize session:", error);
    return false;
  }
};

// Storage helpers
export const setSession = async (tokens: LensAuthTokens): Promise<void> => {
  console.log("Session stored via client");
};

export const clearSession = async (): Promise<void> => {
  await lensAPI.logout();
};

// Mock PublicClient for external compatibility
export const publicClient: {
  login: (
    address: string,
    signMessage: (message: string) => Promise<string>,
  ) => Promise<SocialActionResult>;
  logout: () => Promise<void>;
  resumeSession: () => Promise<SocialActionResult>;
} = {
  login: lensAPI.login.bind(lensAPI),
  logout: lensAPI.logout.bind(lensAPI),
  resumeSession: lensAPI.resumeSession.bind(lensAPI),
};
