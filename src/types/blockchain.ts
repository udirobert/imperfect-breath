// Wallet Types - using ConnectKit/Avara
export interface WalletUser {
  id: string;
  email?: string;
  wallet: UserWallet;
  profile: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface UserWallet {
  address: string;
  chainId: number;
  balance: string;
  network: "mainnet" | "testnet";
  provider: "metamask" | "walletconnect" | "coinbase" | "other";
}

export interface UserProfile {
  username?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

// Authentication Types
export type AuthProvider = "google" | "apple" | "email" | "wallet";

export interface AuthResult {
  user: WalletUser;
  token: string;
  refreshToken: string;
}

export interface WalletConnection {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  balance?: string;
}

// IP Registration Types
export interface IPRegistration {
  ipHash: string;
  transactionHash: string;
  creator: string;
  title: string;
  description: string;
  contentHash: string;
  timestamp: string;
  verified: boolean;
  royaltyPercent: number;
  licensingTerms: LicenseTerms[];
}

export interface IPMetadata {
  title: string;
  description: string;
  creator: string;
  createdAt: string;
  contentType: "breathing-pattern";
  attributes: {
    category: string;
    difficulty: string;
    duration: number;
    phases: unknown[];
  };
  version: string;
}

// Licensing Types
export interface LicenseTerms {
  id: string;
  type: "personal" | "commercial" | "exclusive";
  price: number; // in wei
  currency: "ETH" | "USDC";
  duration?: number; // days, null for perpetual
  attributionRequired: boolean;
  derivativeWorks: boolean; // renamed from modifications
  commercialUse: boolean; // renamed from resale for consistency
  royaltyPercent: number; // added for consistency
  maxUsers?: number;
  uri?: string;
  defaultMintingFee?: bigint;
}

export interface LicenseAgreement {
  id: string;
  patternId: string;
  licenseeId: string;
  licensorId: string;
  terms: LicenseTerms;
  transactionHash: string;
  purchaseDate: string;
  expiryDate?: string;
  status: "active" | "expired" | "revoked";
  usageCount: number;
}

// Transaction Types
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: string;
  blockNumber?: number;
}

export interface WithdrawalTransaction extends Transaction {
  amount: number;
  currency: string;
  withdrawalAddress: string;
}

// Revenue Types
export interface EarningsReport {
  totalEarnings: number;
  periodEarnings: number;
  currency: string;
  transactions: RevenueTransaction[];
  breakdown: {
    personal: number;
    commercial: number;
    exclusive: number;
  };
}

export interface RevenueTransaction {
  id: string;
  patternId: string;
  licenseId: string;
  amount: number;
  currency: string;
  date: string;
  type: "license" | "royalty";
  buyer: string;
}

export interface RevenueAnalytics {
  patternId: string;
  totalRevenue: number;
  licensesSold: number;
  averagePrice: number;
  topLicenseType: string;
  monthlyTrend: {
    month: string;
    revenue: number;
    licenses: number;
  }[];
}

// Error Types
export interface BlockchainError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

export interface Web3Error extends BlockchainError {
  transactionHash?: string;
  gasEstimate?: string;
}

// Utility Types
export type TimeFrame = "7d" | "30d" | "90d" | "1y" | "all";

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SearchFilters {
  category?: string;
  difficulty?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  creator?: string;
  licensed?: boolean;
}

// Event Types for blockchain interactions
export interface BlockchainEvent {
  type:
    | "wallet_connected"
    | "transaction_pending"
    | "transaction_confirmed"
    | "ip_registered"
    | "license_purchased";
  data: Record<string, unknown>;
  timestamp: string;
}

// Configuration Types
export interface BlockchainConfig {
  environment: "mainnet" | "testnet";
  crossmint: {
    projectId: string;
    apiKey: string;
    environment: "staging" | "production";
  };
  storyProtocol: {
    apiKey: string;
    chainId: number;
    contractAddress: string;
  };
  connectKit: {
    projectId: string;
    appName: string;
  };
}
