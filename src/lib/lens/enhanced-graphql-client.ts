/**
 * Enhanced Lens Protocol GraphQL Client
 * 
 * Adds error handling, retries, and caching to the Lens GraphQL client
 */

import { config } from '@/config/environment';
import { 
  LensApiError, 
  LensAuthenticationError,
  LensRateLimitError,
  LensContentValidationError 
} from './errors';
import { withRetry } from '../utils/retry-utils';
import { getLensCache } from './lens-cache';
import type { 
  LensAccount, 
  LensTimelineResponse, 
  LensFollowersResponse 
} from './types';

// Lens Protocol GraphQL endpoint
const LENS_API_URL = config.lens.apiUrl || 'https://api-v2-mumbai.lens.dev';

// Default retry options for GraphQL requests
const DEFAULT_RETRY_OPTIONS = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  backoffFactor: 2,
  onRetry: (attempt: number, error: Error) => {
    console.warn(`Retrying Lens GraphQL request (attempt ${attempt}): ${error.message}`);
  }
};

/**
 * Enhanced GraphQL client for Lens Protocol
 */
export class EnhancedGraphQLClient {
  private apiUrl: string;
  private accessToken: string | null = null;
  private lensCache = getLensCache();

  constructor(apiUrl: string = LENS_API_URL) {
    this.apiUrl = apiUrl;
  }

  /**
   * Set authentication token and cache it
   */
  setAccessToken(token: string) {
    this.accessToken = token;
    this.lensCache.cacheAccessToken(token);
  }

