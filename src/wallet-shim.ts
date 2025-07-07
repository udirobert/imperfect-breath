// Wallet provider compatibility layer
// This helps prevent conflicts between different wallet providers that try to inject window.ethereum

// Store the original ethereum provider if it exists
let originalEthereum: any = null;

if (typeof window !== 'undefined') {
  // Save any existing ethereum provider
  if (window.ethereum) {
    originalEthereum = window.ethereum;
    console.log('Original ethereum provider detected and preserved');
  }

  // Create a proxy handler to manage provider conflicts
  const ethereumProxy = {
    // Use a getter to always return the latest window.ethereum
    get: function(target: any, prop: string) {
      const currentProvider = window.ethereum;
      
      if (currentProvider && typeof currentProvider === 'object') {
        return currentProvider[prop];
      }
      
      // Fallback to original provider if current one doesn't have the property
      if (originalEthereum && typeof originalEthereum === 'object') {
        return originalEthereum[prop];
      }
      
      return undefined;
    }
  };

  // Create a safe proxy object that won't break if wallet extensions modify window.ethereum
  const safeEthereumProxy = new Proxy({}, ethereumProxy);

  // Override the ethereum property with a getter/setter
  Object.defineProperty(window, 'ethereum', {
    configurable: true,
    enumerable: true,
    get: function() {
      // Return the actual window.ethereum or our proxy if it's been overwritten
      return window.hasOwnProperty('ethereum') ? window.ethereum : safeEthereumProxy;
    },
    set: function(newValue) {
      console.log('A wallet extension is trying to set window.ethereum');
      // Store the original value if this is our first provider
      if (!originalEthereum) {
        originalEthereum = newValue;
      }
      // Let the new provider take over but keep track of our original
      Object.defineProperty(window, 'ethereum', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: newValue
      });
    }
  });

  // Add a way to access the original provider if needed
  (window as any).__originalEthereum = originalEthereum;
}

// Add type definitions
declare global {
  interface Window {
    ethereum?: any;
    __originalEthereum?: any;
  }
}

export {};