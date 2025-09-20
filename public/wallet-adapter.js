/**
 * Wallet Provider Compatibility Script - Final Version
 *
 * This script provides wallet compatibility WITHOUT attempting to modify
 * window.ethereum at all, avoiding the "Cannot redefine property" error
 * that occurs in production environments.
 */

(function () {
  // Save console methods to avoid console overrides
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  try {
    // Initialize the wallet tracker without modifying window.ethereum
    window.__walletTracker = {
      // Store the initial state
      initialProvider: window.ethereum,
      currentProvider: window.ethereum,
      providers: [],
      hasBackpack: false,
      initialized: Date.now(),

      // Record a provider
      recordProvider: function (provider, name) {
        if (!provider) return;

        this.providers.push({
          provider: provider,
          name: name || "unknown",
          timestamp: Date.now(),
          isBackpack: provider._isBackpack || false,
        });

        // Track Backpack specifically
        if (provider._isBackpack) {
          this.hasBackpack = true;
          this.backpackProvider = provider;
        }

        // Update current provider
        this.currentProvider = provider;
      },

      // Get the best provider to use (prioritizing Backpack)
      getBestProvider: function () {
        // Prioritize Backpack if available
        if (this.hasBackpack && this.backpackProvider) {
          return this.backpackProvider;
        }

        // Otherwise use the latest provider
        return this.currentProvider || this.initialProvider || null;
      },

      // Create a safe request method that tries multiple providers
      safeRequest: async function (method, params) {
        const providers = [
          this.currentProvider,
          this.backpackProvider,
          this.initialProvider,
          ...this.providers.map((p) => p.provider),
        ].filter(Boolean);

        // Try each provider
        for (const provider of providers) {
          if (provider && typeof provider.request === "function") {
            try {
              return await provider.request({ method, params });
            } catch (error) {
              // Try next provider
              continue;
            }
          }
        }

        throw new Error("No compatible wallet provider found");
      },
    };

    // Record the initial provider if it exists
    if (window.ethereum) {
      window.__walletTracker.recordProvider(window.ethereum, "initial");
      originalConsole.log("Initial ethereum provider detected and preserved");
    }

    // Create a monitor that periodically checks for changes to window.ethereum
    // without attempting to redefine the property
    function monitorEthereumChanges() {
      // Use safe provider access to avoid conflicts
      const currentProvider = window.ethereum || window.__walletTracker.currentProvider;

      // If ethereum has changed
      if (currentProvider !== window.__walletTracker.currentProvider) {
        originalConsole.log("Ethereum provider changed - updating tracker");

        // Record the new provider
        window.__walletTracker.recordProvider(
          currentProvider,
          currentProvider?._isBackpack ? "backpack" : "dynamic"
        );
      }
    }

    // Set up periodic monitoring
    const monitorInterval = setInterval(monitorEthereumChanges, 1000);
    window.__walletTracker.monitorInterval = monitorInterval;

    // Create a global safe wallet interface
    window.safeWallet = {
      // Get the current recommended provider
      getProvider: function () {
        return window.__walletTracker.getBestProvider();
      },

      // Safely request from any available provider
      request: async function (method, params) {
        return await window.__walletTracker.safeRequest(method, params);
      },

      // Check if any provider is available
      isAvailable: function () {
        return window.__walletTracker.getBestProvider() != null;
      },

      // Get Ethereum address
      getAddress: async function () {
        try {
          const accounts = await this.request("eth_requestAccounts");
          return accounts[0];
        } catch (error) {
          console.error("Error getting address:", error);
          return null;
        }
      },

      // Get chain ID
      getChainId: async function () {
        try {
          return await this.request("eth_chainId");
        } catch (error) {
          console.error("Error getting chain ID:", error);
          return null;
        }
      },
    };

    // Define a non-intrusive fix function
    window.__fixWalletConflicts = function () {
      // This function doesn't try to modify window.ethereum
      // It just ensures our tracking is up to date
      monitorEthereumChanges();

      // Return the best provider for reference
      return window.__walletTracker.getBestProvider() != null;
    };

    // Run monitor immediately
    monitorEthereumChanges();

    // Add a helper script to the page
    const helperScript = document.createElement("script");
    helperScript.textContent = `
      // This code runs directly in the page context
      // Use window.safeWallet instead of window.ethereum to avoid conflicts
      console.log('Wallet compatibility layer initialized');
      
      // Patch any immediate access attempts
      if (typeof window.onEthereumAvailable === 'function') {
        window.onEthereumAvailable(window.safeWallet.getProvider());
      }
    `;
    document.head.appendChild(helperScript);
  } catch (error) {
    originalConsole.error("Error in wallet adapter:", error);
  }
})();
