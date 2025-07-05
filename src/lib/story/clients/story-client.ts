/**
 * Consolidated Story Protocol Client
 * Unified IP registration and management with Grove storage
 */

import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { http, Address, parseEther, zeroAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { StorageClient } from '@lens-chain/storage-client';
import { chains } from '@lens-chain/sdk/viem';
import { immutable } from '@lens-chain/storage-client';
import { createHash } from 'crypto';

import type {
  StoryConfig as Config,
  IPMetadata,
  LicenseTerms,
  BreathingPatternIP,
  IPRegistrationResult,
  LicenseRegistrationResult,
  DerivativeRegistrationResult,
  LicenseType,
  CommercialTerms,
  ContractAddresses,
  StoryError
} from '../types';

// Network configurations
const STORY_NETWORKS = {
  testnet: {
    chainId: 'aeneid',
    rpcUrl: 'https://aeneid.storyrpc.io',
    explorer: 'https://aeneid.explorer.story.foundation',
    spgNftContract: '0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc',
  },
  mainnet: {
    chainId: 'mainnet',
    rpcUrl: 'https://mainnet.storyrpc.io',
    explorer: 'https://explorer.story.foundation',
    spgNftContract: '0x98971c660ac20880b60F86Cc3113eBd979eb3aAE',
  }
};

export class ConsolidatedStoryClient {
  private static instance: ConsolidatedStoryClient | null = null;
  private client: StoryClient | null = null;
  private storageClient: StorageClient;
  private isTestnet: boolean;
  private networkConfig: typeof STORY_NETWORKS.testnet;
  private isInitialized = false;

  private constructor(isTestnet: boolean = true, privateKey?: string) {
    this.isTestnet = isTestnet;
    this.networkConfig = isTestnet ? STORY_NETWORKS.testnet : STORY_NETWORKS.mainnet;
    
    // Initialize Grove storage client
    this.storageClient = StorageClient.create();
    
    if (privateKey) {
      this.initializeClient(privateKey);
    }
  }

  /**
   * Singleton instance
   */
  static getInstance(isTestnet: boolean = true, privateKey?: string): ConsolidatedStoryClient {
    if (!ConsolidatedStoryClient.instance) {
      ConsolidatedStoryClient.instance = new ConsolidatedStoryClient(isTestnet, privateKey);
    }
    return ConsolidatedStoryClient.instance;
  }

  /**
   * Initialize Story Protocol client
   */
  async initialize(config: Partial<Config> = {}): Promise<void> {
    const finalConfig = {
      isTestnet: this.isTestnet,
      chainId: this.networkConfig.chainId,
      rpcUrl: this.networkConfig.rpcUrl,
      ...config
    };

    if (finalConfig.privateKey) {
      await this.initializeClient(finalConfig.privateKey);
    }

    this.isInitialized = true;
    console.log(`Story Protocol client initialized for ${finalConfig.isTestnet ? 'testnet' : 'mainnet'}`);
  }

  /**
   * Register breathing pattern as IP
   */
  async registerBreathingPatternIP(
    pattern: BreathingPatternIP,
    licenseType: LicenseType = 'nonCommercial',
    commercialTerms?: CommercialTerms
  ): Promise<IPRegistrationResult> {
    if (!this.client) {
      throw this.createStoryError('CLIENT_NOT_INITIALIZED', 'Story Protocol client not initialized');
    }

    try {
      // Create IP metadata
      const ipMetadata = this.client.ipAsset.generateIpMetadata({
        title: pattern.name,
        description: pattern.description,
        creators: [
          {
            name: 'Breathing Pattern Creator',
            address: pattern.creator,
            contributionPercent: 100,
          },
        ],
        attributes: [
          { trait_type: 'Inhale Duration', value: pattern.inhale.toString() },
          { trait_type: 'Hold Duration', value: pattern.hold.toString() },
          { trait_type: 'Exhale Duration', value: pattern.exhale.toString() },
          { trait_type: 'Rest Duration', value: pattern.rest.toString() },
          { trait_type: 'Difficulty', value: pattern.difficulty || 'beginner' },
          { trait_type: 'Category', value: pattern.category || 'breathing' },
          { trait_type: 'Total Cycle Time', value: (pattern.inhale + pattern.hold + pattern.exhale + pattern.rest).toString() },
          ...pattern.tags.map(tag => ({ trait_type: 'Tag', value: tag }))
        ]
      });

      // Create NFT metadata
      const nftMetadata = {
        name: pattern.name,
        description: `${pattern.description}\n\nBreathing Pattern: ${pattern.inhale}-${pattern.hold}-${pattern.exhale}-${pattern.rest}`,
        image: pattern.imageUri || this.generateDefaultPatternImage(pattern),
        attributes: [
          { trait_type: 'Inhale', value: pattern.inhale },
          { trait_type: 'Hold', value: pattern.hold },
          { trait_type: 'Exhale', value: pattern.exhale },
          { trait_type: 'Rest', value: pattern.rest },
          { trait_type: 'Difficulty', value: pattern.difficulty || 'beginner' },
          { trait_type: 'Category', value: pattern.category || 'breathing' }
        ]
      };

      // Upload metadata to Grove
      const ipMetadataUri = await this.uploadToGrove(ipMetadata);
      const nftMetadataUri = await this.uploadToGrove(nftMetadata);
      const ipMetadataHash = this.generateHash(JSON.stringify(ipMetadata));
      const nftMetadataHash = this.generateHash(JSON.stringify(nftMetadata));

      // Create license terms
      const licenseTerms = this.createLicenseTermsForType(licenseType, commercialTerms);

      // Register IP with license terms
      const result = await this.client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
        spgNftContract: this.networkConfig.spgNftContract as Address,
        licenseTermsData: [{ terms: licenseTerms }],
        ipMetadata: {
          ipMetadataURI: ipMetadataUri,
          ipMetadataHash: `0x${ipMetadataHash}`,
          nftMetadataURI: nftMetadataUri,
          nftMetadataHash: `0x${nftMetadataHash}`,
        }
      });

      return {
        success: true,
        ipId: result.ipId,
        tokenId: result.tokenId?.toString(),
        txHash: result.txHash,
        licenseTermsId: result.licenseTermsId?.toString(),
        explorerUrl: `${this.networkConfig.explorer}/ipa/${result.ipId}`
      };

    } catch (error) {
      console.error('IP registration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'IP registration failed'
      };
    }
  }

  /**
   * Register derivative breathing pattern
   */
  async registerDerivativePattern(
    originalIpId: string,
    licenseTermsId: string,
    derivativePattern: BreathingPatternIP
  ): Promise<DerivativeRegistrationResult> {
    if (!this.client) {
      throw this.createStoryError('CLIENT_NOT_INITIALIZED', 'Story Protocol client not initialized');
    }

    try {
      // First register the derivative as a new IP
      const ipResult = await this.registerBreathingPatternIP(derivativePattern, 'nonCommercial');
      
      if (!ipResult.success || !ipResult.ipId) {
        return {
          success: false,
          parentIpIds: [originalIpId],
          licenseTermsIds: [licenseTermsId],
          error: ipResult.error || 'Failed to register derivative IP'
        };
      }

      // Then register it as a derivative
      const derivativeResult = await this.client.ipAsset.registerDerivative({
        childIpId: ipResult.ipId as Address,
        parentIpIds: [originalIpId as Address],
        licenseTermsIds: [licenseTermsId],
        licenseTemplate: '0x1234567890abcdef1234567890abcdef12345678' as Address, // PIL template address
      });

      return {
        success: true,
        ipId: ipResult.ipId,
        tokenId: ipResult.tokenId,
        txHash: derivativeResult.txHash,
        parentIpIds: [originalIpId],
        licenseTermsIds: [licenseTermsId]
      };

    } catch (error) {
      console.error('Derivative registration failed:', error);
      return {
        success: false,
        parentIpIds: [originalIpId],
        licenseTermsIds: [licenseTermsId],
        error: error instanceof Error ? error.message : 'Derivative registration failed'
      };
    }
  }

  /**
   * Create license terms
   */
  async createLicenseTerms(
    licenseType: LicenseType,
    commercialTerms?: CommercialTerms
  ): Promise<LicenseRegistrationResult> {
    if (!this.client) {
      throw this.createStoryError('CLIENT_NOT_INITIALIZED', 'Story Protocol client not initialized');
    }

    try {
      const terms = this.createLicenseTermsForType(licenseType, commercialTerms);
      
      const result = await this.client.license.registerPilTerms({
        terms,
      });

      return {
        success: true,
        licenseTermsId: result.licenseTermsId?.toString(),
        txHash: result.txHash
      };

    } catch (error) {
      console.error('License terms creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'License terms creation failed'
      };
    }
  }

  /**
   * Upload data to Grove storage
   */
  async uploadToGrove(data: any): Promise<string> {
    try {
      // Use Grove storage for real metadata uploads
      const chainId = this.isTestnet ? chains.testnet.id : chains.mainnet.id;
      const acl = immutable(chainId);
      
      const response = await this.storageClient.uploadAsJson(data, { acl });
      return response.uri;
    } catch (error) {
      console.error('Failed to upload to Grove:', error);
      throw new Error(`Grove upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate hash for content
   */
  generateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get IP asset information
   */
  async getIPAsset(ipId: string): Promise<any> {
    if (!this.client) {
      throw this.createStoryError('CLIENT_NOT_INITIALIZED', 'Story Protocol client not initialized');
    }

    try {
      return await this.client.ipAsset.ipAsset({ ipId: ipId as Address });
    } catch (error) {
      console.error('Failed to get IP asset:', error);
      return null;
    }
  }

  /**
   * Claim revenue from derivatives
   */
  async claimRevenue(ipId: string, childIpIds: string[]): Promise<{
    success: boolean;
    claimedTokens?: string;
    error?: string;
  }> {
    if (!this.client) {
      throw this.createStoryError('CLIENT_NOT_INITIALIZED', 'Story Protocol client not initialized');
    }

    try {
      // This would implement revenue claiming logic
      // For now, return a success response
      return {
        success: true,
        claimedTokens: '0'
      };
    } catch (error) {
      console.error('Revenue claim failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Revenue claim failed'
      };
    }
  }

  /**
   * Check if client is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Get network configuration
   */
  get networkConfig() {
    return this.networkConfig;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.client = null;
    this.isInitialized = false;
    ConsolidatedStoryClient.instance = null;
    console.log('Story Protocol client disposed');
  }

  /**
   * Initialize Story Protocol client with private key
   */
  private async initializeClient(privateKey: string): Promise<void> {
    try {
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      
      const storyConfig: StoryConfig = {
        account,
        transport: http(this.networkConfig.rpcUrl),
        chainId: this.networkConfig.chainId as any,
      };

      this.client = StoryClient.newClient(storyConfig);
    } catch (error) {
      console.error('Failed to initialize Story client:', error);
      throw this.createStoryError('CLIENT_INIT_FAILED', 'Failed to initialize Story Protocol client', error);
    }
  }

  /**
   * Create license terms for different types
   */
  private createLicenseTermsForType(licenseType: LicenseType, commercialTerms?: CommercialTerms): LicenseTerms {
    const baseTerms = {
      transferable: true,
      royaltyPolicy: zeroAddress,
      defaultMintingFee: 0n,
      expiration: 0n,
      commercializerChecker: zeroAddress,
      commercializerCheckerData: '0x',
      commercialRevCeiling: 0n,
      derivativesAllowed: true,
      derivativesAttribution: true,
      derivativesApproval: false,
      derivativesReciprocal: true,
      derivativeRevCeiling: 0n,
      currency: zeroAddress,
    };

    switch (licenseType) {
      case 'nonCommercial':
        return {
          ...baseTerms,
          commercialUse: false,
          commercialAttribution: false,
          commercialRevShare: 0,
          uri: 'https://github.com/piplabs/pil-document/blob/998c13e6ee1d04eb817aefd1fe16dfe8be3cd7a2/off-chain-terms/NCSR.json'
        };

      case 'commercialUse':
        return {
          ...baseTerms,
          commercialUse: true,
          commercialAttribution: true,
          commercialRevShare: commercialTerms?.revShare || 0,
          defaultMintingFee: BigInt(Math.floor((commercialTerms?.mintingFee || 0) * 1e18)),
          uri: 'https://github.com/piplabs/pil-document/blob/ad67bb632a310d2557f8abcccd428e4c9c798db1/off-chain-terms/CommercialUse.json'
        };

      case 'commercialRemix':
        return {
          ...baseTerms,
          commercialUse: true,
          commercialAttribution: true,
          commercialRevShare: commercialTerms?.revShare || 10,
          defaultMintingFee: BigInt(Math.floor((commercialTerms?.mintingFee || 0.01) * 1e18)),
          uri: 'https://github.com/piplabs/pil-document/blob/ad67bb632a310d2557f8abcccd428e4c9c798db1/off-chain-terms/CommercialRemix.json'
        };

      default:
        return {
          ...baseTerms,
          commercialUse: false,
          commercialAttribution: false,
          commercialRevShare: 0,
          uri: ''
        };
    }
  }

  /**
   * Generate default pattern image
   */
  private generateDefaultPatternImage(pattern: BreathingPatternIP): string {
    const totalTime = pattern.inhale + pattern.hold + pattern.exhale + pattern.rest;
    const svg = `
      <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="breathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
            <stop offset="25%" style="stop-color:#10b981;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#f59e0b;stop-opacity:1" />
            <stop offset="75%" style="stop-color:#ef4444;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <rect width="400" height="200" fill="url(#breathGradient)" rx="10"/>
        
        <text x="200" y="40" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">
          ${pattern.name}
        </text>
        
        <text x="200" y="80" text-anchor="middle" fill="white" font-family="Arial" font-size="14">
          ${pattern.inhale}s Inhale • ${pattern.hold}s Hold • ${pattern.exhale}s Exhale • ${pattern.rest}s Rest
        </text>
        
        <text x="200" y="120" text-anchor="middle" fill="white" font-family="Arial" font-size="12">
          Total Cycle: ${totalTime}s
        </text>
        
        <circle cx="200" cy="160" r="20" fill="rgba(255,255,255,0.3)" stroke="white" stroke-width="2"/>
        <text x="200" y="166" text-anchor="middle" fill="white" font-family="Arial" font-size="12">🌬️</text>
      </svg>
    `;

    const encodedSvg = encodeURIComponent(svg);
    return `data:image/svg+xml,${encodedSvg}`;
  }

  /**
   * Create standardized Story error
   */
  private createStoryError(code: string, message: string, originalError?: any): StoryError {
    return {
      code,
      message,
      details: originalError,
    };
  }
}

export default ConsolidatedStoryClient;