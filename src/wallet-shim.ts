// Non-intrusive Wallet Compatibility Layer
// This safely integrates with the wallet-adapter.js in public/ 
// without modifying window.ethereum

// Store the original ethereum provider if it exists
let originalEthereum: any = null;

if (typeof window !== 'undefined') {
  // Reference the original provider without modifying it
  if (window.ethereum) {
    originalEthereum = window.ethereum;
    console.log('Original ethereum provider detected in wallet-shim.ts');
  }
  
  // Create the safe wallet accessor
  const getSafeProvider = () => {
    // First try production patch API if available
    if (window.walletApi && typeof window.walletApi.getProvider === 'function') {
      return window.walletApi.getProvider();
    }
    
    // Then try the safeWallet provided by wallet-adapter.js if available
    if (window.safeWallet && typeof window.safeWallet.getProvider === 'function') {
      return window.safeWallet.getProvider();
    }
    
    // Fallback to direct ethereum reference if neither API is available
    return window.ethereum || originalEthereum;
  };
  
  // Create safe request method
  const safeRequest = async (method: string, params?: any[]) => {
    // First try production patch API if available
    if (window.walletApi && typeof window.walletApi.request === 'function') {
      try {
        return await window.walletApi.request(method, params);
      } catch (err) {
        console.warn('Error using production walletApi, falling back:', err);
        // Continue to fallbacks
      }
    }
    
    // Then try safeWallet.request if available
    if (window.safeWallet && typeof window.safeWallet.request === 'function') {
      try {
        return await window.safeWallet.request(method, params);
      } catch (err) {
        console.warn('Error using safeWallet, falling back:', err);
        // Continue to fallbacks
      }
    }
    
    // Fallback to direct ethereum request
    const provider = getSafeProvider();
    if (provider && typeof provider.request === 'function') {
      return await provider.request({ method, params });
    }
    
    throw new Error('No wallet provider available');
  };
  
  // Export safe provider access for the application
  (window as any).__safeProvider = {
    getProvider: getSafeProvider,
    request: safeRequest,
    isConnected: () => !!getSafeProvider(),
    getAddress: async () => {
      try {
        const accounts = await safeRequest('eth_requestAccounts');
        return accounts?.[0];
      } catch (error) {
        console.error('Error getting address:', error);
        return null;
      }
    }
  };
}

// Add type definitions
declare global {
  interface Window {
    ethereum?: any;
    __originalEthereum?: any;
    __safeProvider?: {
      getProvider: () => any;
      request: (method: string, params?: any[]) => Promise<any>;
      isConnected: () => boolean;
      getAddress: () => Promise<string | null>;
    };
    safeWallet?: {
      getProvider: () => any;
      request: (method: string, params?: any[]) => Promise<any>;
      isAvailable: () => boolean;
      getAddress: () => Promise<string | null>;
      getChainId: () => Promise<string | null>;
    };
    walletApi?: {
      getProvider: () => any;
      request: (method: string, params?: any[]) => Promise<any>;
      isAvailable: () => boolean;
    };
    __walletState?: {
      providers: Array<{name: string, provider: any, timestamp: number}>;
      current: any;
      original: any;
      backpack: any;
      initialized: number;
      monitor: number | null;
    };
    __walletTracker?: {
      initialProvider: any;
      currentProvider: any;
      providers: any[];
      hasBackpack: boolean;
      backpackProvider?: any;
      initialized: number;
      recordProvider: (provider: any, name?: string) => void;
      getBestProvider: () => any;
      safeRequest: (method: string, params?: any[]) => Promise<any>;
    };
    __fixWalletConflicts?: () => boolean;
    onWalletAvailable?: (callback: (provider: any) => void) => void;
    getSafeProvider?: () => any;
  }
}

export {};