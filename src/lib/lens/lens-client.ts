/**
 * Lens Protocol Client Implementation
 * Production-ready implementation with real GraphQL API calls
 */

import LensGraphQLClient from './lens-graphql-client';
import { StorageClient } from '@lens-chain/storage-client';
import { lensChain } from '../publicClient';
import { immutable } from '@lens-chain/storage-client';
import { textOnly } from '@lens-protocol/metadata';
import { config } from '../../config/environment';

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

export interface BreathingSessionPost {
  patternName: string;
  duration: number;
  score: number;
  insights: string[];
  sessionId?: string;
  nftId?: string;
}

// Lens app addresses for authentication
// Get addresses from environment config
const LENS_APP_ADDRESSES = {
  testnet: config.lens.appAddress || '0xC75A89145d765c396fd75CbD16380Eb184Bd2ca7',
  mainnet: '0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE'
};

/**
 * Lens Breathing Client - Production Implementation
 */
export class LensBreathingClient {
  private isTestnet: boolean;
  private appAddress: string;
  private authTokens: LensAuthTokens | null = null;
  private currentAccount: LensAccount | null = null;
  private graphqlClient: LensGraphQLClient;
  private storageClient: StorageClient;

  constructor(isTestnet: boolean = true) {
    this.isTestnet = isTestnet;
    this.appAddress = isTestnet ? LENS_APP_ADDRESSES.testnet : LENS_APP_ADDRESSES.mainnet;
    
    // Initialize GraphQL client with updated V3 endpoints
    const apiUrl = isTestnet
      ? 'https://api.testnet.lens.xyz/graphql'
      : 'https://api.lens.xyz/graphql';
    this.graphqlClient = new LensGraphQLClient(apiUrl);
    
    // Initialize Grove storage client
    this.storageClient = StorageClient.create();
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
      console.error('Challenge generation failed:', error);
      throw error;
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
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated session
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
      }

