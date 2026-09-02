import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { config as wagmiConfig } from '@/lib/wagmi/config';
import { WalletProvider } from '@/lib/wallet/wallet-context';
import { queryClient } from '@/lib/query/config';

interface EagerWeb3ProviderProps {
  children: React.ReactNode;
}

/**
 * Web3 provider for /profile, /subscription, and wallet auth steps.
 * Wallet login uses wagmi connectors (WalletConnection) — ConnectKit is not
 * mounted. ConnectKit's useConfig() was resolving a different wagmi copy than
 * WagmiProvider, which crashed Sign in with:
 * "ConnectKitProvider must be within a WagmiProvider".
 *
 * QueryClientProvider must sit *inside* WagmiProvider (wagmi v2). Reuse the
 * root client so session-history queries stay on one cache.
 */
export const EagerWeb3Provider: React.FC<EagerWeb3ProviderProps> = ({ children }) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider autoConnect={false}>
          {children}
        </WalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default EagerWeb3Provider;
