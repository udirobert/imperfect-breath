/**
 * Flow Blockchain - Main Exports
 * Single source of truth for all Flow-related imports
 */

// Core clients
export { default as BaseFlowClient } from './clients/base-client';
export { default as NFTClient } from './clients/nft-client';
export { default as TransactionClient } from './clients/transaction-client';

// Types
export type {
  FlowConfig,
  FlowAccount,
  FlowTransaction,
  FlowTransactionResult,
  BreathingPatternNFT,
  BreathingPatternAttributes,
  NFTMetadata,
  RoyaltyInfo,
  MarketplaceListing,
  PurchaseResult,
  EVMBatchCall,
  BatchTransactionResult,
  TransactionStatus,
  FlowError,
  FlowState,
  FlowActions,
} from './types';

// Main hook
export { useFlow } from '../../hooks/useFlow';

// Legacy exports (for backward compatibility)
export { EnhancedFlowClient } from './enhanced-flow-client';