  /**
   * Make GraphQL request to Lens API with retry and error handling
   */
  private async makeGraphQLRequest<T>(
    query: string,
    variables: Record<string, any> = {},
    requireAuth: boolean = false
  ): Promise<T> {
    return withRetry(async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (requireAuth) {
        if (!this.accessToken) {
          // Try to get from cache first
          const cachedToken = this.lensCache.getAccessToken();
          if (cachedToken) {
            this.accessToken = cachedToken;
          } else {
            throw new LensAuthenticationError('Authentication required for this operation');
          }
        }
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query,
            variables,
          }),
        });

        // Handle HTTP errors
        if (!response.ok) {
          if (response.status === 429) {
            // Rate limiting
            const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
            throw new LensRateLimitError(
              `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
              retryAfter
            );
          }
          
          if (response.status === 401 || response.status === 403) {
            throw new LensAuthenticationError(`Authentication error: ${response.statusText}`);
          }
          
          throw new LensApiError(
            `GraphQL request failed: ${response.status} ${response.statusText}`,
            response.status
          );
        }

        const result = await response.json();

        // Handle GraphQL errors
        if (result.errors) {
          const errorMessage = result.errors.map((e: any) => e.message).join(', ');
          
          // Check for specific error types
          const firstError = result.errors[0];
          
          if (firstError.message.includes('validation')) {
            throw new LensContentValidationError(
              firstError.extensions?.field || 'unknown',
              errorMessage,
              { errors: result.errors }
            );
          }
          
          if (firstError.message.includes('authenticate') || firstError.message.includes('unauthorized')) {
            throw new LensAuthenticationError(errorMessage, { errors: result.errors });
          }
          
          throw new LensApiError(errorMessage, undefined, { errors: result.errors });
        }

        return result.data;
      } catch (error) {
        // Re-throw LensErrors directly
        if (error instanceof LensApiError || 
            error instanceof LensAuthenticationError || 
            error instanceof LensRateLimitError || 
            error instanceof LensContentValidationError) {
          throw error;
        }
        
        // Wrap other errors
        throw new LensApiError(
          `GraphQL request failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }, DEFAULT_RETRY_OPTIONS);
  }

  /**
   * Generate authentication challenge
   */
  async generateChallenge(accountAddress: string, ownerAddress: string): Promise<{
    id: string;
    text: string;
  }> {
    const query = `
      mutation Challenge($request: ChallengeRequest!) {
        challenge(request: $request) {
          id
          text
        }
      }
    `;

    const variables = {
      request: {
        accountOwner: {
          app: config.lens.appAddress,
          account: accountAddress,
          owner: ownerAddress,
        },
      },
    };

    const result = await this.makeGraphQLRequest<{ challenge: { id: string; text: string } }>(
      query,
      variables
    );

    return result.challenge;
  }

  /**
   * Authenticate with signed challenge
   */
  async authenticate(challengeId: string, signature: string): Promise<{
    accessToken: string;
    refreshToken: string;
    idToken: string;
  }> {
    const query = `
      mutation Authenticate($request: SignedAuthChallenge!) {
        authenticate(request: $request) {
          accessToken
          refreshToken
          idToken
        }
      }
    `;

    const variables = {
      request: {
        id: challengeId,
        signature,
      },
    };

    const result = await this.makeGraphQLRequest<{
      authenticate: {
        accessToken: string;
        refreshToken: string;
        idToken: string;
      };
    }>(query, variables);

    // Store and cache access token for future requests
    this.setAccessToken(result.authenticate.accessToken);

    return result.authenticate;
  }

  /**
   * Get current authenticated session
   */
  async getCurrentSession(): Promise<{
    signer: string;
    name?: string;
    username?: string;
  } | null> {
    if (!this.accessToken) {
      return null;
    }

    const query = `
      query CurrentSession {
        currentSession {
          signer
          account {
            address
            metadata {
              name
            }
            username {
              value
            }
          }
        }
      }
    `;

    try {
      const result = await this.makeGraphQLRequest<{
        currentSession: {
          signer: string;
          account: {
            address: string;
            metadata?: { name?: string };
            username?: { value: string };
          };
        };
      }>(query, {}, true);

      return {
        signer: result.currentSession.signer,
        name: result.currentSession.account.metadata?.name,
        username: result.currentSession.account.username?.value,
      };
    } catch (error) {
      console.error('Failed to get current session:', error);
      return null;
    }
  }

  /**
   * Get available accounts for a wallet address with caching
   */
  async getAvailableAccounts(walletAddress: string): Promise<LensAccount[]> {
    const query = `
      query AccountsAvailable($request: AccountsAvailableRequest!) {
        accountsAvailable(request: $request) {
          items {
            account {
              address
              username {
                value
              }
              metadata {
                name
                picture
              }
            }
          }
        }
      }
    `;

    const variables = {
      request: {
        managedBy: walletAddress,
        includeOwned: true,
      },
    };

    try {
      const result = await this.makeGraphQLRequest<{
        accountsAvailable: {
          items: Array<{
            account: {
              address: string;
              username?: { value: string };
              metadata?: {
                name?: string;
                picture?: string;
              };
            };
          }>;
        };
      }>(query, variables);

      const accounts = result.accountsAvailable.items.map((item) => ({
        address: item.account.address,
        username: item.account.username?.value,
        name: item.account.metadata?.name,
        picture: item.account.metadata?.picture,
      }));
      
      // Cache each account profile
      accounts.forEach(account => {
        this.lensCache.cacheProfile(account.address, account);
      });
      
      return accounts;
    } catch (error) {
      console.error('Failed to get available accounts:', error);
      return [];
    }
  }

  /**
   * Create a post with error handling
   */
  async createPost(contentUri: string, options?: {
    commentOn?: string;
    quoteOf?: string;
    feed?: string;
  }): Promise<{ hash: string }> {
    const query = `
      mutation Post($request: PostRequest!) {
        post(request: $request) {
          ... on PostResponse {
            hash
          }
          ... on PostOperationValidationFailed {
            reason
          }
          ... on TransactionWillFail {
            reason
          }
        }
      }
    `;

    const request: any = {
      contentUri,
    };

    if (options?.commentOn) {
      request.commentOn = options.commentOn;
    }

    if (options?.quoteOf) {
      request.quoteOf = options.quoteOf;
    }

    if (options?.feed) {
      request.feed = options.feed;
    }

    const variables = { request };

    const result = await this.makeGraphQLRequest<{
      post: { hash?: string; reason?: string };
    }>(query, variables, true);

    if (result.post.reason) {
      throw new LensContentValidationError(
        'post',
        `Post creation failed: ${result.post.reason}`,
        { request }
      );
    }

    if (!result.post.hash) {
      throw new LensApiError('Post creation failed: No hash returned');
    }

    // Invalidate timeline cache after creating a post
    if (this.accessToken) {
      const session = await this.getCurrentSession();
      if (session) {
        this.lensCache.invalidateTimeline(session.signer);
      }
    }

    return { hash: result.post.hash };
  }

  /**
   * Follow an account with error handling
   */
  async followAccount(accountAddress: string, graph?: string): Promise<{ hash: string }> {
    const query = `
      mutation Follow($request: FollowRequest!) {
        follow(request: $request) {
          ... on FollowResponse {
            hash
          }
          ... on AccountFollowOperationValidationFailed {
            reason
          }
          ... on TransactionWillFail {
            reason
          }
        }
      }
    `;

    const request: any = {
      account: accountAddress,
    };

    if (graph) {
      request.graph = graph;
    }

    const variables = { request };

    const result = await this.makeGraphQLRequest<{
      follow: { hash?: string; reason?: string };
    }>(query, variables, true);

    if (result.follow.reason) {
      throw new LensContentValidationError(
        'follow',
        `Follow failed: ${result.follow.reason}`,
        { accountAddress }
      );
    }

    if (!result.follow.hash) {
      throw new LensApiError('Follow failed: No hash returned');
    }

    // Invalidate social graph caches after following
    if (this.accessToken) {
      const session = await this.getCurrentSession();
      if (session) {
        this.lensCache.invalidateFollowing(session.signer);
      }
    }

    return { hash: result.follow.hash };
  }

  /**
   * Unfollow an account with error handling
   */
  async unfollowAccount(accountAddress: string, graph?: string): Promise<{ hash: string }> {
    const query = `
      mutation Unfollow($request: UnfollowRequest!) {
        unfollow(request: $request) {
          ... on UnfollowResponse {
            hash
          }
          ... on AccountFollowOperationValidationFailed {
            reason
          }
          ... on TransactionWillFail {
            reason
          }
        }
      }
    `;

    const request: any = {
      account: accountAddress,
    };

    if (graph) {
      request.graph = graph;
    }

    const variables = { request };

    const result = await this.makeGraphQLRequest<{
      unfollow: { hash?: string; reason?: string };
    }>(query, variables, true);

    if (result.unfollow.reason) {
      throw new LensContentValidationError(
        'unfollow',
        `Unfollow failed: ${result.unfollow.reason}`,
        { accountAddress }
      );
    }

    if (!result.unfollow.hash) {
      throw new LensApiError('Unfollow failed: No hash returned');
    }

    // Invalidate social graph caches after unfollowing
    if (this.accessToken) {
      const session = await this.getCurrentSession();
      if (session) {
        this.lensCache.invalidateFollowing(session.signer);
      }
    }

    return { hash: result.unfollow.hash };
  }

  /**
   * Get followers of an account with caching
   */
  async getFollowers(
    accountAddress: string, 
    options: {
      limit?: number;
      cursor?: string;
      graph?: string;
    } = {}
  ): Promise<LensFollowersResponse> {
    // Check cache first if we don't have a cursor (first page)
    if (!options.cursor) {
      const cached = this.lensCache.getFollowers(accountAddress);
      if (cached) {
        return {
          items: cached.data,
          pageInfo: { next: undefined, prev: undefined }
        };
      }
    }

    const query = `
      query Followers($request: FollowersRequest!) {
        followers(request: $request) {
          items {
            address
            username {
              value
            }
            metadata {
              name
              picture
            }
          }
          pageInfo {
            prev
            next
          }
        }
      }
    `;

    const request: any = {
      account: accountAddress,
    };

    if (options.limit) {
      request.limit = options.limit;
    }

    if (options.cursor) {
      request.cursor = options.cursor;
    }

    if (options.graph) {
      request.filter = {
        graphs: [{ graph: options.graph }],
      };
    }

    const variables = { request };

    try {
      const result = await this.makeGraphQLRequest<{
        followers: {
          items: Array<{
            address: string;
            username?: { value: string };
            metadata?: {
              name?: string;
              picture?: string;
            };
          }>;
          pageInfo: {
            prev?: string;
            next?: string;
          };
        };
      }>(query, variables);

      const followers = {
        items: result.followers.items.map((item) => ({
          address: item.address,
          username: item.username?.value,
          name: item.metadata?.name,
          picture: item.metadata?.picture,
        })),
        pageInfo: result.followers.pageInfo,
      };
      
      // Cache followers data (only if it's the first page)
      if (!options.cursor) {
        this.lensCache.cacheFollowers(accountAddress, followers.items);
      }
      
      return followers;
    } catch (error) {
      console.error('Failed to get followers:', error);
      throw error;
    }
  }

  /**
   * Get accounts that an account is following with caching
   */
  async getFollowing(
    accountAddress: string, 
    options: {
      limit?: number;
      cursor?: string;
      graph?: string;
    } = {}
  ): Promise<LensFollowersResponse> {
    // Check cache first if we don't have a cursor (first page)
    if (!options.cursor) {
      const cached = this.lensCache.getFollowing(accountAddress);
      if (cached) {
        return {
          items: cached.data,
          pageInfo: { next: undefined, prev: undefined }
        };
      }
    }

    const query = `
      query Following($request: FollowingRequest!) {
        following(request: $request) {
          items {
            address
            username {
              value
            }
            metadata {
              name
              picture
            }
          }
          pageInfo {
            prev
            next
          }
        }
      }
    `;

    const request: any = {
      account: accountAddress,
    };

    if (options.limit) {
      request.limit = options.limit;
    }

    if (options.cursor) {
      request.cursor = options.cursor;
    }

    if (options.graph) {
      request.filter = {
        graphs: [{ graph: options.graph }],
      };
    }

    const variables = { request };

    try {
      const result = await this.makeGraphQLRequest<{
        following: {
          items: Array<{
            address: string;
            username?: { value: string };
            metadata?: {
              name?: string;
              picture?: string;
            };
          }>;
          pageInfo: {
            prev?: string;
            next?: string;
          };
        };
      }>(query, variables);

      const following = {
        items: result.following.items.map((item) => ({
          address: item.address,
          username: item.username?.value,
          name: item.metadata?.name,
          picture: item.metadata?.picture,
        })),
        pageInfo: result.following.pageInfo,
      };
      
      // Cache following data (only if it's the first page)
      if (!options.cursor) {
        this.lensCache.cacheFollowing(accountAddress, following.items);
      }
      
      return following;
    } catch (error) {
      console.error('Failed to get following:', error);
      throw error;
    }
  }

  /**
   * Get timeline/feed posts with caching
   */
  async getTimeline(
    accountAddress: string, 
    options: {
      limit?: number;
      cursor?: string;
      filter?: any;
    } = {}
  ): Promise<LensTimelineResponse> {
    // Check cache first if we don't have a cursor (first page)
    if (!options.cursor) {
      const cached = this.lensCache.getTimeline(accountAddress, options);
      if (cached) {
        return {
          items: cached.data.map(post => ({
            id: post.id,
            content: post.content,
            author: post.author,
            createdAt: post.timestamp
          })),
          pageInfo: { next: undefined, prev: undefined }
        };
      }
    }

    const query = `
      query Timeline($request: TimelineRequest!) {
        timeline(request: $request) {
          items {
            id
            metadata {
              content
            }
            author {
              address
              username {
                value
              }
              metadata {
                name
              }
            }
            createdAt
          }
          pageInfo {
            prev
            next
          }
        }
      }
    `;

    const request: any = {
      account: accountAddress,
    };

    if (options.limit) {
      request.limit = options.limit;
    }

    if (options.cursor) {
      request.cursor = options.cursor;
    }

    if (options.filter) {
      request.filter = options.filter;
    }

    const variables = { request };

    try {
      const result = await this.makeGraphQLRequest<{
        timeline: {
          items: Array<{
            id: string;
            metadata: { content: string };
            author: {
              address: string;
              username?: { value: string };
              metadata?: { name?: string };
            };
            createdAt: string;
          }>;
          pageInfo: {
            prev?: string;
            next?: string;
          };
        };
      }>(query, variables, true);

      // Map GraphQL response to our format
      const timelineItems = result.timeline.items.map((item) => ({
        id: item.id,
        content: item.metadata.content,
        author: {
          address: item.author.address,
          username: item.author.username?.value,
          name: item.author.metadata?.name,
        },
        createdAt: item.createdAt,
      }));
      
      // Convert to SocialPost type for caching
      const socialPosts = timelineItems.map(item => ({
        id: item.id,
        content: item.content,
        author: item.author,
        timestamp: item.createdAt,
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0
        }
      }));
      
      const timeline = {
        items: timelineItems,
        pageInfo: result.timeline.pageInfo,
      };
      
      // Cache timeline data (only if it's the first page)
      if (!options.cursor) {
        this.lensCache.cacheTimeline(accountAddress, socialPosts, options);
      }
      
      return timeline;
    } catch (error) {
      console.error('Failed to get timeline:', error);
      throw error;
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    idToken: string;
  }> {
    const query = `
      mutation Refresh($request: RefreshRequest!) {
        refresh(request: $request) {
          accessToken
          refreshToken
          idToken
        }
      }
    `;

    const variables = {
      request: {
        refreshToken,
      },
    };

    const result = await this.makeGraphQLRequest<{
      refresh: {
        accessToken: string;
        refreshToken: string;
        idToken: string;
      };
    }>(query, variables);

    // Update stored access token
    this.setAccessToken(result.refresh.accessToken);

    return result.refresh;
  }

  /**
   * Revoke authentication
   */
  async revokeAuthentication(authenticationId?: string): Promise<void> {
    const query = `
      mutation RevokeAuthentication($request: RevokeAuthenticationRequest!) {
        revokeAuthentication(request: $request)
      }
    `;

    const variables = {
      request: authenticationId ? { authenticationId } : {},
    };

    await this.makeGraphQLRequest(query, variables, true);

    // Clear stored access token
    this.accessToken = null;
    this.lensCache.clearAll();
  }
}

export default EnhancedGraphQLClient;