/**
 * Wallet Provider Compatibility Script - Fixed Version
 *
 * This script handles wallet provider conflicts between extensions
 * and uses a safe approach to avoid property redefinition errors
 */

(function () {
  // Use a closure to avoid polluting global scope
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  // Store wallet info without modifying window.ethereum
  try {
    // Initialize provider tracking
    window.__walletInfo = {
      providerHistory: [],
      conflicts: false,
      initialized: Date.now(),
    };

    // Record the initial state of ethereum
    if (typeof window !== "undefined" && window.ethereum) {
      const initialProvider = window.ethereum;
      window.__walletInfo.original = initialProvider;
      window.__walletInfo.current = initialProvider;

      window.__walletInfo.providerHistory.push({
        name: "initial",
        timestamp: Date.now(),
        isBackpack: initialProvider._isBackpack || false,
      });

      originalConsole.log("Original ethereum provider detected and preserved");
    }

    // Create a safe monitoring function using getters/setters only if possible
    // We'll use Object.getOwnPropertyDescriptor to check if ethereum is configurable
    const ethereumDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "ethereum"
    );

    // Only try to set up monitoring if the property is configurable or doesn't exist yet
    if (!ethereumDescriptor || ethereumDescriptor.configurable) {
      originalConsole.log("Setting up safe ethereum monitoring");

      // Create a storage for the actual provider reference
      const providerStorage = {
        current: window.ethereum,
      };

      // Define a safe property descriptor
      try {
        Object.defineProperty(window, "ethereum", {
          configurable: true, // Keep it configurable for compatibility
          enumerable: true, // Make sure it's visible
          get: function () {
            return providerStorage.current;
          },
          set: function (newProvider) {
            // Track the change
            window.__walletInfo.providerHistory.push({
              name:
                newProvider && newProvider._isBackpack ? "backpack" : "unknown",
              timestamp: Date.now(),
              isBackpack: (newProvider && newProvider._isBackpack) || false,
            });

            // Store the previous provider
            window.__walletInfo.previous = providerStorage.current;

            // Always store latest provider
            window.__walletInfo.current = newProvider;

            if (newProvider !== providerStorage.current) {
              window.__walletInfo.conflicts = true;
              originalConsole.warn("Wallet provider changed");

              // Special handling for Backpack
              if (newProvider && newProvider._isBackpack) {
                window.__walletInfo.backpack = newProvider;
              }
            }

            // Update the storage
            providerStorage.current = newProvider;
          },
        });
      } catch (propError) {
        originalConsole.error(
          "Failed to setup ethereum property monitoring:",
          propError
        );
      }
    } else {
      // Property is not configurable, use a different approach
      originalConsole.warn(
        "ethereum property is not configurable, using alternative tracking"
      );

      // Set up an interval to check for changes to window.ethereum
      const monitorInterval = setInterval(function () {
        const currentProvider = window.ethereum;

        // If the provider has changed
        if (currentProvider !== window.__walletInfo.current) {
          window.__walletInfo.previous = window.__walletInfo.current;
          window.__walletInfo.current = currentProvider;
          window.__walletInfo.conflicts = true;

          window.__walletInfo.providerHistory.push({
            name:
              currentProvider && currentProvider._isBackpack
                ? "backpack"
                : "unknown",
            timestamp: Date.now(),
            isBackpack:
              (currentProvider && currentProvider._isBackpack) || false,
          });

          // Special handling for Backpack
          if (currentProvider && currentProvider._isBackpack) {
            window.__walletInfo.backpack = currentProvider;
          }

          originalConsole.warn("Wallet provider changed (detected by monitor)");
        }
      }, 1000);

      // Store the interval ID so it can be cleared if needed
      window.__walletInfo.monitorInterval = monitorInterval;
    }

    // Add a recovery function that doesn't try to modify the property directly
    window.__fixWalletConflicts = function () {
      if (!window.__walletInfo.conflicts) {
        return true; // No conflicts detected
      }

      originalConsole.log("Attempting to fix wallet provider conflicts...");

      try {
        // Check if we have the property descriptor
        const descriptor = Object.getOwnPropertyDescriptor(window, "ethereum");

        if (descriptor && descriptor.configurable) {
          // We can safely modify the property

          // Prefer Backpack if detected (special handling)
          if (window.__walletInfo.backpack) {
            originalConsole.log("Using Backpack provider");
            window.ethereum = window.__walletInfo.backpack;
            return true;
          }

          // Otherwise use latest provider
          if (window.__walletInfo.current) {
            window.ethereum = window.__walletInfo.current;
            return true;
          }
        } else {
          // Cannot modify property directly
          originalConsole.warn(
            "Cannot modify ethereum property - using workaround"
          );

          // Store information for other scripts to use
          window.__walletInfo.preferredProvider =
            window.__walletInfo.backpack ||
            window.__walletInfo.current ||
            window.__walletInfo.original;

          // Return the status
          return window.__walletInfo.preferredProvider !== undefined;
        }
      } catch (error) {
        originalConsole.error(
          "Error during wallet conflict resolution:",
          error
        );
        return false;
      }

      return false;
    };

    // Run the fix after a delay to let wallet extensions initialize
    setTimeout(function () {
      window.__fixWalletConflicts();
    }, 1000);
  } catch (error) {
    // Global error handler
    originalConsole.error("Wallet adapter error:", error);
  }
})();