      return this.currentAccount;
    } catch (error) {
      console.error('Session error:', error);
      return null;
    }
  }

  /**
   * List available accounts for a wallet address
   */
  async getAvailableAccounts(walletAddress: string): Promise<LensAccount[]> {
    try {
      const accounts = await this.graphqlClient.getAvailableAccounts(walletAddress);
      
      return accounts.map(account => ({
        address: account.address,
        username: account.username,
        name: account.name,
        picture: account.picture
      }));
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      throw error;
    }
  }

  /**
   * Create a post about a breathing session
   */
  async createBreathingSessionPost(sessionData: BreathingSessionPost): Promise<string> {
    if (!this.authTokens) {
      throw new Error('Not authenticated');
    }

    try {
      // Create post metadata using Lens metadata standards
      const content = this.formatBreathingSessionContent(sessionData);
      const metadata = textOnly({
        content,
        tags: ['breathing', 'wellness', 'meditation', 'imperfect-breath'],
        appId: 'imperfect-breath'
      });

      // Upload metadata to Grove
      const metadataUri = await this.uploadMetadata(metadata);

      // Create the post via Lens GraphQL API
      const result = await this.graphqlClient.createPost(metadataUri);

      return result.hash;
    } catch (error) {
      console.error('Post creation failed:', error);
      throw error;
    }
  }

  /**
   * Create a post sharing a breathing pattern NFT
   */
  async shareBreathingPattern(patternData: {
    name: string;
    description: string;
    nftId: string;
    contractAddress: string;
    imageUri?: string;
  }): Promise<string> {
    if (!this.authTokens) {
      throw new Error('Not authenticated');
    }

    try {
      const content = `Just minted a new breathing pattern NFT: "${patternData.name}"!\n\n${patternData.description}\n\nMinted on Flow blockchain with Imperfect Breath\n\n#BreathingNFT #Wellness #Flow #ImperfectBreath`;

      const metadata = textOnly({
        content,
        tags: ['breathing-pattern', 'nft', 'wellness', 'flow-blockchain'],
        appId: 'imperfect-breath'
      });

      const metadataUri = await this.uploadMetadata(metadata);

      const result = await this.graphqlClient.createPost(metadataUri);

      return result.hash;
    } catch (error) {
      console.error('Pattern sharing failed:', error);
      throw error;
    }
  }

  /**
   * Comment on a breathing session post
   */
  async commentOnPost(postId: string, comment: string): Promise<string> {
    if (!this.authTokens) {
      throw new Error('Not authenticated');
    }

    try {
      const metadata = textOnly({
        content: comment,
        tags: ['breathing', 'wellness', 'comment'],
        appId: 'imperfect-breath'
      });

      const metadataUri = await this.uploadMetadata(metadata);

      const result = await this.graphqlClient.createPost(metadataUri, {
        commentOn: postId
      });

      return result.hash;
    } catch (error) {
      console.error('Comment failed:', error);
      throw error;
    }
  }

  /**
   * Quote a breathing session post
   */
  async quotePost(postId: string, quoteText: string): Promise<string> {
    if (!this.authTokens) {
      throw new Error('Not authenticated');
    }

    try {
      const metadata = textOnly({
        content: quoteText,
        tags: ['breathing', 'wellness', 'quote'],
        appId: 'imperfect-breath'
      });

      const metadataUri = await this.uploadMetadata(metadata);

      const result = await this.graphqlClient.createPost(metadataUri, {
        quoteOf: postId
      });

      return result.hash;
    } catch (error) {
      console.error('Quote failed:', error);
      throw error;
    }
  }

  /**
   * Get user's timeline
   */
  async getTimeline(accountAddress: string, filters?: any) {
    if (!this.authTokens) {
      throw new Error('Not authenticated');
    }

    try {
      return await this.graphqlClient.getTimeline(accountAddress, {
        filter: filters,
        limit: 25
      });
    } catch (error) {
      console.error('Timeline fetch failed:', error);
      throw error;
    }
  }

  /**
   * Get timeline highlights (most engaging posts)
   */
  async getTimelineHighlights(accountAddress: string) {
    if (!this.authTokens) {
      throw new Error('Not authenticated');
    }

    try {
      return await this.graphqlClient.getTimeline(accountAddress, {
        filter: {
          metadata: {
            tags: { anyOf: ['breathing', 'wellness', 'meditation'] }
          }
        },
        limit: 10
      });
    } catch (error) {
      console.error('Highlights fetch failed:', error);
      throw error;
    }
  }

  /**
   * Follow an account
   */
  async followAccount(accountAddress: string): Promise<string> {
    if (!this.authTokens) {
      throw new Error('Not authenticated');
    }

    try {
      const result = await this.graphqlClient.followAccount(accountAddress);
      return result.hash;
    } catch (error) {
      console.error('Follow failed:', error);
      throw error;
    }
  }

  /**
   * Unfollow an account
   */
  async unfollowAccount(accountAddress: string): Promise<string> {
    if (!this.authTokens) {
      throw new Error('Not authenticated');
    }

    try {
      const result = await this.graphqlClient.unfollowAccount(accountAddress);
      return result.hash;
    } catch (error) {
      console.error('Unfollow failed:', error);
      throw error;
    }
  }

  /**
   * Get followers of an account
   */
  async getFollowers(accountAddress: string, options?: {
    limit?: number;
    cursor?: string;
  }) {
    try {
      return await this.graphqlClient.getFollowers(accountAddress, options);
    } catch (error) {
      console.error('Failed to get followers:', error);
      throw error;
    }
  }

  /**
   * Get accounts that an account is following
   */
  async getFollowing(accountAddress: string, options?: {
    limit?: number;
    cursor?: string;
  }) {
    try {
      return await this.graphqlClient.getFollowing(accountAddress, options);
    } catch (error) {
      console.error('Failed to get following:', error);
      throw error;
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshTokens(): Promise<LensAuthTokens> {
    if (!this.authTokens?.refreshToken) {
      throw new Error('No refresh token available');
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
      throw error;
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
    }
  }

  /**
   * Helper: Format breathing session content for social post
   */
  private formatBreathingSessionContent(sessionData: BreathingSessionPost): string {
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
   * Execute an action on a post (collect, like, etc.)
   */
  async executeAction(postId: string, actionType: 'collect' | 'like' | 'react', actionParams: any = {}): Promise<{hash: string}> {
    if (!this.authTokens) {
      throw new Error('Not authenticated');
    }

    try {
      // Prepare action parameters based on type
      let actionData: any = {};
      
      if (actionType === 'collect') {
        actionData = {
          collect: {
            fromBase: false,
            ...actionParams
          }
        };
      } else if (actionType === 'like') {
        actionData = {
          like: true
        };
      } else if (actionType === 'react') {
        actionData = {
          react: {
            reaction: actionParams.reaction || 'UPVOTE'
          }
        };
      }

      // Instead of directly calling the private method, we'll create a query and use the client
      // to make the request indirectly
      
      const query = `
      mutation ActOnPost($request: ActOnPostRequest!) {
        actOnPost(request: $request) {
          ... on RelaySuccess {
            txHash
          }
          ... on LensProfileManagerRelayError {
            reason
          }
        }
      }
      `;
      
      const variables = {
        request: {
          action: actionData,
          post: postId
        }
      };
      
      // Execute the action using our GraphQL client's existing methods
      const response = await fetch(this.graphqlClient.getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authTokens.accessToken}`
        },
        body: JSON.stringify({
          query,
          variables
        })
      });
      
      const resultData = await response.json();
      
      if (resultData.errors) {
        throw new Error(`Action failed: ${resultData.errors[0].message}`);
      }
      
      const result = resultData.data.actOnPost;
      
      if ('reason' in result) {
        throw new Error(`Action failed: ${result.reason}`);
      }
      
      return { hash: result.txHash };
    } catch (error) {
      console.error(`Failed to execute ${actionType} action:`, error);
      throw error;
    }
  }

  /**
   * Helper: Upload metadata to Grove storage
   */
  private async uploadMetadata(metadata: any): Promise<string> {
    try {
      // Use Grove storage for real metadata uploads
      const chainId = this.isTestnet ? lensChain.id : 1389; // 1389 is Lens Chain Mainnet
      const acl = immutable(chainId);
      
      const response = await this.storageClient.uploadAsJson(metadata, { acl });
      return response.uri;
    } catch (error) {
      console.error('Failed to upload metadata to Grove:', error);
      throw new Error(`Metadata upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
   * Get access token
   */
  async getAccessToken(): Promise<string> {
    if (!this.authTokens) {
      throw new Error('Not authenticated');
    }

    // Check if token is expired and refresh if needed
    // In a real implementation, you would check the expiration time
    
    return this.authTokens.accessToken;
  }
}

export default LensBreathingClient;