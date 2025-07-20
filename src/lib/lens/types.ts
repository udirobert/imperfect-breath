/**
 * Lens Protocol v3 Types - Consolidated and DRY
 *
 * Single source of truth for all Lens-related TypeScript interfaces
 * Removes duplications and uses native Lens v3 types where possible
 */

import type {
  AccountFragment,
  AnyPostFragment,
  AccountMetadataFragment,
} from "@lens-protocol/client";

// Re-export core Lens types for easy access
export type {
  AccountFragment as NativeLensAccount,
  AnyPostFragment as NativeLensPost,
  AccountMetadataFragment as NativeLensAccountMetadata,
} from "@lens-protocol/client";

// Authentication & Session Types
export interface LensAuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresAt: string;
}

export interface LensAuthChallenge {
  id: string;
  text: string;
}

export interface LensAuthRequest {
  challengeId: string;
  signature: string;
  accountOwner?: {
    app: string;
    account: string;
    owner: string;
  };
}

// Simplified Account Interface (for our app use)
export interface Account {
  id: string;
  address: string;
  username?: {
    localName: string;
    fullHandle: string;
    ownedBy: string;
  };
  metadata?: {
    name?: string;
    bio?: string;
    picture?: string;
  };
  stats?: {
    followers: number;
    following: number;
    posts: number;
    comments: number;
    reposts: number;
    quotes: number;
    reactions: number;
  };
  operations?: {
    canFollow: boolean;
    canUnfollow: boolean;
    isFollowedByMe: boolean;
    canSendDM: boolean;
    canBlock: boolean;
    canReport: boolean;
  };
  timestamp: string;
}

// Simplified Post Interface (for our app use)
export interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    username?: {
      localName: string;
      fullHandle: string;
    };
    metadata?: {
      name?: string;
      picture?: string;
    };
  };
  metadata?: {
    content: string;
    tags?: string[];
    appId?: string;
  };
  stats?: {
    comments: number;
    reposts: number;
    quotes: number;
    reactions: number;
    collects: number;
    bookmarks: number;
  };
  timestamp: string;
  commentOn?: {
    id: string;
  };
}

// Breathing Session Data
export interface BreathingSession {
  id?: string;
  patternName: string;
  duration: number; // in seconds
  score?: number; // 0-100
  insights?: string[];
  timestamp?: string;
  sessionId?: string;
  nftId?: string;
  breathHoldTime?: number;
  restlessnessScore?: number;
  cycles?: number;
  content?: string; // Text content for social sharing
}

// Social Action Results
export interface SocialActionResult {
  success: boolean;
  hash?: string;
  id?: string;
  error?: string;
}

// Community Statistics
export interface CommunityStats {
  activeUsers: number;
  currentlyBreathing: number;
  sessionsToday: number;
  totalSessions: number;
}

// Trending Patterns
export interface TrendingPattern {
  name: string;
  usageCount: number;
  avgScore: number;
  trend: "up" | "down" | "stable";
  description?: string;
}

// Breathing Challenge
export interface BreathingChallenge {
  id: string;
  title: string;
  description: string;
  pattern: string;
  duration: number; // in seconds
  targetSessions: number;
  reward?: {
    type: "nft" | "badge" | "points";
    value: string | number;
  };
  participants: number;
  endsAt: string;
  isActive: boolean;
}

// API Response Types
export interface LensTimelineResponse {
  items: Post[];
  pageInfo: {
    prev?: string;
    next?: string;
  };
}

export interface LensFollowersResponse {
  items: Account[];
  pageInfo: {
    prev?: string;
    next?: string;
  };
}

export interface LensExploreResponse {
  items: Post[];
  pageInfo: {
    prev?: string;
    next?: string;
  };
}

// Request Types
export interface PostRequest {
  contentUri: string;
  actions?: unknown[];
}

export interface CommentRequest {
  commentOn: string;
  contentUri: string;
}

export interface FollowRequest {
  account: string;
}

export interface UnfollowRequest {
  account: string;
}

export interface AccountRequest {
  account: string;
}

export interface ExplorePostsRequest {
  limit?: number;
  orderBy?: "latest" | "topRated";
  cursor?: string;
}

export interface ChallengeRequest {
  accountOwner: {
    app: string;
    account: string;
    owner: string;
  };
}

// Content Creation Types
export interface LensPostContent {
  content: string;
  tags?: string[];
  appId?: string;
  media?: {
    type: "image" | "video" | "audio";
    url: string;
    mimeType: string;
  }[];
}

export interface BreathingSessionPost {
  sessionData: BreathingSession;
  content: string;
  tags: string[];
}

// Error Types
export interface LensError {
  code: string;
  message: string;
  context?: Record<string, any>;
}

// Lens API Client Types
export interface LensClientConfig {
  environment: "mainnet" | "testnet";
  storage?: Storage;
  appAddress?: string;
}

// Social Context for Components
export interface SocialContext {
  isAuthenticated: boolean;
  currentAccount: Account | null;
  communityStats: CommunityStats;
  trendingPatterns: TrendingPattern[];
}

// Breathing Pattern for Challenges
export interface BreathingPattern {
  name: string;
  description: string;
  inhale: number;
  hold: number;
  exhale: number;
  holdEmpty?: number;
  cycles?: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  benefits: string[];
}

// User preferences
export interface UserPreferences {
  defaultPattern: string;
  sessionReminders: boolean;
  shareByDefault: boolean;
  privacyLevel: "public" | "followers" | "private";
  notificationSettings: {
    challenges: boolean;
    achievements: boolean;
    social: boolean;
  };
}

// Achievement System
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  progress: number;
  maxProgress: number;
  unlockedAt?: string;
  reward?: {
    type: "nft" | "badge" | "points";
    value: string | number;
  };
}

// Lens Metadata Standards
export interface LensTextOnlyMetadata {
  $schema: string;
  lens: {
    mainContentFocus: "TEXT_ONLY";
    title?: string;
    content: string;
    id: string;
    locale: string;
    tags?: string[];
    appId?: string;
  };
}

export interface LensImageMetadata {
  $schema: string;
  lens: {
    mainContentFocus: "IMAGE";
    title?: string;
    content?: string;
    id: string;
    locale: string;
    tags?: string[];
    appId?: string;
    image: {
      item: string;
      type: string;
      altTag?: string;
    };
  };
}

// Type Guards
export function isAccount(obj: any): obj is Account {
  return obj && typeof obj.id === "string" && typeof obj.address === "string";
}

export function isPost(obj: any): obj is Post {
  return obj && typeof obj.id === "string" && typeof obj.content === "string";
}

export function isBreathingSession(obj: any): obj is BreathingSession {
  return (
    obj &&
    typeof obj.patternName === "string" &&
    typeof obj.duration === "number"
  );
}

export function isSocialActionResult(obj: any): obj is SocialActionResult {
  return obj && typeof obj.success === "boolean";
}

// Utility Types
export type LensEnvironment = "mainnet" | "testnet";
export type PostOrderBy = "latest" | "topRated";
export type ContentFocus = "TEXT_ONLY" | "IMAGE" | "VIDEO" | "AUDIO";
export type PrivacyLevel = "public" | "followers" | "private";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";
export type TrendDirection = "up" | "down" | "stable";
export type AchievementRarity = "common" | "rare" | "epic" | "legendary";
