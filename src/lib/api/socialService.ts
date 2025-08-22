import { apiClient } from './unified-client';

/**
 * Interface for social post data
 */
export interface SocialPost {
  id: string;
  content: string;
  author: {
    address: string;
    username?: string;
    name?: string;
    avatar?: string;
  };
  metadata?: {
    type?: string;
    tags?: string[];
    [key: string]: unknown;
  };
  stats?: {
    reactions: number;
    comments: number;
    mirrors: number;
  };
  reaction?: {
    isReacted: boolean;
  };
  createdAt: string;
}

/**
 * Interface for trending pattern data
 */
export interface TrendingPattern {
  name: string;
  usageCount: number;
  avgScore: number;
  trend: "up" | "down" | "stable";
}

/**
 * Fetches timeline posts from Lens Protocol
 */
export async function getTimeline(
  address: string,
): Promise<{ items: SocialPost[] }> {
  const response = await apiClient.request('social', '/api/social/timeline', {
    method: 'POST',
    body: JSON.stringify({ address }),
  });
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch timeline');
  }
  
  return response.data;
}

/**
 * Fetches trending patterns from Lens Protocol
 */
export async function getTrendingPatterns(): Promise<TrendingPattern[]> {
  const response = await apiClient.request('social', '/api/patterns/trending', {
    method: 'GET',
  });
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch trending patterns');
  }
  
  // Validate data structure
  if (!Array.isArray(response.data)) {
    throw new Error('Invalid trending patterns data format');
  }
  
  return response.data;
}

/**
 * Reacts to a post (like/unlike)
 */
export async function reactToPost(
  publicationId: string,
  remove: boolean,
): Promise<boolean> {
  const response = await apiClient.request('social', '/api/social/react', {
    method: 'POST',
    body: JSON.stringify({
      publicationId,
      reaction: 'UPVOTE',
      remove,
    }),
  });
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to react to post');
  }
  
  return response.data.success === true;
}

/**
 * Follows a user account
 */
export async function followAccount(
  address: string,
): Promise<{ success: boolean; error?: string }> {
  const response = await apiClient.request('social', '/api/social/follow', {
    method: 'POST',
    body: JSON.stringify({ targetAddress: address }),
  });
  
  return {
    success: response.success,
    error: response.error,
  };
}

/**
 * Shares a breathing session to Lens Protocol
 */
export async function shareBreathingSession(sessionData: {
  patternName: string;
  duration: number;
  score: number;
  insights?: string[];
  content?: string;
}): Promise<string> {
  const response = await apiClient.shareBreathingSession(sessionData);
  
  if (!response.success || !response.data.postHash) {
    throw new Error(response.error || 'Failed to get transaction hash');
  }
  
  return response.data.postHash;
}
