import { StoryClient, StoryConfig } from "@story-protocol/core-sdk";
import { http } from "viem";
import { privateKeyToAccount, Address } from "viem/accounts";

// Story Protocol configuration for testnet
const config: StoryConfig = {
  transport: http("https://aeneid.storyrpc.io"), // Story testnet RPC
  chainId: "aeneid", // Story testnet chain ID
};

// Initialize Story client (without account for read operations)
export const storyClient = StoryClient.newClient(config);

// For write operations, we'll need to set up the account when user connects wallet
export const createStoryClientWithAccount = (privateKey: string) => {
  const account = privateKeyToAccount(`0x${privateKey}` as Address);
  const configWithAccount: StoryConfig = {
    ...config,
    account,
  };
  return StoryClient.newClient(configWithAccount);
};

// Types for IP registration
export interface BreathingPatternIP {
  id: string;
  name: string;
  description: string;
  phases: any[];
  creator: string;
  ipAssetId?: string;
  tokenId?: string;
}

export interface SessionDataIP {
  sessionId: string;
  patternName: string;
  duration: number;
  breathHoldTime: number;
  restlessnessScore: number;
  timestamp: string;
  ipAssetId?: string;
  tokenId?: string;
}

// Story Protocol IP registration service
export class StoryIPService {
  private client: any;

  constructor(client: any) {
    this.client = client;
  }

  // Register a custom breathing pattern as IP
  async registerBreathingPattern(pattern: BreathingPatternIP): Promise<string> {
    try {
      // Create metadata for the breathing pattern
      const metadata = {
        title: pattern.name,
        description: pattern.description,
        attributes: [
          { trait_type: "Type", value: "Breathing Pattern" },
          { trait_type: "Creator", value: pattern.creator },
          { trait_type: "Phases", value: pattern.phases.length.toString() },
          { trait_type: "Category", value: "Wellness" },
        ],
      };

      // Register as IP Asset
      const response = await this.client.ipAsset.register({
        nftContract: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || "0x...", // You'll need to deploy an NFT contract
        tokenId: pattern.id,
        metadata,
      });

      return response.ipId;
    } catch (error) {
      console.error("Failed to register breathing pattern as IP:", error);
      throw error;
    }
  }

  // Register session data as IP (for analytics/insights)
  async registerSessionData(sessionData: SessionDataIP): Promise<string> {
    try {
      const metadata = {
        title: `Breathing Session - ${sessionData.patternName}`,
        description: `Breathing session data with ${sessionData.duration}s duration and ${sessionData.restlessnessScore} restlessness score`,
        attributes: [
          { trait_type: "Type", value: "Session Data" },
          { trait_type: "Pattern", value: sessionData.patternName },
          { trait_type: "Duration", value: sessionData.duration.toString() },
          { trait_type: "Breath Hold Time", value: sessionData.breathHoldTime.toString() },
          { trait_type: "Restlessness Score", value: sessionData.restlessnessScore.toString() },
          { trait_type: "Timestamp", value: sessionData.timestamp },
        ],
      };

      const response = await this.client.ipAsset.register({
        nftContract: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || "0x...",
        tokenId: sessionData.sessionId,
        metadata,
      });

      return response.ipId;
    } catch (error) {
      console.error("Failed to register session data as IP:", error);
      throw error;
    }
  }

  // Attach licensing terms to IP
  async attachLicenseTerms(ipId: string, licenseTermsId: string): Promise<void> {
    try {
      await this.client.license.attachLicenseTerms({
        ipId,
        licenseTermsId,
      });
    } catch (error) {
      console.error("Failed to attach license terms:", error);
      throw error;
    }
  }

  // Mint license for IP usage
  async mintLicense(ipId: string, amount: number = 1): Promise<string> {
    try {
      const response = await this.client.license.mintLicenseTokens({
        licensorIpId: ipId,
        licenseTermsId: "1", // Default license terms
        amount,
      });
      return response.licenseTokenId;
    } catch (error) {
      console.error("Failed to mint license:", error);
      throw error;
    }
  }
}

// Utility functions for demo/hackathon purposes
export const demoStoryIntegration = {
  // Simulate IP registration for demo
  async registerPatternDemo(pattern: any): Promise<string> {
    console.log("🎯 Demo: Registering breathing pattern as IP on Story Protocol");
    console.log("Pattern:", pattern.name);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockIpId = `ip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log("✅ IP Asset registered with ID:", mockIpId);
    
    return mockIpId;
  },

  async registerSessionDemo(sessionData: any): Promise<string> {
    console.log("🎯 Demo: Registering session data as IP on Story Protocol");
    console.log("Session:", sessionData);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockIpId = `session_ip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log("✅ Session IP Asset registered with ID:", mockIpId);
    
    return mockIpId;
  }
};
