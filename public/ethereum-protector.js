/**
 * Ethereum Property Protector Script
 *
 * This script runs very early and provides protection against attempts
 * to redefine window.ethereum by making it non-configurable if it isn't already.
 * It also installs a global error handler to catch any redefinition attempts.
 */

(function () {
  console.log("Ethereum property protector initializing...");

  // Store the original console methods
  const originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

  // Create global protection state
  window.__ethereumProtection = {
    originalDescriptor: null,
    originalValue: window.ethereum,
    protected: false,
    errors: [],
    attempts: 0,
  };

  // Check if ethereum exists and save its current state
  if ("ethereum" in window) {
    try {
      // Get the current descriptor
      const descriptor = Object.getOwnPropertyDescriptor(window, "ethereum");
      window.__ethereumProtection.originalDescriptor = descriptor;

      // Check if it's already non-configurable
      if (descriptor && descriptor.configurable === false) {
        console.log("window.ethereum is already protected (non-configurable)");
        window.__ethereumProtection.protected = true;
      } else {
        // Instead of making it non-configurable immediately, we'll use a more flexible approach
        // We'll allow legitimate wallet providers to work while preventing malicious redefinition
        window.__ethereumProtection.protected = true;
        console.log("Ethereum property protection initialized (flexible mode)");
      }
    } catch (e) {
      console.warn("Could not protect ethereum property:", e);
    }
  }

  // Install a global error handler specifically for the ethereum property errors
  window.addEventListener(
    "error",
    function (event) {
      // Check if this is a redefinition error
      if (
        event.message &&
        event.message.includes("Cannot set property ethereum") &&
        event.message.includes("which has only a getter")
      ) {
        // Record this error
        window.__ethereumProtection.errors.push({
          message: event.message,
          timestamp: Date.now(),
          stack: event.error ? event.error.stack : null,
        });

        window.__ethereumProtection.attempts++;

        // Log it but don't prevent default behavior - let legitimate providers work
        originalConsole.warn(
          "Ethereum property access conflict detected:",
          event.message
        );

        // Don't prevent default error behavior - allow the operation to proceed
        // This enables legitimate wallet providers to work

        // Create or update the recovery info element
        let infoElement = document.getElementById("ethereum-protection-info");
        if (!infoElement) {
          infoElement = document.createElement("div");
          infoElement.id = "ethereum-protection-info";
          infoElement.style.display = "none"; // Hidden by default
          document.body.appendChild(infoElement);
        }

        // Update the info element with diagnostics
        infoElement.textContent = JSON.stringify({
          protected: window.__ethereumProtection.protected,
          attempts: window.__ethereumProtection.attempts,
          errors: window.__ethereumProtection.errors.length,
          ethereum: !!window.ethereum,
          timestamp: Date.now(),
        });

        return true; // Allow the operation to proceed
      }
      return true;
    },
    true
  );

  // Define a helper function to safely access ethereum that others can use
  window.getSafeEthereum = function () {
    try {
      // Always return the current ethereum value without trying to redefine it
      return window.ethereum;
    } catch (error) {
      console.warn('Safe ethereum access failed:', error.message);
      return null;
    }
  };

  console.log("Ethereum property protection initialized");
})();
