/**
 * Lens Protocol GraphQL Client
 * Real implementation using Lens Protocol v3 API
 */

import { config } from '@/config/environment';

// Lens Protocol GraphQL endpoint
const LENS_API_URL = config.lens.apiUrl || 'https://api-v2-mumbai.lens.dev';

// GraphQL client for Lens Protocol
export class LensGraphQLClient {
  private apiUrl: string;
  private accessToken: string | null = null;

  constructor(apiUrl: string = LENS_API_URL) {
    this.apiUrl = apiUrl;
  }

  /**
   * Set authentication token
   */
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Make GraphQL request to Lens API
   */
  private async makeGraphQLRequest<T>(
    query: string,
    variables: Record<string, any> = {},
    requireAuth: boolean = false
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requireAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
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

    // Store access token for future requests
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
   * Get available accounts for a wallet address
   */
  async getAvailableAccounts(walletAddress: string): Promise<Array<{
    address: string;
    username?: string;
    name?: string;
    picture?: string;
  }>> {
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

      return result.accountsAvailable.items.map((item) => ({
        address: item.account.address,
        username: item.account.username?.value,
        name: item.account.metadata?.name,
        picture: item.account.metadata?.picture,
      }));
    } catch (error) {
      console.error('Failed to get available accounts:', error);
      return [];
    }
  }

  /**
   * Create a post
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
      throw new Error(`Post creation failed: ${result.post.reason}`);
    }

    if (!result.post.hash) {
      throw new Error('Post creation failed: No hash returned');
    }

    return { hash: result.post.hash };
  }

  /**
   * Follow an account
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
      throw new Error(`Follow failed: ${result.follow.reason}`);
    }

    if (!result.follow.hash) {
      throw new Error('Follow failed: No hash returned');
    }

    return { hash: result.follow.hash };
  }

  /**
   * Unfollow an account
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
      throw new Error(`Unfollow failed: ${result.unfollow.reason}`);
    }

    if (!result.unfollow.hash) {
      throw new Error('Unfollow failed: No hash returned');
    }

    return { hash: result.unfollow.hash };
  }

  /**
   * Get followers of an account
   */
  async getFollowers(accountAddress: string, options?: {
    limit?: number;
    cursor?: string;
    graph?: string;
  }): Promise<{
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
  }> {
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

    if (options?.limit) {
      request.limit = options.limit;
    }

    if (options?.cursor) {
      request.cursor = options.cursor;
    }

    if (options?.graph) {
      request.filter = {
        graphs: [{ graph: options.graph }],
      };
    }

    const variables = { request };

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

    return {
      items: result.followers.items.map((item) => ({
        address: item.address,
        username: item.username?.value,
        name: item.metadata?.name,
        picture: item.metadata?.picture,
      })),
      pageInfo: result.followers.pageInfo,
    };
  }

  /**
   * Get accounts that an account is following
   */
  async getFollowing(accountAddress: string, options?: {
    limit?: number;
    cursor?: string;
    graph?: string;
  }): Promise<{
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
  }> {
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

    if (options?.limit) {
      request.limit = options.limit;
    }

    if (options?.cursor) {
      request.cursor = options.cursor;
    }

    if (options?.graph) {
      request.filter = {
        graphs: [{ graph: options.graph }],
      };
    }

    const variables = { request };

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

    return {
      items: result.following.items.map((item) => ({
        address: item.address,
        username: item.username?.value,
        name: item.metadata?.name,
        picture: item.metadata?.picture,
      })),
      pageInfo: result.following.pageInfo,
    };
  }

  /**
   * Get timeline/feed posts
   */
  async getTimeline(accountAddress: string, options?: {
    limit?: number;
    cursor?: string;
    filter?: any;
  }): Promise<{
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
  }> {
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

    if (options?.limit) {
      request.limit = options.limit;
    }

    if (options?.cursor) {
      request.cursor = options.cursor;
    }

    if (options?.filter) {
      request.filter = options.filter;
    }

    const variables = { request };

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

    return {
      items: result.timeline.items.map((item) => ({
        id: item.id,
        content: item.metadata.content,
        author: {
          address: item.author.address,
          username: item.author.username?.value,
          name: item.author.metadata?.name,
        },
        createdAt: item.createdAt,
      })),
      pageInfo: result.timeline.pageInfo,
    };
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
  }
}

export default LensGraphQLClient;