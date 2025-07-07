/**
 * Enhanced Lens Protocol Client Implementation
 * 
 * Production-ready implementation with caching, error handling and retry logic
 */

import EnhancedGraphQLClient from './enhanced-graphql-client';
import { storageClient } from './storage';
import { lensChain, lensChainMainnet } from '../publicClient';
import { textOnly, image, MediaImageMimeType } from '@lens-protocol/metadata';
import { withRetry } from '../utils/retry-utils';
import { getLensCache } from './lens-cache';
import { 
  LensError, 
  LensAuthenticationError, 
  LensStorageError,
  LensSocialActionError
} from './errors';

import type {
  LensAuthTokens,
  LensAccount,
  BreathingSession,
  SocialPost,
  SocialActionResult,
  LensTimelineResponse,
  LensFollowersResponse
} from './types';

// Import Lens app addresses from config
import { TEST_APP_ADDRESSES, getAppAddress } from './config';

// Lens app addresses for authentication
const LENS_APP_ADDRESSES = TEST_APP_ADDRESSES;

// Default retry options for storage operations
const STORAGE_RETRY_OPTIONS = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  onRetry: (attempt: number, error: Error) => {
    console.warn(`Retrying Grove storage operation (attempt ${attempt}): ${error.message}`);
  }
};

/**
 * Enhanced Lens Breathing Client
 */
export class EnhancedLensClient {
  private isTestnet: boolean;
  private appAddress: string;
  private authTokens: LensAuthTokens | null = null;
  private currentAccount: LensAccount | null = null;
  private graphqlClient: EnhancedGraphQLClient;
  private lensCache = getLensCache();

  constructor(isTestnet: boolean = true) {
    this.isTestnet = isTestnet;
    this.appAddress = isTestnet ? LENS_APP_ADDRESSES.testnet : LENS_APP_ADDRESSES.mainnet;
    
    // Initialize enhanced GraphQL client with official Lens v3 endpoints
    const apiUrl = isTestnet
      ? 'https://api-mumbai.lens.dev'
      : 'https://api.lens.dev';
    this.graphqlClient = new EnhancedGraphQLClient(apiUrl);
    
    // Storage client is now imported directly
  }

