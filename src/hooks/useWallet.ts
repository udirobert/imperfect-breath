/**
 * Unified Wallet Hook
 * 
 * Clean, simple API for all wallet operations.
 * Consolidates connection status, operations, and utilities into one hook.
 */

import { useCallback, useMemo } from 'react';
import { useWalletContext, useWalletConnection, useWalletOperations } from '../lib/wallet/wallet-context';

export interface UseWalletReturn {
  // Connection status
  isAvailable: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  shortAddress: string | null;
  chainId: string | null;
  error: string | null;
  
  // Provider info
  activeProvider: string | null;
  availableProviders: string[];
  
  // Operations
  connect: (providerName?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  switchProvider: (name: string) => Promise<void>;
  request: (method: string, params?: any[]) => Promise<any>;
  clearError: () => void;
  
  // Utilities
  isChainSupported: (chainId: string) => boolean;
  
  // Common operations
  requestAccounts: () => Promise<string[]>;
  switchChain: (chainId: string) => Promise<void>;
  addChain: (chainConfig: ChainConfig) => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  signTypedData: (typedData: any) => Promise<string>;
  
  // Balance operations
  getBalance: (address?: string) => Promise<string>;
  getTokenBalance: (tokenAddress: string, address?: string) => Promise<string>;
}

export interface ChainConfig {
  chainId: string;
  chainName: string;
  rpcUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrls?: string[];
}

/**
 * Main wallet hook - provides complete wallet functionality
 */
export const useWallet = (): UseWalletReturn => {
  const { state, isChainSupported } = useWalletContext();
  const connectionState = useWalletConnection();
  const operations = useWalletOperations();

  // Memoized provider info
  const providerInfo = useMemo(() => ({
    activeProvider: state.activeProvider?.name || null,
    availableProviders: state.availableProviders.map(p => p.name),
  }), [state.activeProvider, state.availableProviders]);

  /**
   * Request account access
   */
  const requestAccounts = useCallback(async (): Promise<string[]> => {
    return await operations.request('eth_requestAccounts');
  }, [operations]);

  /**
   * Switch to a different chain
   */
  const switchChain = useCallback(async (chainId: string): Promise<void> => {
    try {
      await operations.request('wallet_switchEthereumChain', [{ chainId }]);
    } catch (error: any) {
      // If chain doesn't exist, the error code will be 4902
      if (error.code === 4902) {
        throw new Error(`Chain ${chainId} not added to wallet. Use addChain() first.`);
      }
      throw error;
    }
  }, [operations]);

  /**
   * Add a new chain to the wallet
   */
  const addChain = useCallback(async (chainConfig: ChainConfig): Promise<void> => {
    await operations.request('wallet_addEthereumChain', [chainConfig]);
  }, [operations]);

  /**
   * Sign a message
   */
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!connectionState.address) {
      throw new Error('No connected account');
    }
    
    return await operations.request('personal_sign', [message, connectionState.address]);
  }, [operations, connectionState.address]);

  /**
   * Sign typed data (EIP-712)
   */
  const signTypedData = useCallback(async (typedData: any): Promise<string> => {
    if (!connectionState.address) {
      throw new Error('No connected account');
    }
    
    return await operations.request('eth_signTypedData_v4', [
      connectionState.address,
      JSON.stringify(typedData)
    ]);
  }, [operations, connectionState.address]);

  /**
   * Get ETH balance
   */
  const getBalance = useCallback(async (address?: string): Promise<string> => {
    const targetAddress = address || connectionState.address;
    if (!targetAddress) {
      throw new Error('No address provided');
    }
    
    return await operations.request('eth_getBalance', [targetAddress, 'latest']);
  }, [operations, connectionState.address]);

  /**
   * Get ERC-20 token balance
   */
  const getTokenBalance = useCallback(async (
    tokenAddress: string,
    address?: string
  ): Promise<string> => {
    const targetAddress = address || connectionState.address;
    if (!targetAddress) {
      throw new Error('No address provided');
    }
    
    // ERC-20 balanceOf function signature
    const data = `0x70a08231000000000000000000000000${targetAddress.slice(2)}`;
    
    return await operations.request('eth_call', [
      {
        to: tokenAddress,
        data,
      },
      'latest'
    ]);
  }, [operations, connectionState.address]);

  return {
    // Connection status
    ...connectionState,
    
    // Provider info
    ...providerInfo,
    
    // Operations
    ...operations,
    
    // Utilities
    isChainSupported,
    
    // Common operations
    requestAccounts,
    switchChain,
    addChain,
    signMessage,
    signTypedData,
    
    // Balance operations
    getBalance,
    getTokenBalance,
  };
};

/**
 * Hook for wallet connection status only (lighter alternative)
 */
export const useWalletStatus = () => {
  const { isAvailable, isConnected, isConnecting, address, shortAddress, chainId, error } = useWalletConnection();
  
  return {
    isAvailable,
    isConnected,
    isConnecting,
    address,
    shortAddress,
    chainId,
    error,
    hasWallet: isAvailable,
    needsConnection: isAvailable && !isConnected,
  };
};

/**
 * Hook for wallet connection actions only
 */
export const useWalletActions = () => {
  const { connect, disconnect, clearError } = useWalletOperations();
  
  return {
    connect,
    disconnect,
    clearError,
  };
};

/**
 * Hook that throws if wallet is not connected (for protected components)
 */
export const useConnectedWallet = () => {
  const wallet = useWallet();
  
  if (!wallet.isConnected || !wallet.address) {
    throw new Error('Wallet not connected');
  }
  
  return {
    ...wallet,
    address: wallet.address!, // Type assertion since we checked above
  };
};

/**
 * Hook for specific chain operations
 */
export const useChainOperations = () => {
  const { chainId, switchChain, addChain, isChainSupported } = useWallet();
  
  const switchToChain = useCallback(async (targetChainId: string) => {
    if (chainId === targetChainId) return;
    await switchChain(targetChainId);
  }, [chainId, switchChain]);
  
  const ensureChain = useCallback(async (targetChainId: string, chainConfig?: ChainConfig) => {
    if (chainId === targetChainId) return;
    
    try {
      await switchChain(targetChainId);
    } catch (error: any) {
      if (error.code === 4902 && chainConfig) {
        await addChain(chainConfig);
        await switchChain(targetChainId);
      } else {
        throw error;
      }
    }
  }, [chainId, switchChain, addChain]);
  
  return {
    currentChainId: chainId,
    isChainSupported,
    switchToChain,
    ensureChain,
  };
};