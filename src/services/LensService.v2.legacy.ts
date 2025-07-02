import { textOnly } from "@lens-protocol/metadata";
import { 
  LensClient,
  development
} from "@lens-protocol/client";
import { lensClient } from "@/lib/lens/client";
import { storageClient } from "@/lib/lens/storage";
import type { WalletClient } from 'viem';

export interface BreathingSessionData {
  patternName: string;
  duration: number; // in seconds
  score: number; // 0-100
  flowNFTId?: string;
  cycles?: number;
  breathHoldTime?: number;
}

export interface LensProfile {
  address: string;
  username?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  followersCount: number;
  followingCount: number;
}

export class LensService {
  private sessionClient: any = null;
  private currentAccount: any = null;

  async authenticate(walletClient: WalletClient, appAddress: string): Promise<any> {
    try {
      const address = await walletClient.getAddress();
      
      // For now, create a mock session client for development
      this.sessionClient = {
        address,
        isAuthenticated: true,
        post: async (data: any) => ({ isErr: () => false, value: { txHash: '0xmock' } }),
        follow: async (data: any) => ({ isErr: () => false, value: { txHash: '0xmock' } }),
        unfollow: async (data: any) => ({ isErr: () => false, value: { txHash: '0xmock' } }),
      };
      
      return this.sessionClient;
    } catch (error) {
      console.error('Lens authentication error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.sessionClient = null;
  }

  async publishBreathingSession(sessionData: BreathingSessionData): Promise<string> {
    if (!this.sessionClient) {
      throw new Error('Must be authenticated to publish session');
    }

    try {
      // Create post metadata
      const metadata = textOnly({
        content: this.formatSessionContent(sessionData),
        tags: ['breathing', 'wellness', 'mindfulness', 'imperfectbreath'],
      });

      // Upload metadata to Grove storage
      const { uri: metadataUri } = await storageClient.uploadAsJson(metadata);

      // Create the post using the session client
      const result = await this.sessionClient.post({
        contentUri: metadataUri,
      });

      if (result.isErr()) {
        throw new Error(`Failed to create post: ${result.error.message}`);
      }

      return result.value.txHash;
    } catch (error) {
      console.error('Failed to publish breathing session:', error);
      throw error;
    }
  }

  async followAccount(accountAddress: string): Promise<string> {
    if (!this.sessionClient) {
      throw new Error('Must be authenticated to follow accounts');
    }

    try {
      const result = await this.sessionClient.follow({
        account: accountAddress,
      });

      if (result.isErr()) {
        throw new Error(`Failed to follow account: ${result.error.message}`);
      }

      return result.value.txHash;
    } catch (error) {
      console.error('Failed to follow account:', error);
      throw error;
    }
  }

  async unfollowAccount(accountAddress: string): Promise<string> {
    if (!this.sessionClient) {
      throw new Error('Must be authenticated to unfollow accounts');
    }

    try {
      const result = await this.sessionClient.unfollow({
        account: accountAddress,
      });

      if (result.isErr()) {
        throw new Error(`Failed to unfollow account: ${result.error.message}`);
      }

      return result.value.txHash;
    } catch (error) {
      console.error('Failed to unfollow account:', error);
      throw error;
    }
  }

  private formatSessionContent(sessionData: BreathingSessionData): string {
    const duration = Math.round(sessionData.duration / 60);
    const durationText = duration === 1 ? '1 minute' : `${duration} minutes`;
    
    let content = `Just completed a ${sessionData.patternName} breathing session! 🌬️\n\n`;
    content += `⏱️ Duration: ${durationText}\n`;
    content += `📊 Score: ${sessionData.score}/100\n`;
    
    if (sessionData.cycles) {
      content += `🔄 Cycles: ${sessionData.cycles}\n`;
    }
    
    if (sessionData.breathHoldTime) {
      content += `💨 Breath Hold: ${sessionData.breathHoldTime}s\n`;
    }
    
    if (sessionData.flowNFTId) {
      content += `\n🎨 Pattern NFT: ${sessionData.flowNFTId}\n`;
    }
    
    content += `\n#BreathingPractice #Wellness #Mindfulness #ImperfectBreath`;
    
    return content;
  }

  isAuthenticated(): boolean {
    return this.sessionClient !== null;
  }

  getSessionClient(): any {
    return this.sessionClient;
  }
}

// Singleton instance
export const lensService = new LensService();