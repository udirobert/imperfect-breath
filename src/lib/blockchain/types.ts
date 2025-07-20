/**
 * Blockchain Types - Lightweight Re-exports
 *
 * This file provides re-exports from the main blockchain types
 * to maintain compatibility with imports expecting this path.
 */

// Re-export all types from the main blockchain types file
export * from "../../types/blockchain";

// Additional blockchain-specific utility types
export type BlockchainNetwork = "ethereum" | "polygon" | "arbitrum" | "base" | "lens" | "flow";

export interface BlockchainConnectionStatus {
  connected: boolean;
  network?: BlockchainNetwork;
  address?: string;
  chainId?: number;
}

export interface BlockchainTransaction {
  hash: string;
  status: "pending" | "confirmed" | "failed";
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
}

// Lens-specific blockchain types
export interface LensChainConfig {
  chainId: number;
  name: string;
  rpc: string;
  currency: string;
  explorer: string;
}

// Flow-specific blockchain types
export interface FlowChainConfig {
  network: "mainnet" | "testnet";
  accessNode: string;
  discoveryWallet: string;
}
