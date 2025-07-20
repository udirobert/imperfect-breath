import React, { createContext, useContext } from "react";
import { WagmiProvider, createConfig, http, createStorage } from "wagmi";
import { mainnet, sepolia, polygon, arbitrum, base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import {
  injected,
  metaMask,
  walletConnect,
  coinbaseWallet,
} from "wagmi/connectors";
import { lensTestnet, lensMainnet } from "../lib/wagmi/chains";
import { config as envConfig } from "../config/environment";

// Flow is not EVM compatible, so we handle it separately via FCL
// Primary chains for our app functionality
const supportedChains = [
  lensTestnet, // Primary chain for social features
  mainnet, // Ethereum mainnet for broad compatibility
  arbitrum, // L2 for lower fees
  base, // Coinbase L2
] as const;

// Get API keys from environment
const walletConnectProjectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo-project-id";
const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY || "";

// Create Wagmi configuration with ConnectKit
const wagmiConfig = createConfig(
  getDefaultConfig({
    chains: supportedChains,
    transports: {
      [lensTestnet.id]: http(envConfig.lens.rpcUrl),
      [mainnet.id]: http(
        alchemyApiKey
          ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
          : undefined,
      ),
      [arbitrum.id]: http("https://arb1.arbitrum.io/rpc"),
      [base.id]: http("https://mainnet.base.org"),
    },
    walletConnectProjectId,
    appName: envConfig.app.name,
    appDescription: envConfig.app.description,
    appUrl: envConfig.app.url,
    appIcon: envConfig.app.icon,
    storage: createStorage({
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    }),
  }),
);

// Create optimized query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === "object" && "status" in error) {
          const status = (error as { status: number }).status;
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

// Export context for use in separate hook file
export { EnhancedWeb3Context };

interface EnhancedWeb3ProviderProps {
  children: React.ReactNode;
}

export const EnhancedWeb3Provider: React.FC<EnhancedWeb3ProviderProps> = ({
  children,
}) => {
  const isTestnetMode = envConfig.development.debugMode || import.meta.env.DEV;
  const supportedChainIds = supportedChains.map((chain) => chain.id);

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
              enforceSupportedChains: !isTestnetMode,
              embedGoogleFonts: true,
              reducedMotion: false,
              walletConnectName: "Imperfect Breath",
              initialChainId: lensTestnet.id, // Default to Lens testnet
              disclaimer: (
                <>
                  By connecting your wallet, you agree to our{" "}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`${envConfig.app.url}/terms`}
                    style={{ color: "var(--ck-accent-color)" }}
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`${envConfig.app.url}/privacy`}
                    style={{ color: "var(--ck-accent-color)" }}
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

// Export only the config - utilities and hook are in separate files
export { wagmiConfig };
