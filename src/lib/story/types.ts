/**
 * Shared Story Protocol Types
 * Single source of truth for all Story Protocol interfaces
 */

// Core Story Protocol types
export interface StoryConfig {
  chainId: string;
  rpcUrl: string;
  privateKey?: string;
  isTestnet: boolean;
}

export interface IPAsset {
  id: string;
  tokenContract: string;
  tokenId: string;
  owner: string;
  metadataURI: string;
  metadataHash: string;
  registrationDate: string;
}

export interface LicenseTerms {
  transferable: boolean;
  royaltyPolicy: string;
  defaultMintingFee: bigint;
  expiration: bigint;
  commercialUse: boolean;
  commercialAttribution: boolean;
  commercializerChecker: string;
  commercializerCheckerData: string;
  commercialRevShare: number;
  commercialRevCeiling: bigint;
  derivativesAllowed: boolean;
  derivativesAttribution: boolean;
  derivativesApproval: boolean;
  derivativesReciprocal: boolean;
  derivativeRevCeiling: bigint;
  currency: string;
  uri: string;
}

export interface IPMetadata {
  title: string;
  description: string;
  createdAt: string;
  creators: Array<{
    name: string;
    address: string;
    contributionPercent: number;
  }>;
  image?: string;
  imageHash?: string;
  mediaUrl?: string;
  mediaHash?: string;
  mediaType?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

// Breathing Pattern specific types
export interface BreathingPatternIP {
  name: string;
  description: string;
  inhale: number;
  hold: number;
  exhale: number;
  rest: number;
  creator: string;
  tags: string[];
  imageUri?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  estimatedDuration?: number;
}

export interface IPRegistrationResult {
  success: boolean;
  ipId?: string;
  tokenId?: string;
  txHash?: string;
  licenseTermsId?: string;
  error?: string;
  explorerUrl?: string;
}

export interface LicenseRegistrationResult {
  success: boolean;
  licenseTermsId?: string;
  txHash?: string;
  error?: string;
}

export interface DerivativeRegistrationResult {
  success: boolean;
  ipId?: string;
  tokenId?: string;
  txHash?: string;
  parentIpIds: string[];
  licenseTermsIds: string[];
  error?: string;
}

// License template types
export type LicenseType = 'nonCommercial' | 'commercialUse' | 'commercialRemix';

export interface CommercialTerms {
  revShare: number; // Percentage (0-100)
  mintingFee: number; // In ETH
  currency?: string;
  royaltyPolicy?: string;
}

// Network configuration
export interface NetworkConfig {
  testnet: StoryConfig;
  mainnet: StoryConfig;
}

// Story Protocol client state
export interface StoryState {
  isInitialized: boolean;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  currentNetwork: 'testnet' | 'mainnet';
  account: string | null;
}

// Hook return types
export interface StoryActions {
  initialize: (config?: Partial<StoryConfig>) => Promise<void>;
  
  // IP Registration
  registerBreathingPatternIP: (
    pattern: BreathingPatternIP,
    licenseType?: LicenseType,
    commercialTerms?: CommercialTerms
  ) => Promise<IPRegistrationResult>;
  
  registerDerivativePattern: (
    originalIpId: string,
    licenseTermsId: string,
    derivativePattern: BreathingPatternIP
  ) => Promise<DerivativeRegistrationResult>;
  
  // License Management
  createLicenseTerms: (
    licenseType: LicenseType,
    commercialTerms?: CommercialTerms
  ) => Promise<LicenseRegistrationResult>;
  
  attachLicenseTerms: (
    ipId: string,
    licenseTermsId: string
  ) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  
  // IP Management
  getIPAsset: (ipId: string) => Promise<IPAsset | null>;
  getIPMetadata: (ipId: string) => Promise<IPMetadata | null>;
  
  // Revenue
  claimRevenue: (
    ipId: string,
    childIpIds: string[]
  ) => Promise<{ success: boolean; claimedTokens?: string; error?: string }>;
  
  // Utilities
  uploadToGrove: (data: any) => Promise<string>;
  generateHash: (content: string) => string;
}

// Error types
export interface StoryError {
  code: string;
  message: string;
  details?: any;
}

// Grove storage types
export interface GroveUploadResult {
  uri: string;
  gatewayUrl: string;
  storageKey: string;
}

// Helper function types
export interface PatternImageOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  includeVisualization?: boolean;
}

// Contract addresses
export interface ContractAddresses {
  spgNftContract: string;
  ipAssetRegistry: string;
  licensingModule: string;
  royaltyModule: string;
  pilTemplate: string;
}

// Transaction options
export interface TransactionOptions {
  gasLimit?: number;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Analytics types
export interface IPAnalytics {
  totalRegistrations: number;
  totalRevenue: string;
  derivativeCount: number;
  licenseCount: number;
  popularPatterns: Array<{
    ipId: string;
    name: string;
    registrations: number;
  }>;
}