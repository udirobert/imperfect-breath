/**
 * @deprecated This hook/client is deprecated. Use useStory() from '@/hooks/useStoryConsolidated' instead.
 * This file will be removed in a future version.
 */

import { StoryClient, StoryConfig } from "@story-protocol/core-sdk";
import { http } from "viem";
import { privateKeyToAccount, Address } from "viem/accounts";

// Story Protocol configuration for testnet
const config: StoryConfig = {
  transport: http("https://aeneid.storyrpc.io"), // Story testnet RPC
  chainId: "aeneid", // Story testnet chain ID
};

// Initialize a global client instance
const storyClient: StoryClient | null = null;
// export const storyClient = StoryClient.newClient(config); // Removed - causes error without account

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
          {
            trait_type: "Breath Hold Time",
            value: sessionData.breathHoldTime.toString(),
          },
          {
            trait_type: "Restlessness Score",
            value: sessionData.restlessnessScore.toString(),
          },
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
  async attachLicenseTerms(
    ipId: string,
    licenseTermsId: string,
  ): Promise<void> {
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

// Demo functions for hackathon - showcases Story Protocol integration without wallet
export const demoStoryIntegration = {
  // Simulate breathing pattern IP registration
  async registerPatternDemo(pattern: {
    id?: string;
    name: string;
    description: string;
    creator: string;
    category?: string;
  }): Promise<string> {
    console.log(
      "🎯 STORY PROTOCOL DEMO: Registering breathing pattern as IP Asset",
    );
    console.log("📋 Pattern Details:", {
      name: pattern.name,
      description: pattern.description,
      phases: pattern.phases?.length || 0,
      creator: pattern.creator,
      category: pattern.category,
    });

    // Show what the real Story SDK call would look like
    console.log("🔗 Story SDK Call (Demo):");
    console.log("storyClient.ipAsset.register({");
    console.log("  nftContract: '0x...', // NFT contract address");
    console.log("  tokenId: '" + pattern.id + "',");
    console.log("  metadata: {");
    console.log("    title: '" + pattern.name + "',");
    console.log("    description: '" + pattern.description + "',");
    console.log("    attributes: [");
    console.log("      { trait_type: 'Type', value: 'Breathing Pattern' },");
    console.log(
      "      { trait_type: 'Creator', value: '" + pattern.creator + "' },",
    );
    console.log(
      "      { trait_type: 'Category', value: '" +
        (pattern.category || "wellness") +
        "' }",
    );
    console.log("    ]");
    console.log("  }");
    console.log("})");

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockIpId = `ip_pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log("✅ IP Asset registered successfully!");
    console.log("📄 IP Asset ID:", mockIpId);
    console.log(
      "🔗 View on Story Protocol Explorer: https://explorer.story.foundation/ip/" +
        mockIpId,
    );

    return mockIpId;
  },

  // Simulate session data IP registration
  async registerSessionDemo(sessionData: {
    sessionId?: string;
    patternName: string;
    duration: number;
    breathHoldTime: number;
    restlessnessScore: number;
    timestamp: string;
  }): Promise<string> {
    console.log("🎯 STORY PROTOCOL DEMO: Registering session data as IP Asset");
    console.log("📊 Session Analytics:", {
      pattern: sessionData.patternName,
      duration: sessionData.duration + "s",
      breathHold: sessionData.breathHoldTime + "s",
      restlessness: sessionData.restlessnessScore + "/100",
      timestamp: sessionData.timestamp,
    });

    // Show what the real Story SDK call would look like
    console.log("🔗 Story SDK Call (Demo):");
    console.log("storyClient.ipAsset.register({");
    console.log("  nftContract: '0x...', // NFT contract address");
    console.log("  tokenId: '" + sessionData.sessionId + "',");
    console.log("  metadata: {");
    console.log(
      "    title: 'Breathing Session - " + sessionData.patternName + "',",
    );
    console.log(
      "    description: 'Wellness session with " +
        sessionData.duration +
        "s duration',",
    );
    console.log("    attributes: [");
    console.log("      { trait_type: 'Type', value: 'Session Data' },");
    console.log(
      "      { trait_type: 'Pattern', value: '" +
        sessionData.patternName +
        "' },",
    );
    console.log(
      "      { trait_type: 'Duration', value: '" +
        sessionData.duration +
        "' },",
    );
    console.log(
      "      { trait_type: 'Breath Hold', value: '" +
        sessionData.breathHoldTime +
        "' },",
    );
    console.log(
      "      { trait_type: 'Restlessness', value: '" +
        sessionData.restlessnessScore +
        "' }",
    );
    console.log("    ]");
    console.log("  }");
    console.log("})");

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockIpId = `ip_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log("✅ Session IP Asset registered successfully!");
    console.log("📄 IP Asset ID:", mockIpId);
    console.log(
      "🔗 View on Story Protocol Explorer: https://explorer.story.foundation/ip/" +
        mockIpId,
    );
    console.log(
      "💡 This creates a permanent, verifiable record of your wellness achievement!",
    );

    return mockIpId;
  },

  // Show licensing capabilities
  async attachLicenseDemo(ipId: string): Promise<void> {
    console.log("🎯 STORY PROTOCOL DEMO: Attaching license terms to IP Asset");
    console.log("📄 IP Asset ID:", ipId);
    console.log("🔗 Story SDK Call (Demo):");
    console.log("storyClient.license.attachLicenseTerms({");
    console.log("  ipId: '" + ipId + "',");
    console.log("  licenseTermsId: '1' // Default commercial license");
    console.log("})");

    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(
      "✅ License terms attached! Pattern can now be shared and monetized.",
    );
  },
};
