/**
 * Story Protocol Client for Breathing Pattern IP Management
 * Handles IP registration, licensing, and royalty distribution for breathing patterns
 */

import { StoryClient, StoryConfig, LicenseTerms, IpMetadata } from '@story-protocol/core-sdk';
import { http, Address, parseEther, zeroAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { config } from '@/config/environment';
import { StorageClient } from '@lens-chain/storage-client';
import { chains } from '@lens-chain/sdk/viem';
import { immutable } from '@lens-chain/storage-client';
import { createHash } from 'crypto';

// Story Protocol network configuration
const STORY_NETWORKS = {
  testnet: {
    chainId: 'aeneid' as const,
    rpcUrl: 'https://aeneid.storyrpc.io',
    explorer: 'https://aeneid.explorer.story.foundation',
    spgNftContract: '0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc' as Address
  },
  mainnet: {
    chainId: 'mainnet' as const,
    rpcUrl: 'https://mainnet.storyrpc.io',
    explorer: 'https://explorer.story.foundation',
    spgNftContract: '0x98971c660ac20880b60F86Cc3113eBd979eb3aAE' as Address
  }
};

// Pre-configured PIL (Programmable IP License) terms for breathing patterns
const BREATHING_PATTERN_LICENSE_TERMS = {
  // Non-commercial social remixing - allows free remixing with attribution
  nonCommercial: {
    transferable: true,
    royaltyPolicy: zeroAddress,
    defaultMintingFee: 0n,
    expiration: 0n,
    commercialUse: false,
    commercialAttribution: false,
    commercializerChecker: zeroAddress,
    commercializerCheckerData: '0x',
    commercialRevShare: 0,
    commercialRevCeiling: 0n,
    derivativesAllowed: true,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: true,
    derivativeRevCeiling: 0n,
    currency: zeroAddress,
    uri: 'https://github.com/piplabs/pil-document/blob/998c13e6ee1d04eb817aefd1fe16dfe8be3cd7a2/off-chain-terms/NCSR.json'
  } as LicenseTerms,

  // Commercial remix - allows commercial use with revenue sharing
  commercialRemix: (revShare: number = 10, mintingFee: number = 0.01) => ({
    transferable: true,
    royaltyPolicy: '0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E' as Address, // RoyaltyPolicyLAP
    defaultMintingFee: parseEther(mintingFee.toString()),
    expiration: 0n,
    commercialUse: true,
    commercialAttribution: true,
    commercializerChecker: zeroAddress,
    commercializerCheckerData: '0x',
    commercialRevShare: revShare,
    commercialRevCeiling: 0n,
    derivativesAllowed: true,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: true,
    derivativeRevCeiling: 0n,
    currency: '0x1514000000000000000000000000000000000000' as Address, // $WIP token
    uri: 'https://github.com/piplabs/pil-document/blob/ad67bb632a310d2557f8abcccd428e4c9c798db1/off-chain-terms/CommercialRemix.json'
  }) as LicenseTerms
};

export interface BreathingPatternIP {
  name: string;
  description: string;
  inhale: number;
  hold: number;
  exhale: number;
  rest: number;
  creator: string;
  tags?: string[];
  imageUri?: string;
  audioUri?: string;
}

export interface IPRegistrationResult {
  ipId: string;
  tokenId: string;
  txHash: string;
  licenseTermsId?: string;
}

export interface LicenseResult {
  licenseTokenIds: string[];
  txHash: string;
}

export interface RoyaltyPayment {
  amount: bigint;
  currency: Address;
  txHash: string;
}

/**
 * Story Protocol Client for Breathing Pattern IP Management
 */
export class StoryBreathingClient {
  private client: StoryClient;
  private isTestnet: boolean;
  private networkConfig: typeof STORY_NETWORKS.testnet;
  private storageClient: StorageClient;

  constructor(isTestnet: boolean = true, privateKey?: string) {
    this.isTestnet = isTestnet;
    this.networkConfig = isTestnet ? STORY_NETWORKS.testnet : STORY_NETWORKS.mainnet;
    
    // Initialize Grove storage client
    this.storageClient = StorageClient.create();

    // Set up account if private key provided
    let account;
    if (privateKey) {
      account = privateKeyToAccount(privateKey as Address);
    }

    const storyConfig: StoryConfig = {
      account,
      transport: http(this.networkConfig.rpcUrl),
      chainId: this.networkConfig.chainId,
    };

    this.client = StoryClient.newClient(storyConfig);
  }

  /**
   * Register a breathing pattern as an IP Asset
   */
  async registerBreathingPatternIP(
    patternData: BreathingPatternIP,
    licenseType: 'nonCommercial' | 'commercialRemix' = 'nonCommercial',
    commercialTerms?: { revShare: number; mintingFee: number }
  ): Promise<IPRegistrationResult> {
    try {
      // Create IP metadata following the IPA Metadata Standard
      const ipMetadata: IpMetadata = {
        title: patternData.name,
        description: patternData.description,
        image: patternData.imageUri || 'https://ipfs.io/ipfs/QmSamy4zqP91X42k6wS7kLJQVzuYJuW2EN94couPaq82A8',
        creators: [
          {
            name: patternData.creator,
            address: patternData.creator as Address,
            description: 'Breathing pattern creator',
            contributionPercent: 100,
            socialMedia: []
          }
        ],
        // Custom attributes for breathing patterns
        attributes: [
          { trait_type: 'Inhale Duration', value: patternData.inhale.toString() },
          { trait_type: 'Hold Duration', value: patternData.hold.toString() },
          { trait_type: 'Exhale Duration', value: patternData.exhale.toString() },
          { trait_type: 'Rest Duration', value: patternData.rest.toString() },
          { trait_type: 'Pattern Type', value: 'Breathing Pattern' },
          { trait_type: 'Total Cycle Time', value: (patternData.inhale + patternData.hold + patternData.exhale + patternData.rest).toString() }
        ]
      };

      // Create NFT metadata (ERC-721 standard)
      const nftMetadata = {
        name: `${patternData.name} - Breathing Pattern NFT`,
        description: `This NFT represents ownership of the "${patternData.name}" breathing pattern. ${patternData.description}`,
        image: patternData.imageUri || 'https://ipfs.io/ipfs/QmSamy4zqP91X42k6wS7kLJQVzuYJuW2EN94couPaq82A8',
        attributes: [
          { trait_type: 'Inhale', value: patternData.inhale },
          { trait_type: 'Hold', value: patternData.hold },
          { trait_type: 'Exhale', value: patternData.exhale },
          { trait_type: 'Rest', value: patternData.rest }
        ]
      };

      // Upload metadata to Grove (Lens storage)
      const ipMetadataUri = await this.uploadToGrove(ipMetadata);
      const nftMetadataUri = await this.uploadToGrove(nftMetadata);
      const ipMetadataHash = this.generateHash(JSON.stringify(ipMetadata));
      const nftMetadataHash = this.generateHash(JSON.stringify(nftMetadata));

      // Choose license terms based on type
      let licenseTerms: LicenseTerms;
      if (licenseType === 'commercialRemix' && commercialTerms) {
        licenseTerms = BREATHING_PATTERN_LICENSE_TERMS.commercialRemix(
          commercialTerms.revShare,
          commercialTerms.mintingFee
        );
      } else {
        licenseTerms = BREATHING_PATTERN_LICENSE_TERMS.nonCommercial;
      }

      // Register IP with license terms attached
      const response = await this.client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
        spgNftContract: this.networkConfig.spgNftContract,
        pilTerms: licenseTerms,
        ipMetadata: {
          ipMetadataURI: ipMetadataUri,
          ipMetadataHash: `0x${ipMetadataHash}`,
          nftMetadataURI: nftMetadataUri,
          nftMetadataHash: `0x${nftMetadataHash}`
        }
      });

      return {
        ipId: response.ipId!,
        tokenId: response.tokenId!.toString(),
        txHash: response.txHash!,
        licenseTermsId: response.licenseTermsId?.toString()
      };
    } catch (error) {
      console.error('Failed to register breathing pattern IP:', error);
      throw error;
    }
  }

  /**
   * Register a derivative breathing pattern (remix/variation)
   */
  async registerDerivativePattern(
    originalPatternIpId: string,
    licenseTermsId: string,
    derivativeData: BreathingPatternIP
  ): Promise<IPRegistrationResult> {
    try {
      // Create metadata for derivative pattern
      const ipMetadata: IpMetadata = {
        title: `${derivativeData.name} (Remix)`,
        description: `A derivative of an existing breathing pattern. ${derivativeData.description}`,
        image: derivativeData.imageUri,
        creators: [
          {
            name: derivativeData.creator,
            address: derivativeData.creator as Address,
            description: 'Derivative breathing pattern creator',
            contributionPercent: 100,
            socialMedia: []
          }
        ],
        attributes: [
          { trait_type: 'Inhale Duration', value: derivativeData.inhale.toString() },
          { trait_type: 'Hold Duration', value: derivativeData.hold.toString() },
          { trait_type: 'Exhale Duration', value: derivativeData.exhale.toString() },
          { trait_type: 'Rest Duration', value: derivativeData.rest.toString() },
          { trait_type: 'Pattern Type', value: 'Derivative Breathing Pattern' },
          { trait_type: 'Parent IP', value: originalPatternIpId }
        ]
      };

      const nftMetadata = {
        name: `${derivativeData.name} - Derivative Breathing Pattern`,
        description: `A remix of an existing breathing pattern. ${derivativeData.description}`,
        image: derivativeData.imageUri,
        attributes: [
          { trait_type: 'Inhale', value: derivativeData.inhale },
          { trait_type: 'Hold', value: derivativeData.hold },
          { trait_type: 'Exhale', value: derivativeData.exhale },
          { trait_type: 'Rest', value: derivativeData.rest },
          { trait_type: 'Original Pattern', value: originalPatternIpId }
        ]
      };

      // Upload metadata to Grove
      const ipMetadataUri = await this.uploadToGrove(ipMetadata);
      const nftMetadataUri = await this.uploadToGrove(nftMetadata);
      const ipMetadataHash = this.generateHash(JSON.stringify(ipMetadata));
      const nftMetadataHash = this.generateHash(JSON.stringify(nftMetadata));

      // Register derivative IP
      const response = await this.client.ipAsset.mintAndRegisterIpAndMakeDerivative({
        spgNftContract: this.networkConfig.spgNftContract,
        derivData: {
          parentIpIds: [originalPatternIpId as Address],
          licenseTermsIds: [licenseTermsId]
        },
        ipMetadata: {
          ipMetadataURI: ipMetadataUri,
          ipMetadataHash: `0x${ipMetadataHash}`,
          nftMetadataURI: nftMetadataUri,
          nftMetadataHash: `0x${nftMetadataHash}`
        }
      });

      return {
        ipId: response.ipId!,
        tokenId: response.tokenId!.toString(),
        txHash: response.txHash!
      };
    } catch (error) {
      console.error('Failed to register derivative pattern:', error);
      throw error;
    }
  }

  /**
   * Mint a license token for a breathing pattern
   */
  async mintLicenseToken(
    ipId: string,
    licenseTermsId: string,
    amount: number = 1,
    receiverAddress?: string
  ): Promise<LicenseResult> {
    try {
      const response = await this.client.license.mintLicenseTokens({
        licenseTermsId,
        licensorIpId: ipId as Address,
        receiver: receiverAddress as Address,
        amount,
        maxMintingFee: parseEther('1'), // Max 1 $WIP
        maxRevenueShare: 100
      });

      return {
        licenseTokenIds: response.licenseTokenIds?.map(id => id.toString()) || [],
        txHash: response.txHash!
      };
    } catch (error) {
      console.error('Failed to mint license token:', error);
      throw error;
    }
  }

  /**
   * Pay royalties to a breathing pattern IP
   */
  async payRoyalties(
    receiverIpId: string,
    amount: bigint,
    payerIpId?: string
  ): Promise<RoyaltyPayment> {
    try {
      const response = await this.client.royalty.payRoyaltyOnBehalf({
        receiverIpId: receiverIpId as Address,
        payerIpId: payerIpId ? (payerIpId as Address) : zeroAddress,
        token: '0x1514000000000000000000000000000000000000' as Address, // $WIP
        amount
      });

      return {
        amount,
        currency: '0x1514000000000000000000000000000000000000' as Address,
        txHash: response.txHash!
      };
    } catch (error) {
      console.error('Failed to pay royalties:', error);
      throw error;
    }
  }

  /**
   * Claim revenue from breathing pattern IP
   */
  async claimRevenue(
    ancestorIpId: string,
    claimerAddress: string,
    childIpIds: string[] = []
  ): Promise<{ claimedTokens: string[]; txHash: string }> {
    try {
      const response = await this.client.royalty.claimAllRevenue({
        ancestorIpId: ancestorIpId as Address,
        claimer: claimerAddress as Address,
        currencyTokens: ['0x1514000000000000000000000000000000000000' as Address], // $WIP
        childIpIds: childIpIds as Address[],
        royaltyPolicies: ['0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E' as Address], // RoyaltyPolicyLAP
        claimOptions: {
          autoTransferAllClaimedTokensFromIp: true,
          autoUnwrapIpTokens: true
        }
      });

      return {
        claimedTokens: response.claimedTokens || [],
        txHash: response.txHash!
      };
    } catch (error) {
      console.error('Failed to claim revenue:', error);
      throw error;
    }
  }

  /**
   * Create custom license terms for breathing patterns
   */
  async createCustomLicenseTerms(terms: {
    commercialUse: boolean;
    commercialRevShare: number;
    defaultMintingFee: number;
    derivativesAllowed: boolean;
    transferable: boolean;
  }): Promise<{ licenseTermsId: string; txHash: string }> {
    try {
      const licenseTerms: LicenseTerms = {
        transferable: terms.transferable,
        royaltyPolicy: terms.commercialUse ? 
          '0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E' as Address : 
          zeroAddress,
        defaultMintingFee: parseEther(terms.defaultMintingFee.toString()),
        expiration: 0n,
        commercialUse: terms.commercialUse,
        commercialAttribution: terms.commercialUse,
        commercializerChecker: zeroAddress,
        commercializerCheckerData: '0x',
        commercialRevShare: terms.commercialRevShare,
        commercialRevCeiling: 0n,
        derivativesAllowed: terms.derivativesAllowed,
        derivativesAttribution: terms.derivativesAllowed,
        derivativesApproval: false,
        derivativesReciprocal: terms.derivativesAllowed,
        derivativeRevCeiling: 0n,
        currency: terms.commercialUse ? 
          '0x1514000000000000000000000000000000000000' as Address : 
          zeroAddress,
        uri: ''
      };

      const response = await this.client.license.registerPILTerms(licenseTerms);

      return {
        licenseTermsId: response.licenseTermsId!.toString(),
        txHash: response.txHash!
      };
    } catch (error) {
      console.error('Failed to create license terms:', error);
      throw error;
    }
  }

  /**
   * Get IP Asset details
   */
  async getIPAssetDetails(ipId: string) {
    try {
      // This would typically make a query to get IP details
      // For now, return basic info
      return {
        ipId,
        owner: 'Unknown',
        registered: true,
        explorerUrl: `${this.networkConfig.explorer}/ipa/${ipId}`
      };
    } catch (error) {
      console.error('Failed to get IP details:', error);
      throw error;
    }
  }

  /**
   * Helper: Upload data to Grove (Lens storage)
   */
  async uploadToGrove(data: any): Promise<string> {
    try {
      // Create ACL for immutable content on appropriate chain
      const chainId = this.isTestnet ? chains.testnet.id : chains.mainnet.id;
      const acl = immutable(chainId);
      
      // Upload JSON data to Grove
      const response = await this.storageClient.uploadAsJson(data, { acl });
      
      // Return the Lens URI for Story Protocol
      return response.uri;
    } catch (error) {
      console.error('Failed to upload to Grove:', error);
      throw new Error(`Grove upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper: Generate hash for content
   */
  private generateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get network configuration
   */
  get networkConfig() {
    return this.networkConfig;
  }

  /**
   * Get Story client instance
   */
  get storyClient() {
    return this.client;
  }
}

export default StoryBreathingClient;
