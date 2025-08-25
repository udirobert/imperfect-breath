// Lens v3 2025 Types - Pure Implementation (No Legacy)
export type UserRole = "user" | "creator" | "instructor";

export interface User {
  id: string;
  email?: string;
  role: UserRole;
  creator_verified: boolean;
  wallet_address: string | null;
  profile: UserProfile;
  wallet?: UserWallet;
  lensAccount?: LensAccount;
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
  name?: string;
  avatar?: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

// Lens v3 2025 Types - Latest Spec Compliant
export interface LensAccount {
  id: string;
  address: string;
  username?: {
    localName: string;
    fullHandle: string;
    ownedBy: string;
  };
  ownedBy: {
    address: string;
  };
  metadata?: {
    name?: string;
    bio?: string;
    picture?:
      | string
      | {
          __typename: string;
          optimized?: {
            uri: string;
          };
        };
    coverPicture?: string;
    attributes?: Array<{
      key: string;
      value: string;
      type: "string" | "number" | "boolean" | "json";
    }>;
  };
  stats: {
    followers: number;
    following: number;
    posts: number;
    comments: number;
    reposts: number;
    quotes: number;
    reactions: number;
  };
  operations?: {
    canFollow: boolean;
    canUnfollow: boolean;
    isFollowedByMe: boolean;
    canSendDM: boolean;
    canBlock: boolean;
    canReport: boolean;
  };
  timestamp: string;
  isVerified?: boolean;
  sponsors?: string[];
}

export interface LensPost {
  id: string;
  author: LensAccount;
  contentUri: string;
  metadata: {
    content?: string;
    title?: string;
    tags?: string[];
    locale?: string;
    contentWarning?: "NSFW" | "SENSITIVE" | "SPOILER";
    mainContentFocus:
      | "TEXT_ONLY"
      | "IMAGE"
      | "VIDEO"
      | "AUDIO"
      | "ARTICLE"
      | "LINK"
      | "EMBED";
    attributes?: Array<{
      key: string;
      value: string;
      type: "string" | "number" | "boolean" | "json";
    }>;
  };
  timestamp: string;
  stats: {
    comments: number;
    reposts: number;
    quotes: number;
    reactions: number;
    collects: number;
    bookmarks: number;
  };
  operations?: {
    canComment: boolean;
    canRepost: boolean;
    canQuote: boolean;
    canCollect: boolean;
    canReport: boolean;
    hasReacted: boolean;
    hasReposted: boolean;
    hasBookmarked: boolean;
    hasCollected: boolean;
  };
  root?: LensPost;
  commentOn?: LensPost;
  quoteOf?: LensPost;
}

export interface BreathingSessionData {
  patternName: string;
  duration: number;
  score: number;
  cycles?: number;
  breathHoldTime?: number;
  flowNFTId?: string;
  insights?: string[];
  content?: string;
  lensPostId?: string;
  timestamp: string;
}

export interface SocialActionResult {
  success: boolean;
  hash?: string;
  postId?: string;
  error?: string;
  transactionHash?: string; // Transaction hash for blockchain operations
}

// Lens v3 Authentication Types
export type AuthProvider = "google" | "apple" | "email" | "wallet";

export interface AuthResult {
  user: User;
  token: string;
  refreshToken: string;
}

export interface WalletConnection {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  balance?: string;
}


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
  connectKit: {
    projectId: string;
    appName: string;
  };
}
