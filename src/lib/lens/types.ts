/**
 * Lens Protocol v3 Types
 *
 * Updated type definitions for Lens Protocol v3 SDK
 * Matches the new client architecture and response patterns
 */

// Base result type for all operations
export interface SocialActionResult {
  success: boolean;
  error?: string;
  id?: string;
  hash?: string;
}

// Authentication tokens (mostly handled internally by v3 SDK)
export interface LensAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// Account/Profile types
export interface Account {
  id: string;
  address: string;
  username?: {
    localName: string;
    fullHandle: string;
    ownedBy: string;
  };
  ownedBy: {
    address: string;
  };
  metadata?: {
    name?: string;
    bio?: string;
    picture?: string;
  };
  stats?: {
    followers?: number;
    following?: number;
    posts?: number;
    comments?: number;
    reposts?: number;
    quotes?: number;
    reactions?: number;
    collects?: number;
    bookmarks?: number;
  };
  operations?: {
    canFollow?: boolean;
    canUnfollow?: boolean;
    isFollowedByMe?: boolean;
    canSendDM?: boolean;
    canBlock?: boolean;
    canReport?: boolean;
  };
  timestamp: string;
}

// Post/Content types
export interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    address: string;
    username?: {
      localName: string;
      fullHandle: string;
    };
    metadata?: {
      name?: string;
      picture?: string;
    };
  };
  timestamp: string;
  stats?: {
    reactions: number;
    comments: number;
    reposts: number;
    quotes?: number;
    collects?: number;
    bookmarks?: number;
  };
  metadata?: {
    content: string;
    tags?: string[];
    attributes?: Array<{
      key: string;
      value: string;
    }>;
  };
}

// Breathing session data for sharing
export interface BreathingSession {
  patternName: string;
  duration: number;
  score?: number;
  breathHoldTime?: number;
  cycles?: number;
  completedAt: string;
  userId?: string;
  restlessnessScore?: number;
}

// Community stats
export interface CommunityStats {
  activeUsers: number;
  currentlyBreathing: number;
  sessionsToday: number;
  totalSessions: number;
}

// Trending patterns
export interface TrendingPattern {
  id: string;
  name: string;
  description: string;
  usageCount: number;
  trend: "up" | "down" | "stable";
}

// Breathing challenge
export interface BreathingChallenge {
  id: string;
  name: string;
  description: string;
  hashtag: string;
  duration: string;
  participants: number;
  reward: string;
  isActive: boolean;
  endsAt: string;
  createdAt: string;
}

// Breathing pattern
export interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  instruction: string;
  inhale: number;
  hold: number;
  exhale: number;
  pause?: number;
  cycles: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  creator?: string;
  isPublic: boolean;
  createdAt: string;
}

// Achievement system
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "sessions" | "patterns" | "social" | "streaks";
  requirement: {
    type: string;
    value: number;
  };
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

// User preferences
export interface UserPreferences {
  defaultPattern: string;
  sessionReminders: boolean;
  shareByDefault: boolean;
  privacyLevel: "public" | "friends" | "private";
  notificationSettings: {
    challenges: boolean;
    achievements: boolean;
    social: boolean;
  };
}

// Feed/Timeline types
export interface FeedPost extends Post {
  feedReason?: {
    type: "following" | "trending" | "recommended";
    context?: string;
  };
}

export interface Timeline {
  items: FeedPost[];
  pageInfo: {
    next?: string;
    prev?: string;
    hasMore: boolean;
  };
}

// Lens v3 specific client types
export interface LensClient {
  login(
    address: string,
    signMessage: (message: string) => Promise<string>,
  ): Promise<SocialActionResult>;
  logout(): Promise<void>;
  resumeSession(): Promise<SocialActionResult>;
  isAuthenticated(): boolean;
  getCurrentUser(): Account | null;
  getAccount(address: string): Promise<SocialActionResult & { data?: Account }>;
  createPost(
    contentUri: string,
  ): Promise<SocialActionResult & { data?: { id: string; txHash: string } }>;
  getTimeline(
    cursor?: string,
  ): Promise<SocialActionResult & { data?: Timeline }>;
  followAccount(address: string): Promise<SocialActionResult>;
  unfollowAccount(address: string): Promise<SocialActionResult>;
  shareBreathingSession(session: BreathingSession): Promise<SocialActionResult>;
}

// Error types
export interface LensError {
  message: string;
  code?: string;
  details?: unknown;
}

// Response wrappers
export interface LensResponse<T> {
  success: boolean;
  data?: T;
  error?: LensError;
}

// Pagination helpers
export interface PageInfo {
  next?: string;
  prev?: string;
  hasMore: boolean;
  totalCount?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageInfo: PageInfo;
}

// Content metadata for posts
export interface PostMetadata {
  content: string;
  title?: string;
  tags?: string[];
  attributes?: Array<{
    key: string;
    value: string;
    type?: "string" | "number" | "boolean" | "date";
  }>;
  locale?: string;
  contentWarning?: {
    reason: string;
    level: "mild" | "moderate" | "severe";
  };
  media?: Array<{
    type: "image" | "video" | "audio";
    url: string;
    mimeType: string;
    altText?: string;
  }>;
}

// Lens v3 session information
export interface LensSession {
  id: string;
  address: string;
  app: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

// Export utility types
export type Maybe<T> = T | null | undefined;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