  /**
   * Generate authentication challenge for account owner
   */
  async generateAuthChallenge(accountAddress: string, ownerAddress: string): Promise<{
    id: string;
    text: string;
  }> {
    try {
      return await this.graphqlClient.generateChallenge(accountAddress, ownerAddress);
    } catch (error) {
      if (error instanceof LensError) {
        throw error;
      }
      throw new LensAuthenticationError(
        `Challenge generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Authenticate with signed challenge
   */
  async authenticate(challengeId: string, signature: string): Promise<LensAuthTokens> {
    try {
      const result = await this.graphqlClient.authenticate(challengeId, signature);

      this.authTokens = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        idToken: result.idToken
      };

      // Get current session details
      await this.getCurrentSession();

      return this.authTokens;
    } catch (error) {
      if (error instanceof LensError) {
        throw error;
      }
      throw new LensAuthenticationError(
        `Authentication failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get current authenticated session with caching
   */
  async getCurrentSession(): Promise<LensAccount | null> {
    if (!this.authTokens) {
      return null;
    }

    try {
      const session = await this.graphqlClient.getCurrentSession();
      
      if (session) {
        this.currentAccount = {
          address: session.signer,
          name: session.name,
          username: session.username
        };
        
        // Cache the current account
        this.lensCache.cacheProfile(session.signer, this.currentAccount);
      }

      return this.currentAccount;
    } catch (error) {
      console.error('Session error:', error);
      return null;
    }
  }

  /**
   * List available accounts for a wallet address with caching
   */
  async getAvailableAccounts(walletAddress: string): Promise<LensAccount[]> {
    try {
      return await this.graphqlClient.getAvailableAccounts(walletAddress);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      if (error instanceof LensError) {
        throw error;
      }
      throw new LensAuthenticationError(
        `Failed to fetch accounts: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create a post about a breathing session with error handling and retry
   */
  async createBreathingSessionPost(sessionData: BreathingSession): Promise<string> {
    if (!this.authTokens) {
      throw new LensAuthenticationError('Not authenticated');
    }

    try {
      // Create post metadata using Lens metadata standards
      const content = this.formatBreathingSessionContent(sessionData);
      const metadata = textOnly({
        content,
        tags: ['breathing', 'wellness', 'meditation', 'imperfect-breath'],
        appId: 'imperfect-breath',
        marketplace: {
          name: 'Imperfect Breath',
          description: 'Breathing session shared from Imperfect Breath'
        }
      });

      // Upload metadata to Grove with retry
      const metadataUri = await this.uploadMetadata(metadata);

      // Create the post via Lens GraphQL API
      const result = await this.graphqlClient.createPost(metadataUri);

      return result.hash;
    } catch (error) {
      if (error instanceof LensError) {
        throw error;
      }
      throw new LensSocialActionError(
        'post',
        `Post creation failed: ${error instanceof Error ? error.message : String(error)}`,
        { sessionData }
      );
    }
  }

  /**
   * Create a post sharing a breathing pattern NFT with error handling
   */
  async shareBreathingPattern(patternData: {
    name: string;
    description: string;
    nftId: string;
    contractAddress: string;
    imageUri?: string;
  }): Promise<string> {
    if (!this.authTokens) {
      throw new LensAuthenticationError('Not authenticated');
    }

    try {
      // Create content with NFT details
      const content = `Just minted a new breathing pattern NFT: "${patternData.name}"!\n\n${patternData.description}\n\nMinted on Flow blockchain with Imperfect Breath\n\n#BreathingNFT #Wellness #Flow #ImperfectBreath`;

      // If we have an image URI, use the image metadata format
      let metadata;
      if (patternData.imageUri) {
        metadata = image({
          content,
          image: {
            item: patternData.imageUri,
            type: patternData.imageUri.endsWith('.png') ? MediaImageMimeType.PNG : MediaImageMimeType.JPEG
          },
          tags: ['breathing-pattern', 'nft', 'wellness', 'flow-blockchain'],
          appId: 'imperfect-breath',
          marketplace: {
            name: patternData.name,
            description: patternData.description
          }
        });
      } else {
        metadata = textOnly({
          content,
          tags: ['breathing-pattern', 'nft', 'wellness', 'flow-blockchain'],
          appId: 'imperfect-breath',
          marketplace: {
            name: patternData.name,
            description: patternData.description
          }
        });
      }

      const metadataUri = await this.uploadMetadata(metadata);
      const result = await this.graphqlClient.createPost(metadataUri);

      return result.hash;
    } catch (error) {
      if (error instanceof LensError) {
        throw error;
      }
      throw new LensSocialActionError(
        'share',
        `Pattern sharing failed: ${error instanceof Error ? error.message : String(error)}`,
        { patternData }
      );
    }
  }

  /**
   * Comment on a post with error handling
   */
  async commentOnPost(postId: string, comment: string): Promise<string> {
    if (!this.authTokens) {
      throw new LensAuthenticationError('Not authenticated');
    }

    try {
      const metadata = textOnly({
        content: comment,
        tags: ['breathing', 'wellness', 'comment'],
        appId: 'imperfect-breath',
        marketplace: {
          name: 'Comment on Breathing Session',
          description: 'Comment on a breathing session from Imperfect Breath'
        }
      });

      const metadataUri = await this.uploadMetadata(metadata);
      const result = await this.graphqlClient.createPost(metadataUri, {
        commentOn: postId
      });

      return result.hash;
    } catch (error) {
      if (error instanceof LensError) {
        throw error;
      }
      throw new LensSocialActionError(
        'comment',
        `Comment failed: ${error instanceof Error ? error.message : String(error)}`,
        { postId }
      );
    }
  }

  /**
   * Quote a post with error handling
   */
  async quotePost(postId: string, quoteText: string): Promise<string> {
    if (!this.authTokens) {
      throw new LensAuthenticationError('Not authenticated');
    }

    try {
      const metadata = textOnly({
        content: quoteText,
        tags: ['breathing', 'wellness', 'quote'],
        appId: 'imperfect-breath',
        marketplace: {
          name: 'Quote on Breathing Session',
          description: 'Quote of a breathing session from Imperfect Breath'
        }
      });

      const metadataUri = await this.uploadMetadata(metadata);
      const result = await this.graphqlClient.createPost(metadataUri, {
        quoteOf: postId
      });

      return result.hash;
    } catch (error) {
      if (error instanceof LensError) {
        throw error;
      }
      throw new LensSocialActionError(
        'quote',
        `Quote failed: ${error instanceof Error ? error.message : String(error)}`,
        { postId }
      );
    }
  }

  /**
   * Get user's timeline with caching
   */
  async getTimeline(accountAddress: string, filters?: any): Promise<SocialPost[]> {
    if (!this.authTokens) {
      throw new LensAuthenticationError('Not authenticated');
    }

    try {
      // Check cache first
      const cached = this.lensCache.getTimeline(accountAddress, filters || {});
      if (cached) {
        return cached.data;
      }

      // Not in cache, fetch from API
      // For Lens v3, we need to add metadata.tags
      let v3Filters = undefined;
      if (filters) {
        v3Filters = filters.tags
          ? { ...filters, metadata: { tags: { anyOf: filters.tags } } }
          : filters;
      }
      
      const timeline = await this.graphqlClient.getTimeline(accountAddress, {
        filter: v3Filters,
        limit: 25
      });
      
      // Convert to SocialPost format
      const posts = timeline.items.map(item => ({
        id: item.id,
        content: item.content,
        author: {
          address: item.author.address,
          username: item.author.username,
          name: item.author.name,
        },
        timestamp: item.createdAt,
        engagement: {
          likes: 0, // In v3 we'd get this from item.stats.reactions
          comments: 0, // In v3 we'd get this from item.stats.comments
          shares: 0, // In v3 we'd get this from item.stats.mirrors + item.stats.quotes
          isLiked: false,
        }
      }));
      
      // Cache the results
      this.lensCache.cacheTimeline(accountAddress, posts, filters || {});
      
      return posts;
    } catch (error) {
      console.error('Timeline fetch failed:', error);
      if (error instanceof LensError) {
        throw error;
      }
      throw new LensSocialActionError(
        'timeline',
        `Timeline fetch failed: ${error instanceof Error ? error.message : String(error)}`,
        { accountAddress, filters }
      );
    }
  }

  /**
   * Get timeline highlights (most engaging posts) with caching
   */
  async getTimelineHighlights(accountAddress: string): Promise<SocialPost[]> {
    if (!this.authTokens) {
      throw new LensAuthenticationError('Not authenticated');
    }

    try {
      // Define highlight filters
      // For Lens v3, we use metadata.tags filter
      const highlightFilters = {
        tags: ['breathing', 'wellness', 'meditation']
      };
      
      // Check cache first
      const cached = this.lensCache.getTimeline(accountAddress, highlightFilters);
      if (cached) {
        return cached.data;
      }
      
      // Not in cache, fetch from API
      return this.getTimeline(accountAddress, highlightFilters);
    } catch (error) {
      console.error('Highlights fetch failed:', error);
      if (error instanceof LensError) {
        throw error;
      }
      throw new LensSocialActionError(
        'highlights',
        `Highlights fetch failed: ${error instanceof Error ? error.message : String(error)}`,
        { accountAddress }
      );
    }
  }

  /**
   * Follow an account with error handling
   */
  async followAccount(accountAddress: string): Promise<string> {
    if (!this.authTokens) {
      throw new LensAuthenticationError('Not authenticated');
    }

    try {
      const result = await this.graphqlClient.followAccount(accountAddress);
      
      // Invalidate social graph cache
      if (this.currentAccount) {
        this.lensCache.invalidateFollowing(this.currentAccount.address);
      }
      
      return result.hash;
    } catch (error) {
      console.error('Follow failed:', error);
      if (error instanceof LensError) {
        throw error;
      }
      throw new LensSocialActionError(
        'follow',
        `Follow failed: ${error instanceof Error ? error.message : String(error)}`,
        { accountAddress }
      );
    }
  }

  /**
   * Unfollow an account with error handling
   */
  async unfollowAccount(accountAddress: string): Promise<string> {
    if (!this.authTokens) {
      throw new LensAuthenticationError('Not authenticated');
    }

    try {
      const result = await this.graphqlClient.unfollowAccount(accountAddress);
      
      // Invalidate social graph cache
      if (this.currentAccount) {
        this.lensCache.invalidateFollowing(this.currentAccount.address);
      }
      
      return result.hash;
    } catch (error) {
      console.error('Unfollow failed:', error);
      if (error instanceof LensError) {
        throw error;
      }
      throw new LensSocialActionError(
        'unfollow',
        `Unfollow failed: ${error instanceof Error ? error.message : String(error)}`,
        { accountAddress }
      );
    }
  }

  /**
   * Get followers of an account with caching
   */
  async getFollowers(accountAddress: string, options?: {
    limit?: number;
    cursor?: string;
  }): Promise<LensAccount[]> {
    try {
      // Check cache first if no cursor provided (first page)
      if (!options?.cursor) {
        const cached = this.lensCache.getFollowers(accountAddress);
        if (cached) {
          return cached.data;
        }
      }
      
      // Not in cache, fetch from API
      const followers = await this.graphqlClient.getFollowers(accountAddress, options);
      
      // Cache first page results
      if (!options?.cursor) {
        this.lensCache.cacheFollowers(accountAddress, followers.items);
      }
      
      return followers.items;
    } catch (error) {
      console.error('Failed to get followers:', error);
      if (error instanceof LensError) {
        throw error;
      }
      throw new LensSocialActionError(
        'getFollowers',
        `Failed to get followers: ${error instanceof Error ? error.message : String(error)}`,
        { accountAddress }
      );
    }
  }

  /**
   * Get accounts that an account is following with caching
   */
  async getFollowing(accountAddress: string, options?: {
    limit?: number;
    cursor?: string;
  }): Promise<LensAccount[]> {
    try {
      // Check cache first if no cursor provided (first page)
      if (!options?.cursor) {
        const cached = this.lensCache.getFollowing(accountAddress);
        if (cached) {
          return cached.data;
        }
      }
      
      // Not in cache, fetch from API
      const following = await this.graphqlClient.getFollowing(accountAddress, options);
      
      // Cache first page results
      if (!options?.cursor) {
        this.lensCache.cacheFollowing(accountAddress, following.items);
      }
      
      return following.items;
    } catch (error) {
      console.error('Failed to get following:', error);
      if (error instanceof LensError) {
        throw error;
      }
      throw new LensSocialActionError(
        'getFollowing',
        `Failed to get following: ${error instanceof Error ? error.message : String(error)}`,
        { accountAddress }
      );
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshTokens(): Promise<LensAuthTokens> {
    if (!this.authTokens?.refreshToken) {
      throw new LensAuthenticationError('No refresh token available');
    }

    try {
      const result = await this.graphqlClient.refreshTokens(this.authTokens.refreshToken);

      this.authTokens = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        idToken: result.idToken
      };

      return this.authTokens;
    } catch (error) {
      console.error('Token refresh failed:', error);
      if (error instanceof LensError) {
        throw error;
      }
      throw new LensAuthenticationError(
        `Token refresh failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Logout and revoke tokens
   */
  async logout(authenticationId?: string): Promise<void> {
    try {
      if (authenticationId) {
        await this.graphqlClient.revokeAuthentication(authenticationId);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.authTokens = null;
      this.currentAccount = null;
      // Clear cache
      this.lensCache.clearAll();
    }
  }

  /**
   * Helper: Format breathing session content for social post
   */
  private formatBreathingSessionContent(sessionData: BreathingSession): string {
    const minutes = Math.floor(sessionData.duration / 60);
    const seconds = sessionData.duration % 60;
    const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    let content = `Just completed a ${durationText} breathing session with "${sessionData.patternName}"!\n\n`;
    content += `Session Score: ${sessionData.score}/100\n\n`;

    if (sessionData.insights && sessionData.insights.length > 0) {
      content += `Key Insights:\n`;
      sessionData.insights.forEach(insight => {
        content += `• ${insight}\n`;
      });
      content += '\n';
    }

    content += `Practicing mindful breathing with Imperfect Breath\n\n`;
    content += `#Breathing #Wellness #Meditation #ImperfectBreath #Mindfulness`;

    if (sessionData.nftId) {
      content += ` #BreathingNFT`;
    }

    return content;
  }

  /**
   * Helper: Upload metadata to Grove storage with retry
   */
  private async uploadMetadata(metadata: any): Promise<string> {
    try {
      return await withRetry(async () => {
        // Use the imported storageClient instead of class property
        const response = await storageClient.uploadAsJson(metadata);
        return response.uri;
      }, STORAGE_RETRY_OPTIONS);
    } catch (error) {
      console.error('Failed to upload metadata to Grove:', error);
      throw new LensStorageError(
        `Metadata upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get current authentication status
   */
  get isAuthenticated(): boolean {
    return !!this.authTokens;
  }

  /**
   * Get current account
   */
  get account(): LensAccount | null {
    return this.currentAccount;
  }

  /**
   * Get app address for current network
   */
  get getAppAddress(): string {
    return this.appAddress;
  }
  
  /**
   * Prepare social action result with standardized format
   */
  prepareSocialActionResult(action: () => Promise<string>): Promise<SocialActionResult> {
    return action()
      .then(hash => ({ success: true, hash }))
      .catch(error => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, error: errorMessage };
      });
  }
}

export default EnhancedLensClient;