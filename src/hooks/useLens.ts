/**
 * Consolidated Lens Protocol Hook
 * Single source of truth for all Lens functionality
 * Enhanced with robust error handling, caching, and retry mechanisms
 */

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { EnhancedLensClient } from '../lib/lens/enhanced-lens-client';
import * as socialService from '../lib/api/socialService';
import type {
  LensAuthTokens,
  LensAccount,
  BreathingSession,
  SocialPost,
  SocialActionResult,
  CommunityStats,
  TrendingPattern,
} from '../lib/lens/types';
import {
  LensError,
  LensAuthenticationError,
  LensApiError,
  LensRateLimitError,
  LensSocialActionError,
  LensStorageError
} from '../lib/lens/errors';
import { toast } from 'sonner';

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
  errorType: string | null;
  
  // Authentication actions
  authenticate: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  
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
  invalidateCache: (key?: string) => void;
}

export const useLens = (): UseLensReturn => {
  // Wagmi hooks for wallet connection
  const { address: walletAddress, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  // Enhanced Lens client instance with retries, caching, and improved error handling
  const [lensClient] = useState(() => new EnhancedLensClient(true)); // testnet
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<LensAccount | null>(null);
  const [authTokens, setAuthTokens] = useState<LensAuthTokens | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Enhanced error handling
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  
  // Community data
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    activeUsers: 0,
    currentlyBreathing: 0,
    sessionsToday: 0,
    totalSessions: 0,
  });
  
  const [trendingPatterns, setTrendingPatterns] = useState<TrendingPattern[]>([]);
  
  // Fetch real community stats from API
  useEffect(() => {
    const fetchCommunityStats = async () => {
      try {
        // Use the actual API endpoint
        const response = await fetch('/api/community/stats');
        if (response.ok) {
          const data = await response.json();
          setCommunityStats(data);
        } else {
          throw new Error(`Error ${response.status}: Failed to fetch community stats`);
        }
      } catch (error) {
        console.error('Failed to fetch community stats:', error);
        // Don't show toast for this background operation
      }
    };
    
    const fetchTrendingPatterns = async () => {
      try {
        // Use our new socialService
        const patterns = await socialService.getTrendingPatterns();
        setTrendingPatterns(patterns);
      } catch (error) {
        console.error('Failed to fetch trending patterns:', error);
        // Don't show toast for this background operation
      }
    };
    
    fetchCommunityStats();
    fetchTrendingPatterns();
    
    // Refresh data every 5 minutes
    const interval = setInterval(() => {
      fetchCommunityStats();
      fetchTrendingPatterns();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Helper to handle errors
  const handleError = useCallback((err: unknown) => {
    if (err instanceof LensAuthenticationError) {
      setError(`Authentication error: ${err.message}`);
      setErrorType('authentication');
      toast.error(`Authentication error: ${err.message}`);
    } else if (err instanceof LensApiError) {
      setError(`API error: ${err.message}`);
      setErrorType('api');
      toast.error(`Network error: ${err.message}. Will retry automatically.`);
    } else if (err instanceof LensRateLimitError) {
      setError(`Rate limit reached: ${err.message}`);
      setErrorType('rateLimit');
      toast.error(`Rate limit reached. Please try again later.`);
    } else if (err instanceof LensSocialActionError) {
      setError(`Social action error: ${err.message}`);
      setErrorType('socialAction');
      toast.error(`Operation failed: ${err.message}`);
    } else if (err instanceof LensStorageError) {
      setError(`Storage error: ${err.message}`);
      setErrorType('storage');
      toast.error(`Storage error: ${err.message}`);
    } else if (err instanceof LensError) {
      setError(`Lens error: ${err.message}`);
      setErrorType('lens');
      toast.error(`Lens error: ${err.message}`);
    } else {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setErrorType('unknown');
      toast.error(errorMessage);
    }
  }, []);
  
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
    setErrorType(null);
    
    try {
      // Step 1: Generate challenge
      const challenge = await lensClient.generateAuthChallenge(walletAddress, walletAddress);
      
      // Step 2: Sign challenge
      const signature = await signMessageAsync({
        message: challenge.text,
        account: walletAddress as `0x${string}`
      });
      
      // Step 3: Authenticate with signature
      const tokens = await lensClient.authenticate(challenge.id, signature);
      
      // Step 4: Get current session
      const session = await lensClient.getCurrentSession();
      
      setAuthTokens(tokens);
      setCurrentAccount(session);
      setIsAuthenticated(true);
      
      // Enhanced Lens client will handle caching automatically
      
      return tokens;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }, [isConnected, walletAddress, signMessageAsync, lensClient, handleError]);
  
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    if (!authTokens?.refreshToken) {
      return false;
    }
    
    try {
      const tokens = await lensClient.refreshTokens();
      setAuthTokens(tokens);
      
      // Get current session
      const session = await lensClient.getCurrentSession();
      setCurrentAccount(session);
      
      // Enhanced Lens client will handle caching automatically
      
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [authTokens, lensClient, handleError]);
  
  const logout = useCallback(async () => {
    try {
      await lensClient.logout();
      setAuthTokens(null);
      setCurrentAccount(null);
      setIsAuthenticated(false);
      setError(null);
      setErrorType(null);
      
      // Enhanced Lens client will handle cache invalidation
    } catch (error) {
      console.error('Logout error:', error);
      handleError(error);
    }
  }, [lensClient, handleError]);
  
  // Social actions
  const shareBreathingSession = useCallback(async (session: BreathingSession): Promise<SocialActionResult> => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    setIsLoading(true);
    
    try {
      // Use our socialService to share breathing sessions
      const hash = await socialService.shareBreathingSession({
        patternName: session.patternName,
        duration: session.duration,
        score: session.score,
        insights: session.insights,
        content: session.content
      });
      
      // Refresh timeline data to show the new post
      if (currentAccount?.address) {
        setTimeout(() => getTimeline(currentAccount.address), 2000);
      }
      
      return { success: true, hash };
    } catch (error) {
      handleError(error);
      const errorMessage = error instanceof Error ? error.message : 'Share failed';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, lensClient, handleError]);
  
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
    
    setIsLoading(true);
    
    try {
      const hash = await lensClient.shareBreathingPattern(patternData);
      
      // Enhanced Lens client will handle cache invalidation
      
      return { success: true, hash };
    } catch (error) {
      handleError(error);
      const errorMessage = error instanceof Error ? error.message : 'Share failed';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, lensClient, handleError]);
  
  const followAccount = useCallback(async (address: string): Promise<SocialActionResult> => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    setIsLoading(true);
    
    try {
      const hash = await lensClient.followAccount(address);
      
      // Enhanced Lens client will handle cache invalidation
      
      return { success: true, hash };
    } catch (error) {
      handleError(error);
      const errorMessage = error instanceof Error ? error.message : 'Follow failed';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, lensClient, currentAccount, handleError]);
  
  const unfollowAccount = useCallback(async (address: string): Promise<SocialActionResult> => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    setIsLoading(true);
    
    try {
      const hash = await lensClient.unfollowAccount(address);
      
      // Enhanced Lens client will handle cache invalidation
      
      return { success: true, hash };
    } catch (error) {
      handleError(error);
      const errorMessage = error instanceof Error ? error.message : 'Unfollow failed';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, lensClient, currentAccount, handleError]);
  
  const likePost = useCallback(async (postId: string): Promise<SocialActionResult> => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    setIsLoading(true);
    
    try {
      // Use our socialService to react to posts
      const success = await socialService.reactToPost(postId, false);
      return { success, hash: postId };
    } catch (error) {
      handleError(error);
      const errorMessage = error instanceof Error ? error.message : 'Like failed';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, handleError]);
  
  const commentOnPost = useCallback(async (postId: string, comment: string): Promise<SocialActionResult> => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    setIsLoading(true);
    
    try {
      const hash = await lensClient.commentOnPost(postId, comment);
      
      // Enhanced Lens client will handle cache invalidation
      
      return { success: true, hash };
    } catch (error) {
      handleError(error);
      const errorMessage = error instanceof Error ? error.message : 'Comment failed';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, lensClient, handleError]);
  
  // Data fetching with caching
  const getTimeline = useCallback(async (accountAddress: string): Promise<SocialPost[]> => {
    setIsLoading(true);
    
    try {
      // Use our socialService to get timeline
      const result = await socialService.getTimeline(accountAddress);
      
      if (!result || !result.items) {
        throw new Error("Invalid timeline data");
      }
      
      // Convert to standardized format with real engagement data
      return result.items.map((item) => ({
        id: item.id,
        content: item.content,
        author: {
          address: item.author.address,
          username: item.author.username,
          name: item.author.name,
          avatar: item.author.avatar,
        },
        engagement: {
          likes: item.stats?.reactions || 0,
          comments: item.stats?.comments || 0,
          shares: item.stats?.mirrors || 0,
          isLiked: item.reaction?.isReacted || false
        },
        timestamp: item.createdAt,
        metadata: item.metadata,
      }));
    } catch (error) {
      handleError(error);
      console.error('Failed to get timeline:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [lensClient, handleError]);
  
  const getFollowers = useCallback(async (accountAddress: string): Promise<LensAccount[]> => {
    setIsLoading(true);
    
    try {
      const followers = await lensClient.getFollowers(accountAddress);
      return followers;
    } catch (error) {
      handleError(error);
      console.error('Failed to get followers:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [lensClient, handleError]);
  
  const getFollowing = useCallback(async (accountAddress: string): Promise<LensAccount[]> => {
    setIsLoading(true);
    
    try {
      const following = await lensClient.getFollowing(accountAddress);
      return following;
    } catch (error) {
      handleError(error);
      console.error('Failed to get following:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [lensClient, handleError]);
  
  // Utilities
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch real community stats
      try {
        const statsResponse = await fetch('/api/community/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setCommunityStats(statsData);
        }
      } catch (statsError) {
        console.error('Failed to refresh community stats:', statsError);
      }
      
      // Fetch real trending patterns
      try {
        const patternsResponse = await fetch('/api/patterns/trending');
        if (patternsResponse.ok) {
          const patternsData = await patternsResponse.json();
          setTrendingPatterns(patternsData);
        }
      } catch (patternsError) {
        console.error('Failed to refresh trending patterns:', patternsError);
      }
      
      // Refresh timeline data if we have a current account
      if (currentAccount?.address) {
        await getTimeline(currentAccount.address);
      }
      
      // Enhanced Lens client will handle cache invalidation
    } catch (error) {
      handleError(error);
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [lensClient, handleError]);
  
  const clearError = useCallback(() => {
    setError(null);
    setErrorType(null);
  }, []);
  
  const invalidateCache = useCallback((key?: string) => {
    // The enhanced client handles cache invalidation internally
    console.log('Manual cache invalidation requested:', key || 'all');
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
    errorType,
    
    // Authentication actions
    authenticate: async () => {
      const tokens = await authenticate();
      return;
    },
    logout,
    refreshAuth,
    
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
    invalidateCache,
  };
};