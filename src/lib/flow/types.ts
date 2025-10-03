/**
 * Shared Flow Blockchain Types
 * Single source of truth for all Flow-related interfaces
 */

// Core Flow types
export interface FlowAccount {
  address: string;
  balance: number;
  keys: FlowAccountKey[];
}

export interface FlowAccountKey {
  index: number;
  publicKey: string;
  signAlgo: number;
  hashAlgo: number;
  weight: number;
  sequenceNumber: number;
  revoked: boolean;
}

export interface FlowTransaction {
  id: string;
  script: string;
  arguments: unknown[];
  referenceBlockId: string;
  gasLimit: number;
  proposalKey: FlowProposalKey;
  payer: string;
  authorizers: string[];
  payloadSignatures: FlowSignature[];
  envelopeSignatures: FlowSignature[];
}

export interface FlowProposalKey {
  address: string;
  keyIndex: number;
  sequenceNumber: number;
}

export interface FlowSignature {
  address: string;
  keyIndex: number;
  signature: string;
}

export interface FlowTransactionResult {
  status: number;
  statusCode: number;
  statusString: string;
  errorMessage: string;
  events: FlowEvent[];
}

export interface FlowEvent {
  type: string;
  transactionId: string;
  transactionIndex: number;
  eventIndex: number;
  data: Record<string, unknown>;
}

// Breathing Pattern NFT types
export interface BreathingPatternNFT {
  id: string;
  name: string;
  description: string;
  image: string;
  attributes: BreathingPatternAttributes;
  owner: string;
  creator: string;
  royalties: RoyaltyInfo[];
  metadata: NFTMetadata;
}

export interface BreathingPatternAttributes {
  inhale: number;
  hold: number;
  exhale: number;
  rest: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  tags: string[];
  totalCycles: number;
  estimatedDuration: number;
}

export interface RoyaltyInfo {
  receiver: string;
  cut: number; // Percentage (0-100)
  description: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  animation_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
}

// Marketplace types
export interface MarketplaceListing {
  id: string;
  nftId: string;
  seller: string;
  price: number;
  currency: string;
  status: "active" | "sold" | "cancelled" | "expired";
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface PurchaseResult {
  success: boolean;
  transactionId: string;
  nftId: string;
  buyer: string;
  seller: string;
  price: number;
  error?: string;
}

// Batch transaction types
export interface EVMBatchCall {
  to: string;
  data: string;
  value?: string;
  gasLimit?: number;
}

export interface CallOutcome {
  success: boolean;
  returnData: string;
  gasUsed: number;
  error?: string;
}

export interface BatchTransactionResult {
  txId: string;
  results: CallOutcome[];
  isError: boolean;
  totalGasUsed: number;
}

// Authentication types
export interface FlowUser {
  addr: string | null;
  cid: string | null;
  loggedIn: boolean;
  services: FlowService[];
}

export interface FlowService {
  f_type: string;
  f_vsn: string;
  type: string;
  method: string;
  endpoint: string;
  uid: string;
  id: string;
  identity: {
    address: string;
    keyId: number;
  };
  provider: {
    address: string;
    name: string;
    icon: string;
    description: string;
  };
}

export interface COAInfo {
  address: string;
  balance: number;
  isInitialized: boolean;
}

// Configuration types
export interface FlowConfig {
  network: "testnet" | "mainnet" | "emulator";
  accessNode: string;
  discoveryWallet: string;
  contractAddress: string;
  fungibleTokenAddress: string;
  flowTokenAddress: string;
}

export interface NetworkConfig {
  testnet: FlowConfig;
  mainnet: FlowConfig;
  emulator: FlowConfig;
}

// Transaction status types
export type TransactionStatus =
  | "UNKNOWN"
  | "PENDING"
  | "FINALIZED"
  | "EXECUTED"
  | "SEALED"
  | "EXPIRED";

// Error types
export interface FlowError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Hook return types
export interface FlowState {
  isInitialized: boolean;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  user: FlowUser | null;
  coaInfo: COAInfo | null;
}

export interface FlowActions {
  initialize: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;

  // NFT operations
  mintBreathingPattern: (
    pattern: BreathingPatternAttributes,
    metadata: NFTMetadata,
  ) => Promise<string>;
  transferNFT: (nftId: string, recipient: string) => Promise<string>;
  purchaseNFT: (nftId: string, price: number, marketplaceAddress: string) => Promise<string>;

  // Marketplace operations
  listForSale: (nftId: string, price: number) => Promise<string>;
  purchaseNFTFromMarketplace: (listingId: string) => Promise<PurchaseResult>;
  cancelListing: (listingId: string) => Promise<string>;

  // Batch operations
  batchMintPatterns: (
    patterns: BreathingPatternAttributes[],
  ) => Promise<BatchTransactionResult>;
  executeBatchTransaction: (
    calls: EVMBatchCall[],
  ) => Promise<BatchTransactionResult>;

  // Utility operations
  getAccountInfo: (address: string) => Promise<FlowAccount>;
  getTransactionStatus: (txId: string) => Promise<TransactionStatus>;
  waitForTransaction: (txId: string) => Promise<FlowTransactionResult>;
}

// Breathing session types
export interface BreathingSession {
  id: string;
  patternId: string;
  userId: string;
  duration: number;
  score: number;
  completedAt: string;
  metrics: SessionMetrics;
}

// Cross-network types
export interface LensPost {
  id: string;
  content: string;
  timestamp: string;
  metadata: Record<string, any>;
  transactionId?: string;
  forteUniqueId?: string;
}

export interface SessionMetrics {
  averageBreathingRate: number;
  consistency: number;
  restlessnessScore: number;
  heartRateVariability?: number;
}

// Smart contract interaction types
export interface ContractMethod {
  name: string;
  args: unknown[];
  gasLimit?: number;
}

export interface ContractEvent {
  name: string;
  data: Record<string, unknown>;
  blockHeight: number;
  transactionId: string;
}
