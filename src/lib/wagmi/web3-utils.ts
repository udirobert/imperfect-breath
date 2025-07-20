/**
 * Web3 Provider Utility Functions
 * Extracted from EnhancedWeb3Provider to fix Fast Refresh warnings
 */

import { lensTestnet, lensMainnet } from "./chains";
import { mainnet, arbitrum, base } from "wagmi/chains";
import { config as envConfig } from "../../config/environment";

// Chain type interface
interface ChainInfo {
  id: number;
  name: string;
  blockExplorers?: {
    default?: {
      url: string;
    };
  };
  nativeCurrency: {
    decimals: number;
    name: string;
    symbol: string;
  };
}

// Define supported chains locally since it's not exported from provider
const supportedChains = [lensTestnet, mainnet, arbitrum, base] as const;

// Helper functions for working with different chains
export const getChainInfo = (chainId: number) => {
  return supportedChains.find((chain: ChainInfo) => chain.id === chainId);
};

export const isLensChain = (chainId: number) => {
  return chainId === lensTestnet.id || chainId === lensMainnet.id;
};

export const isFlowCompatible = (chainId: number) => {
  // Flow is handled separately as it's not EVM compatible
  return false;
};

// Chain-specific utilities
export const getExplorerUrl = (chainId: number, txHash: string) => {
  const chain = getChainInfo(chainId);
  if (!chain || !chain.blockExplorers?.default?.url) return null;
  return `${chain.blockExplorers.default.url}/tx/${txHash}`;
};

export const getChainCurrency = (chainId: number) => {
  const chain = getChainInfo(chainId);
  return chain?.nativeCurrency;
};

// Error handling utilities
export const handleWalletError = (error: Error) => {
  if (error.message.includes("User rejected")) {
    return "Transaction was rejected by user";
  }
  if (error.message.includes("insufficient funds")) {
    return "Insufficient funds for transaction";
  }
  if (error.message.includes("network")) {
    return "Network error. Please check your connection and try again";
  }
  return error.message || "An unexpected error occurred";
};

// Debugging helpers
export const logWalletState = (
  walletConnectProjectId: string | undefined,
  alchemyApiKey: string | undefined,
) => {
  if (envConfig.development.debugMode) {
    console.log("Enhanced Web3 Provider State:", {
      supportedChains: supportedChains.map((c: ChainInfo) => ({
        id: c.id,
        name: c.name,
      })),
      walletConnectProjectId: walletConnectProjectId ? "configured" : "missing",
      alchemyApiKey: alchemyApiKey ? "configured" : "missing",
      isTestnetMode: envConfig.development.debugMode || import.meta.env.DEV,
    });
  }
};
