import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider } from 'connectkit';
import { config as wagmiConfig } from '@/lib/wagmi/config';
import { WalletProvider } from '@/lib/wallet/wallet-context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

interface EagerWeb3ProviderProps {
  children: React.ReactNode;
}

/**
 * Eager Web3 Provider - loads immediately at app startup
 * Use this for routes that need blockchain features available immediately
 */
export const EagerWeb3Provider: React.FC<EagerWeb3ProviderProps> = ({ children }) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <WalletProvider autoConnect={false}>
            {children}
          </WalletProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default EagerWeb3Provider;