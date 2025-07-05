/**
 * Shared Lens Protocol Types
 * Single source of truth for all Lens-related interfaces
 */

export interface LensAuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
}

export interface LensAccount {
  address: string;
  username?: string;
  name?: string;
  picture?: string;
  permissions?: {
    canExecuteTransactions: boolean;
    canTransferTokens: boolean;
    canTransferNative: boolean;
    canSetMetadataUri: boolean;
  };
}

export interface BreathingSession {
  id?: string;
  patternName: string;
  duration: number; // in seconds
  score: number; // 0-100
  insights: string[];
  timestamp?: string;
  sessionId?: string;
  nftId?: string;
  breathHoldTime?: number;
  restlessnessScore?: number;
  cycles?: number;
}

export interface SocialPost {
  id: string;
  content: string;
  author: LensAccount;
  sessionData?: BreathingSession;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    isLiked?: boolean;
  };
  timestamp: string;
  metadata?: {
    tags: string[];
    appId: string;
  };
}

export interface CommunityStats {
  activeUsers: number;
  currentlyBreathing: number;
  sessionsToday: number;
  totalSessions: number;
}

export interface TrendingPattern {
  name: string;
  usageCount: number;
  avgScore: number;
  trend: 'up' | 'down' | 'stable';
  description?: string;
}

export interface SocialContext {
  isAuthenticated: boolean;
  currentAccount: LensAccount | null;
  communityStats: CommunityStats;
  trendingPatterns: TrendingPattern[];
}

export interface SocialActionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

// Lens API Response Types
export interface LensTimelineResponse {
  items: Array<{
    id: string;
    content: string;
    author: {
      address: string;
      username?: string;
      name?: string;
    };
    createdAt: string;
  }>;
  pageInfo: {
    prev?: string;
    next?: string;
  };
}

export interface LensFollowersResponse {
  items: Array<{
    address: string;
    username?: string;
    name?: string;
    picture?: string;
  }>;
  pageInfo: {
    prev?: string;
    next?: string;
  };
}