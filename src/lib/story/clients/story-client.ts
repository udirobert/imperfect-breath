/**
 * COMPATIBILITY FILE - Use the consolidated-client.ts instead
 * This file is maintained for backward compatibility and will be removed in a future version
 */

import { ConsolidatedStoryClient as ActualClient } from './consolidated-client';
import type {
  StoryConfig,
  IPMetadata,
  LicenseTerms,
  BreathingPatternIP,
  IPRegistrationResult,
  LicenseRegistrationResult,
  DerivativeRegistrationResult,
  LicenseType,
  CommercialTerms,
  StoryError
} from '../types';

/**
 * Compatibility wrapper for the ConsolidatedStoryClient
 * This class simply forwards all calls to the main consolidated client implementation
 */
class CompatibilityStoryClient {
  private static instance: CompatibilityStoryClient | null = null;
  private delegate: ReturnType<typeof ActualClient.getInstance>; // Actual consolidated client instance

  private constructor(isTestnet: boolean = true, privateKey?: string) {
    console.warn("[DEPRECATED] Using compatibility wrapper for ConsolidatedStoryClient. Import from './consolidated-client' instead.");
    this.delegate = ActualClient.getInstance(isTestnet, privateKey);
  }

  /**
   * Singleton instance
   */
  static getInstance(isTestnet: boolean = true, privateKey?: string): CompatibilityStoryClient {
    if (!CompatibilityStoryClient.instance) {
      CompatibilityStoryClient.instance = new CompatibilityStoryClient(isTestnet, privateKey);
    }
    return CompatibilityStoryClient.instance;
  }

  /**
   * Initialize Story Protocol client
   */
  async initialize(config: Partial<StoryConfig> = {}): Promise<void> {
    return this.delegate.initialize(config);
  }

  /**
   * Register breathing pattern as IP
   */
  async registerBreathingPatternIP(
    pattern: BreathingPatternIP,
    licenseType: LicenseType = 'nonCommercial',
    commercialTerms?: CommercialTerms
  ): Promise<IPRegistrationResult> {
    return this.delegate.registerBreathingPatternIP(pattern, licenseType, commercialTerms);
  }

  /**
   * Register derivative breathing pattern
   */
  async registerDerivativePattern(
    originalIpId: string,
    licenseTermsId: string,
    derivativePattern: BreathingPatternIP
  ): Promise<DerivativeRegistrationResult> {
    return this.delegate.registerDerivativePattern(originalIpId, licenseTermsId, derivativePattern);
  }

  /**
   * Create license terms
   */
  async createLicenseTerms(
    licenseType: LicenseType,
    commercialTerms?: CommercialTerms
  ): Promise<LicenseRegistrationResult> {
    return this.delegate.createLicenseTerms(licenseType, commercialTerms);
  }

  /**
   * Upload data to Grove storage
   */
  async uploadToGrove(data: any): Promise<string> {
    return this.delegate.uploadToGrove(data);
  }

  /**
   * Generate hash for content
   */
  generateHash(content: string): string {
    return this.delegate.generateHash(content);
  }

  /**
   * Get IP asset information
   */
  async getIPAsset(ipId: string): Promise<any> {
    return this.delegate.getIPAsset(ipId);
  }

  /**
   * Set license terms for an existing IP asset
   */
  async setIPLicenseTerms(
    ipId: string,
    terms: {
      commercial: boolean;
      derivatives: boolean;
      attribution: boolean;
      royaltyPercentage: number;
    }
  ): Promise<{
    success: boolean;
    licenseTermsId?: string;
    txHash?: string;
    error?: string;
  }> {
    // Transform the legacy parameter format to the new format expected by the consolidated client
    return this.delegate.setIPLicenseTerms(ipId, {
      commercialUse: terms.commercial,
      derivativeWorks: terms.derivatives,
      attributionRequired: terms.attribution,
      royaltyPercent: terms.royaltyPercentage
    });
  }

  /**
   * Claim revenue from derivatives
   */
  async claimRevenue(ipId: string, childIpIds: string[]): Promise<{
    success: boolean;
    claimedTokens?: string;
    error?: string;
  }> {
    return this.delegate.claimRevenue(ipId, childIpIds);
  }

  /**
   * Check if client is initialized
   */
  isReady(): boolean {
    return this.delegate.isReady();
  }

  /**
   * Get network configuration
   */
  get networkConfig() {
    return this.delegate.network;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.delegate.dispose();
    CompatibilityStoryClient.instance = null;
  }

  /**
   * Create license terms for different types - forward to delegate
   */
  private createLicenseTermsForType(licenseType: LicenseType, commercialTerms?: CommercialTerms): LicenseTerms {
    // This is a bit of a hack since we can't directly access the private method
    // In reality, this should never be called directly as our public methods use the delegate
    throw new Error("Use the main ConsolidatedStoryClient implementation instead");
  }

  /**
   * Create standardized Story error
   */
  private createStoryError(code: string, message: string, originalError?: any): StoryError {
    // This is a bit of a hack since we can't directly access the private method
    // In reality, this should never be called directly as our public methods use the delegate
    throw new Error("Use the main ConsolidatedStoryClient implementation instead");
  }
}

// Export the compatibility client with the original name for backward compatibility
const ConsolidatedStoryClient = CompatibilityStoryClient;
export { ConsolidatedStoryClient };
export default CompatibilityStoryClient;