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

  // Create a container to track providers
  window.__walletState = {
    providers: [],
    current: null,
    original: null,
    backpack: null,
    initialized: Date.now(),
    monitor: null,
  };

  // Save original ethereum reference WITHOUT modifying the property
  if (window.ethereum) {
    window.__walletState.original = window.ethereum;
    window.__walletState.current = window.ethereum;

    // Record this provider
    window.__walletState.providers.push({
      name: "original",
      provider: window.ethereum,
      timestamp: Date.now(),
    });

    // Special handling for Backpack
    if (window.ethereum._isBackpack) {
      window.__walletState.backpack = window.ethereum;
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
  function startMonitor() {
    if (window.__walletState.monitor) {
      clearInterval(window.__walletState.monitor);
    }

    window.__walletState.monitor = setInterval(function () {
      // Check if ethereum has changed
      if (window.ethereum !== window.__walletState.current) {
        // Update our tracked reference WITHOUT modifying the property
        window.__walletState.current = window.ethereum;

        // Special handling for Backpack
        if (window.ethereum && window.ethereum._isBackpack) {
          window.__walletState.backpack = window.ethereum;
        }

        // Record this provider
        window.__walletState.providers.push({
          name:
            window.ethereum && window.ethereum._isBackpack
              ? "backpack"
              : "unknown",
          provider: window.ethereum,
          timestamp: Date.now(),
        });

        console.log("[PATCH] Provider change detected, tracking updated");
      }
    }, 1000);
  }

  // Start monitoring ethereum changes
  startMonitor();

  // Add a shim function that old code might expect
  window.__fixWalletConflicts = function () {
    // This doesn't try to modify window.ethereum at all
    // It just ensures our tracking is up-to-date
    if (window.ethereum !== window.__walletState.current) {
      window.__walletState.current = window.ethereum;
    }
    return true;
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
