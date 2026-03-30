import React, { createContext, useContext, useState, useEffect, Suspense } from 'react';

interface Web3ContextValue {
  isReady: boolean;
}

const Web3Context = createContext<Web3ContextValue>({ isReady: false });

export const useWeb3Ready = () => useContext(Web3Context);

interface LazyWeb3ProviderProps {
  children: React.ReactNode;
}

const Web3LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-pulse flex space-x-2">
      <div className="rounded-full bg-blue-400 h-3 w-3"></div>
      <div className="rounded-full bg-blue-400 h-3 w-3"></div>
      <div className="rounded-full bg-blue-400 h-3 w-3"></div>
    </div>
  </div>
);

const Web3ProviderInner: React.FC<{ children: React.ReactNode; wagmiConfig: any }> = ({ children, wagmiConfig }) => {
  const [WagmiProvider, setWagmiProvider] = useState<React.ComponentType<{ children: React.ReactNode; config: any }> | null>(null);
  const [ConnectKitProvider, setConnectKitProvider] = useState<React.ComponentType<{ children: React.ReactNode }> | null>(null);
  const [WalletProvider, setWalletProvider] = useState<React.ComponentType<{ children: React.ReactNode; autoConnect?: boolean }> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const [wagmiModule, connectKitModule, walletModule] = await Promise.all([
          import('wagmi'),
          import('connectkit'),
          import('../lib/wallet/wallet-context'),
        ]);

        setWagmiProvider(() => wagmiModule.WagmiProvider);
        setConnectKitProvider(() => connectKitModule.ConnectKitProvider);
        setWalletProvider(() => walletModule.WalletProvider);
      } catch (error) {
        console.error('Failed to load Web3 providers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProviders();
  }, []);

  if (isLoading || !WagmiProvider || !ConnectKitProvider || !WalletProvider) {
    return <Web3LoadingFallback />;
  }

  return (
    <Web3Context.Provider value={{ isReady: true }}>
      <WagmiProvider config={wagmiConfig}>
        <ConnectKitProvider>
          <WalletProvider autoConnect={false}>
            {children}
          </WalletProvider>
        </ConnectKitProvider>
      </WagmiProvider>
    </Web3Context.Provider>
  );
};

export const LazyWeb3Provider: React.FC<LazyWeb3ProviderProps> = ({ children }) => {
  const [wagmiConfig, setWagmiConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    import('../lib/wagmi/config')
      .then(module => {
        setWagmiConfig(module.config);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Failed to load wagmi config:', error);
        setIsLoading(false);
      });
  }, []);

  if (isLoading || !wagmiConfig) {
    return <Web3LoadingFallback />;
  }

  return (
    <Suspense fallback={<Web3LoadingFallback />}>
      <Web3ProviderInner wagmiConfig={wagmiConfig}>
        {children}
      </Web3ProviderInner>
    </Suspense>
  );
};

export default LazyWeb3Provider;
