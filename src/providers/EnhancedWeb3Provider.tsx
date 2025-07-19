import React, { createContext, useContext } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, polygon, arbitrum, base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { injected, metaMask, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { lensTestnet, lensMainnet } from '../lib/wagmi/chains';
import { config as envConfig } from '../config/environment';

// Custom chain for Story Protocol
const storyTestnet = {
  id: 11155111,
  name: 'Story Protocol Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc.sepolia.org'] },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
  },
  testnet: true,
} as const;

// Flow is not EVM compatible, so we handle it separately
const supportedChains = [
  mainnet,
  sepolia,
  polygon,
  arbitrum,
  base,
  lensTestnet,
  storyTestnet,
];

// Get API keys from environment
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';
const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY || '';

// Create Wagmi configuration with ConnectKit
const wagmiConfig = createConfig(
  getDefaultConfig({
    chains: supportedChains,
    transports: {
      [mainnet.id]: http(alchemyApiKey ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}` : undefined),
      [sepolia.id]: http(alchemyApiKey ? `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}` : undefined),
      [polygon.id]: http('https://polygon-rpc.com'),
      [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
      [base.id]: http('https://mainnet.base.org'),
      [lensTestnet.id]: http(envConfig.lens.rpcUrl),
      [storyTestnet.id]: http(envConfig.story.rpcUrl),
    },
    walletConnectProjectId,
    appName: envConfig.app.name,
    appDescription: envConfig.app.description,
    appUrl: envConfig.app.url,
    appIcon: envConfig.app.icon,
  })
);

// Create optimized query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

// Enhanced Web3 Context
interface EnhancedWeb3ContextType {
  isConnectKitReady: boolean;
  supportedChainIds: number[];
  isTestnetMode: boolean;
}

const EnhancedWeb3Context = createContext<EnhancedWeb3ContextType | null>(null);

export const useEnhancedWeb3 = () => {
  const context = useContext(EnhancedWeb3Context);
  if (!context) {
    throw new Error('useEnhancedWeb3 must be used within EnhancedWeb3Provider');
  }
  return context;
};

interface EnhancedWeb3ProviderProps {
  children: React.ReactNode;
}

export const EnhancedWeb3Provider: React.FC<EnhancedWeb3ProviderProps> = ({
  children,
}) => {
  const isTestnetMode = envConfig.development.debugMode || import.meta.env.DEV;
  const supportedChainIds = supportedChains.map(chain => chain.id);

  const contextValue: EnhancedWeb3ContextType = {
    isConnectKitReady: true,
    supportedChainIds,
    isTestnetMode,
  };

  return (
    <EnhancedWeb3Context.Provider value={contextValue}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <ConnectKitProvider
            theme="rounded"
            mode={isTestnetMode ? "dark" : "light"}
            customTheme={{
              "--ck-accent-color": "#8B5CF6",
              "--ck-accent-text-color": "#ffffff",
              "--ck-border-radius": "16px",
              "--ck-font-family": "Inter, system-ui, sans-serif",
            }}
            options={{
              hideTooltips: false,
              hideQuestionMarkCTA: true,
              hideNoWalletCTA: false,
              hideRecentBadge: true,
              enforceSupportedChains: !isTestnetMode, // Allow any chain in testnet mode
              embedGoogleFonts: true,
              reducedMotion: false,
              disclaimer: (
                <>
                  By connecting your wallet, you agree to our{' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`${envConfig.app.url}/terms`}
                    style={{ color: 'var(--ck-accent-color)' }}
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`${envConfig.app.url}/privacy`}
                    style={{ color: 'var(--ck-accent-color)' }}
                  >
                    Privacy Policy
                  </a>
                  .
                </>
              ),
            }}
          >
            {children}
          </ConnectKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </EnhancedWeb3Context.Provider>
  );
};

// Export the config for external use
export { wagmiConfig };

// Helper functions for working with different chains
export const getChainInfo = (chainId: number) => {
  return supportedChains.find(chain => chain.id === chainId);
};

export const isLensChain = (chainId: number) => {
  return chainId === lensTestnet.id || chainId === lensMainnet.id;
};

export const isStoryChain = (chainId: number) => {
  return chainId === storyTestnet.id;
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
  if (error.message.includes('User rejected')) {
    return 'Transaction was rejected by user';
  }
  if (error.message.includes('insufficient funds')) {
    return 'Insufficient funds for transaction';
  }
  if (error.message.includes('network')) {
    return 'Network error. Please check your connection and try again';
  }
  return error.message || 'An unexpected error occurred';
};

// Debugging helpers
export const logWalletState = () => {
  if (envConfig.development.debugMode) {
    console.log('Enhanced Web3 Provider State:', {
      supportedChains: supportedChains.map(c => ({ id: c.id, name: c.name })),
      walletConnectProjectId: walletConnectProjectId ? 'configured' : 'missing',
      alchemyApiKey: alchemyApiKey ? 'configured' : 'missing',
      isTestnetMode: envConfig.development.debugMode || import.meta.env.DEV,
    });
  }
};
