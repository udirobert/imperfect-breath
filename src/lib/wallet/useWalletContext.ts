import React, { useContext } from 'react';
import { WalletContextValue } from './wallet-context';

const WalletContext = React.createContext<WalletContextValue | null>(null);

/**
 * Hook to access wallet context
 */
export const useWalletContext = (): WalletContextValue => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};

/**
 * Hook for wallet connection status
 */
export const useWalletConnection = () => {
  const { state } = useWalletContext();
  return {
    isAvailable: state.isAvailable,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    address: state.address,
    shortAddress: state.address ? `${state.address.slice(0, 6)}...${state.address.slice(-4)}` : null,
    chainId: state.chainId,
    error: state.error,
  };
};

/**
 * Hook for wallet operations
 */
export const useWalletOperations = () => {
  const { connect, disconnect, switchProvider, request, clearError } = useWalletContext();
  return {
    connect,
    disconnect,
    switchProvider,
    request,
    clearError,
  };
};