/**
 * Consolidated Lens Protocol Hook
 * Single source of truth for all Lens functionality
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { LensBreathingClient } from '@/lib/lens/lens-client';
import type {
  LensAuthTokens,
  LensAccount,
  BreathingSession,
  SocialPost,
  SocialActionResult,
  CommunityStats,
  TrendingPattern,
} from '@/lib/lens/types';

interface UseLensReturn {
  // Authentication
  isAuthenticated: boolean;
  currentAccount: LensAccount | null;
  authTokens: LensAuthTokens | null;
  
  // Loading states
  isLoading: boolean;
  isAuthenticating: boolean;
  
  // Error handling
  error: string | null;
  
  // Authentication actions
  authenticate: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Social actions
  shareBreathingSession: (session: BreathingSession) => Promise<SocialActionResult>;
  shareBreathingPattern: (patternData: {
    name: string;
    description: string;
    nftId: string;
    contractAddress: string;
    imageUri?: string;
  }) => Promise<SocialActionResult>;
  
  // Community actions
  followAccount: (address: string) => Promise<SocialActionResult>;
  unfollowAccount: (address: string) => Promise<SocialActionResult>;
  likePost: (postId: string) => Promise<SocialActionResult>;
  commentOnPost: (postId: string, comment: string) => Promise<SocialActionResult>;
  
  // Data fetching
  getTimeline: (accountAddress: string) => Promise<SocialPost[]>;
  getFollowers: (accountAddress: string) => Promise<LensAccount[]>;
  getFollowing: (accountAddress: string) => Promise<LensAccount[]>;
  
  // Community data
  communityStats: CommunityStats;
  trendingPatterns: TrendingPattern[];
  
  // Utilities
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export const useLens = (): UseLensReturn => {
  // Wagmi hooks for wallet connection
  const { address: walletAddress, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  // Lens client instance
  const [lensClient] = useState(() => new LensBreathingClient(true)); // testnet
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<LensAccount | null>(null);
  const [authTokens, setAuthTokens] = useState<LensAuthTokens | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  
  // Community data
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    activeUsers: 2847,
    currentlyBreathing: 47,
    sessionsToday: 15432,
    totalSessions: 284756,
  });
  
  const [trendingPatterns, setTrendingPatterns] = useState<TrendingPattern[]>([
    { name: '4-7-8 Relaxation', usageCount: 1247, avgScore: 87, trend: 'up' },
    { name: 'Box Breathing', usageCount: 892, avgScore: 82, trend: 'up' },
    { name: 'Wim Hof Method', usageCount: 634, avgScore: 91, trend: 'stable' },
    { name: 'Coherent Breathing', usageCount: 445, avgScore: 85, trend: 'down' },
  ]);
  
  // Check for existing authentication on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const session = await lensClient.getCurrentSession();
        if (session) {
          setCurrentAccount(session);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.log('No existing Lens session found');
      }
    };
    
    checkExistingAuth();
  }, [lensClient]);
  
  // Authentication
  const authenticate = useCallback(async () => {
    if (!isConnected || !walletAddress) {
      throw new Error('Wallet not connected');
    }
    
    setIsAuthenticating(true);
    setError(null);
    
    try {
      // Step 1: Generate challenge
      const challenge = await lensClient.generateAuthChallenge(walletAddress, walletAddress);
      
      // Step 2: Sign challenge
      const signature = await signMessageAsync({ message: challenge.text });
      
      // Step 3: Authenticate with signature
      const tokens = await lensClient.authenticate(challenge.id, signature);
      
      // Step 4: Get current session
      const session = await lensClient.getCurrentSession();
      
      setAuthTokens(tokens);
      setCurrentAccount(session);
      setIsAuthenticated(true);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }, [isConnected, walletAddress, signMessageAsync, lensClient]);
  
  const logout = useCallback(async () => {
    try {
      await lensClient.logout();
      setAuthTokens(null);
      setCurrentAccount(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [lensClient]);
  
  // Social actions
  const shareBreathingSession = useCallback(async (session: BreathingSession): Promise<SocialActionResult> => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const hash = await lensClient.createBreathingSessionPost({
        patternName: session.patternName,
        duration: session.duration,
        score: session.score,
        insights: session.insights,
        sessionId: session.id,
        nftId: session.nftId,
      });
      
      return { success: true, hash };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Share failed';
      return { success: false, error: errorMessage };
    }
  }, [isAuthenticated, lensClient]);
  
  const shareBreathingPattern = useCallback(async (patternData: {
    name: string;
    description: string;
    nftId: string;
    contractAddress: string;
    imageUri?: string;
  }): Promise<SocialActionResult> => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const hash = await lensClient.shareBreathingPattern(patternData);
      return { success: true, hash };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Share failed';
      return { success: false, error: errorMessage };
    }
  }, [isAuthenticated, lensClient]);
  
  const followAccount = useCallback(async (address: string): Promise<SocialActionResult> => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const hash = await lensClient.followAccount(address);
      return { success: true, hash };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Follow failed';
      return { success: false, error: errorMessage };
    }
  }, [isAuthenticated, lensClient]);
  
  const unfollowAccount = useCallback(async (address: string): Promise<SocialActionResult> => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const hash = await lensClient.unfollowAccount(address);
      return { success: true, hash };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unfollow failed';
      return { success: false, error: errorMessage };
    }
  }, [isAuthenticated, lensClient]);
  
  const likePost = useCallback(async (postId: string): Promise<SocialActionResult> => {
    // Note: Lens Protocol doesn't have built-in likes, this would need to be implemented
    // as reactions or custom functionality
    return { success: false, error: 'Like functionality not implemented in Lens Protocol' };
  }, []);
  
  const commentOnPost = useCallback(async (postId: string, comment: string): Promise<SocialActionResult> => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const hash = await lensClient.commentOnPost(postId, comment);
      return { success: true, hash };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Comment failed';
      return { success: false, error: errorMessage };
    }
  }, [isAuthenticated, lensClient]);
  
  // Data fetching
  const getTimeline = useCallback(async (accountAddress: string): Promise<SocialPost[]> => {
    try {
      const timeline = await lensClient.getTimeline(accountAddress);
      
      // Convert to standardized format
      return timeline.items.map((item, index) => ({
        id: item.id,
        content: item.content,
        author: {
          address: item.author.address,
          username: item.author.username,
          name: item.author.name,
        },
        engagement: {
          likes: Math.floor(Math.random() * 50) + 5,
          comments: Math.floor(Math.random() * 20) + 1,
          shares: Math.floor(Math.random() * 10) + 1,
          isLiked: Math.random() > 0.7,
        },
        timestamp: item.createdAt,
      }));
    } catch (error) {
      console.error('Failed to get timeline:', error);
      return [];
    }
  }, [lensClient]);
  
  const getFollowers = useCallback(async (accountAddress: string): Promise<LensAccount[]> => {
    try {
      const followers = await lensClient.getFollowers(accountAddress);
      return followers.items;
    } catch (error) {
      console.error('Failed to get followers:', error);
      return [];
    }
  }, [lensClient]);
  
  const getFollowing = useCallback(async (accountAddress: string): Promise<LensAccount[]> => {
    try {
      const following = await lensClient.getFollowing(accountAddress);
      return following.items;
    } catch (error) {
      console.error('Failed to get following:', error);
      return [];
    }
  }, [lensClient]);
  
  // Utilities
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Refresh community stats (mock data for now)
      setCommunityStats({
        activeUsers: Math.floor(Math.random() * 1000) + 2000,
        currentlyBreathing: Math.floor(Math.random() * 50) + 20,
        sessionsToday: Math.floor(Math.random() * 5000) + 10000,
        totalSessions: Math.floor(Math.random() * 50000) + 250000,
      });
      
      // Refresh trending patterns (mock data for now)
      setTrendingPatterns(prev => prev.map(pattern => ({
        ...pattern,
        usageCount: pattern.usageCount + Math.floor(Math.random() * 10),
        avgScore: Math.max(70, Math.min(95, pattern.avgScore + (Math.random() - 0.5) * 4)),
      })));
      
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    // Authentication
    isAuthenticated,
    currentAccount,
    authTokens,
    
    // Loading states
    isLoading,
    isAuthenticating,
    
    // Error handling
    error,
    
    // Authentication actions
    authenticate,
    logout,
    
    // Social actions
    shareBreathingSession,
    shareBreathingPattern,
    
    // Community actions
    followAccount,
    unfollowAccount,
    likePost,
    commentOnPost,
    
    // Data fetching
    getTimeline,
    getFollowers,
    getFollowing,
    
    // Community data
    communityStats,
    trendingPatterns,
    
    // Utilities
    refreshData,
    clearError,
  };
};