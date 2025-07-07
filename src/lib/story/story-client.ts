/**
 * DEPRECATED IMPLEMENTATION - FORWARDING LAYER
 * 
 * This file exists for backward compatibility and forwards to the consolidated client.
 * All new code should import from 'src/lib/story' directly.
 * 
 * @deprecated Use ConsolidatedStoryClient from 'src/lib/story' instead.
 */

// Import the consolidated client
import { ConsolidatedStoryClient } from './clients/consolidated-client';

// Re-export types needed for this class
import type { 
  StoryConfig, 
  IPRegistrationResult, 
  LicenseRegistrationResult, 
  DerivativeRegistrationResult,
  BreathingPatternIP,
  LicenseType,
  CommercialTerms,
  IPAsset
} from './types';

// Network configuration for backward compatibility
const STORY_NETWORKS = {
  testnet: {
    chainId: 1315,
    name: 'Story Aeneid Testnet',
    rpcUrl: 'https://aeneid.storyrpc.io',
    explorer: 'https://aeneid.explorer.story.foundation',
    spgNftContract: '0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc',
  },
  mainnet: {
    chainId: 1,
    name: 'Story Mainnet',
    rpcUrl: 'https://mainnet.storyrpc.io',
    explorer: 'https://explorer.story.foundation',
    spgNftContract: '0x98971c660ac20880b60F86Cc3113eBd979eb3aAE',
  }
};

/**
 * Story Protocol Client for Breathing Pattern IP Management
 * @deprecated Use ConsolidatedStoryClient from 'src/lib/story/index.ts' instead
 */
export class StoryBreathingClient {
  private client: ConsolidatedStoryClient;
  private isTestnet: boolean;
  private networkInfo: typeof STORY_NETWORKS.testnet | typeof STORY_NETWORKS.mainnet;

  constructor(isTestnet: boolean = true, privateKey?: string) {
    console.warn('[DEPRECATED] StoryBreathingClient is deprecated. Use ConsolidatedStoryClient from src/lib/story instead.');
    this.isTestnet = isTestnet;
    this.networkInfo = isTestnet ? STORY_NETWORKS.testnet : STORY_NETWORKS.mainnet;
    this.client = ConsolidatedStoryClient.getInstance(isTestnet, privateKey);
  }

  /**
   * Register breathing pattern as IP
   */
  async registerBreathingPatternIP(
    pattern: BreathingPatternIP,
    licenseType: LicenseType = 'nonCommercial',
    commercialTerms?: CommercialTerms
  ): Promise<IPRegistrationResult> {
    return this.client.registerBreathingPatternIP(pattern, licenseType, commercialTerms);
  }

  /**
   * Register derivative breathing pattern
   */
  async registerDerivativePattern(
    originalIpId: string,
    licenseTermsId: string,
    derivativePattern: BreathingPatternIP
  ): Promise<DerivativeRegistrationResult> {
    return this.client.registerDerivativePattern(originalIpId, licenseTermsId, derivativePattern);
  }

  /**
   * Create license terms
   */
  async createLicenseTerms(
    licenseType: LicenseType,
    commercialTerms?: CommercialTerms
  ): Promise<LicenseRegistrationResult> {
    return this.client.createLicenseTerms(licenseType, commercialTerms);
  }

  /**
   * Set license terms for an existing IP asset
   */
  async setIPLicenseTerms(
    ipId: string,
    terms: {
      commercialUse: boolean;
      derivativeWorks: boolean;
      attributionRequired: boolean;
      royaltyPercentage: number;
    }
  ): Promise<{
    success: boolean;
    licenseTermsId?: string;
    txHash?: string;
    error?: string;
  }> {
    return this.client.setIPLicenseTerms(ipId, {
      commercialUse: terms.commercialUse,
      derivativeWorks: terms.derivativeWorks,
      attributionRequired: terms.attributionRequired,
      royaltyPercent: terms.royaltyPercentage
    });
  }

  /**
   * Get IP asset information
   */
  async getIPAsset(ipId: string): Promise<IPAsset | null> {
    return this.client.getIPAsset(ipId);
  }

  /**
   * Upload data to Grove storage
   */
  async uploadToGrove(data: any): Promise<string> {
    return this.client.uploadToGrove(data);
  }

  /**
   * Generate hash for content
   */
  generateHash(content: string): string {
    return this.client.generateHash(content);
  }

  /**
   * Claim revenue from derivatives
   */
  async claimRevenue(ipId: string, childIpIds: string[]): Promise<{
    success: boolean;
    claimedTokens?: string;
    error?: string;
  }> {
    return this.client.claimRevenue(ipId, childIpIds);
  }

  /**
   * Check if client is ready
   */
  isReady(): boolean {
    return this.client.isReady();
  }

  /**
   * Get network configuration
   */
  get networkConfig() {
    return this.networkInfo;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    // Don't actually dispose the client, as it might be used by other instances
    console.log('StoryBreathingClient disposed');
  }
}

export default StoryBreathingClient;
