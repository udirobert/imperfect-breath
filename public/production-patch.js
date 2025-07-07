/**
 * Production Emergency Patch
 *
 * This is a final solution for production that NEVER tries to modify window.ethereum.
 * It provides a completely safe way to access wallets without property redefinition.
 */

(function () {
  // Check if we're in production
  const isProduction =
    window.location.hostname !== "localhost" &&
    !window.location.hostname.includes("127.0.0.1");

  // Check if ethereum property is already protected
  const ethereumIsProtected =
    window.__ethereumProtection && window.__ethereumProtection.protected;

  console.log(
    "Production patch initializing, ethereum protected:",
    ethereumIsProtected
  );

  // Create a container to track providers - with a limit on history size
  window.__walletState = {
    providers: [],
    current: null,
    original: null,
    backpack: null,
    initialized: Date.now(),
    monitor: null,
    maxProviderHistory: 10, // Limit history size to prevent memory issues
  };

  // Save original ethereum reference WITHOUT modifying the property
  if (window.ethereum) {
    // Use getSafeEthereum if available (from ethereum-protector.js)
    const safeReference = window.getSafeEthereum
      ? window.getSafeEthereum()
      : window.ethereum;

    window.__walletState.original = safeReference;
    window.__walletState.current = safeReference;

    // Record this provider
    window.__walletState.providers.push({
      name: "original",
      provider: safeReference,
      timestamp: Date.now(),
    });

    // Special handling for Backpack
    if (safeReference._isBackpack) {
      window.__walletState.backpack = safeReference;
    }

    console.log(
      "[PATCH] Original provider saved without modifying window.ethereum"
    );
  }

  // Global safe wallet API - NEVER tries to modify window.ethereum
  window.walletApi = {
    // Get current provider without modifying window.ethereum
    getProvider: function () {
      // Use latest reference from our state tracking
      return window.__walletState.current || window.ethereum;
    },

    // Safe request implementation that tries multiple providers
    request: async function (method, params) {
      // Try window.ethereum first (current live provider)
      if (window.ethereum && typeof window.ethereum.request === "function") {
        try {
          return await window.ethereum.request({ method, params });
        } catch (err) {
          console.warn("[PATCH] Error using window.ethereum:", err);
          // Continue to fallbacks
        }
      }

      // Then try our tracked providers
      for (const p of [
        window.__walletState.current,
        window.__walletState.backpack,
        window.__walletState.original,
      ]) {
        if (p && typeof p.request === "function" && p !== window.ethereum) {
          try {
            return await p.request({ method, params });
          } catch (err) {
            // Try next provider
            continue;
          }
        }
      }

      throw new Error("No working wallet provider found");
    },

    // Check if a wallet is available
    isAvailable: function () {
      return !!(window.ethereum || window.__walletState.current);
    },
  };

  // Set up a monitoring system that doesn't modify properties
  // and avoids excessive memory usage or recursion
  function startMonitor() {
    if (window.__walletState.monitor) {
      clearInterval(window.__walletState.monitor);
    }

    window.__walletState.monitor = setInterval(function () {
      try {
        // Always use getSafeEthereum if available to avoid redefinition issues
        const currentProvider = window.getSafeEthereum
          ? window.getSafeEthereum()
          : window.ethereum;

        // Simple equality check to avoid deep comparison that might cause recursion
        const hasChanged = currentProvider !== window.__walletState.current;

        if (hasChanged) {
          // Update our tracked reference WITHOUT modifying the property
          window.__walletState.current = currentProvider;

          // Special handling for Backpack
          if (currentProvider && currentProvider._isBackpack) {
            window.__walletState.backpack = currentProvider;
          }

          // Only store a reference, not the whole provider object
          // This helps avoid circular references
          const providerInfo = {
            name:
              currentProvider && currentProvider._isBackpack
                ? "backpack"
                : "unknown",
            timestamp: Date.now(),
            // Store simple identifier instead of full provider object
            providerId:
              Date.now().toString(36) + Math.random().toString(36).substr(2),
          };

          // Add to providers array with size limit
          window.__walletState.providers.push(providerInfo);

          // Keep array size limited to prevent memory issues
          if (
            window.__walletState.providers.length >
            window.__walletState.maxProviderHistory
          ) {
            window.__walletState.providers =
              window.__walletState.providers.slice(
                -window.__walletState.maxProviderHistory
              );
          }

          console.log("[PATCH] Provider change detected, tracking updated");
        }
      } catch (err) {
        // Catch any errors to prevent crashing the monitor
        console.warn("[PATCH] Error in wallet monitor:", err.message);
      }
    }, 1000);
  }

  // Start monitoring ethereum changes
  startMonitor();

  // Add a shim function that old code might expect
  window.__fixWalletConflicts = function () {
    // This doesn't try to modify window.ethereum at all
    // It just ensures our tracking is up-to-date
    const currentProvider = window.getSafeEthereum
      ? window.getSafeEthereum()
      : window.ethereum;

    if (currentProvider !== window.__walletState.current) {
      window.__walletState.current = currentProvider;
    }

    // Report protection status for debugging
    const status = {
      protected: window.__ethereumProtection
        ? window.__ethereumProtection.protected
        : false,
      attempts: window.__ethereumProtection
        ? window.__ethereumProtection.attempts
        : 0,
      trackingUpdated: true,
    };

    console.log("[PATCH] Wallet conflict fix status:", status);

    return status;
  };

  // Patch common error sources
  if (isProduction) {
    // Create global error handler for the specific redefine error
    window.addEventListener(
      "error",
      function (event) {
        if (
          event.message &&
          event.message.includes("Cannot redefine property")
        ) {
          // Prevent the error from breaking the page
          event.preventDefault();
          console.warn(
            "[PATCH] Caught property redefinition error:",
            event.message
          );

          // Restart the monitor
          startMonitor();
          return false;
        }
        return true;
      },
      true
    );
  }

  console.log("[PATCH] Production wallet patch initialized");
})();
