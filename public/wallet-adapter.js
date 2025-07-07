/**
 * Wallet Provider Compatibility Script
 * This script runs before any other scripts to handle wallet provider conflicts
 * Specifically targeting Backpack extension conflicts
 */

(function () {
  // Save the original console methods
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  // Flag to detect wallet provider conflicts
  let walletProviderConflicts = false;

  // Store the original provider if it exists
  if (typeof window !== "undefined" && window.ethereum) {
    window.__originalEthereum = window.ethereum;

    // Log when a wallet tries to override ethereum
    const ethereumDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "ethereum"
    );

    if (ethereumDescriptor && ethereumDescriptor.configurable) {
      Object.defineProperty(window, "ethereum", {
        configurable: true,
        enumerable: true,
        get: function () {
          return window.__originalEthereum;
        },
        set: function (newValue) {
          // Detect conflict if the new value is different from current
          if (newValue !== window.__originalEthereum) {
            walletProviderConflicts = true;
            originalConsole.warn(
              "Wallet provider conflict detected: Another wallet is trying to override window.ethereum"
            );
          }

          // Store the new provider while preserving the original
          window.__latestEthereum = newValue;

          // If Backpack is detected, handle it specially
          if (
            newValue &&
            typeof newValue === "object" &&
            newValue._isBackpack
          ) {
            originalConsole.log(
              "Backpack wallet detected, using special handling"
            );

            // Keep Backpack's reference but don't let it override the property
            window.__backpackEthereum = newValue;

            // Create merged provider if needed
            if (
              window.__originalEthereum &&
              window.__originalEthereum !== newValue
            ) {
              window.__mergedProvider = {
                ...window.__originalEthereum,
                // Add Backpack-specific properties
                _isBackpack: true,
                // Make sure request method works for both
                request: async function (payload) {
                  try {
                    if (
                      window.__backpackEthereum &&
                      typeof window.__backpackEthereum.request === "function"
                    ) {
                      return await window.__backpackEthereum.request(payload);
                    } else if (
                      window.__originalEthereum &&
                      typeof window.__originalEthereum.request === "function"
                    ) {
                      return await window.__originalEthereum.request(payload);
                    }
                  } catch (error) {
                    originalConsole.error("Error in ethereum.request:", error);
                    throw error;
                  }
                },
              };

              // Use merged provider
              window.__originalEthereum = window.__mergedProvider;
            } else {
              // Just use Backpack if it's the first provider
              window.__originalEthereum = newValue;
            }
          } else {
            // For non-Backpack wallets, just store the latest
            window.__originalEthereum = newValue;
          }
        },
      });
    }
  }

  // Create detection and recovery function
  window.__fixWalletConflicts = function () {
    if (walletProviderConflicts) {
      originalConsole.log("Attempting to fix wallet provider conflicts...");

      // First try the merged provider if we have one
      if (window.__mergedProvider) {
        window.ethereum = window.__mergedProvider;
        return true;
      }

      // If Backpack is trying to override, let it
      if (window.__backpackEthereum) {
        window.ethereum = window.__backpackEthereum;
        return true;
      }

      // Use the latest provider as fallback
      if (window.__latestEthereum) {
        window.ethereum = window.__latestEthereum;
        return true;
      }

      return false;
    }
    return true; // No conflicts to fix
  };

  // Run detection on DOM content loaded
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
      window.__fixWalletConflicts();
    }, 500); // Small delay to let wallets initialize
  });
})();
