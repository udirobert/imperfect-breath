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
        // If configurable, redefine it to be non-configurable but with same value
        // This prevents other code from redefining it later
        Object.defineProperty(window, "ethereum", {
          value: window.ethereum,
          writable: true,
          enumerable: true,
          configurable: false,
        });
        window.__ethereumProtection.protected = true;
        console.log("Ethereum property protected - made non-configurable");
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
        event.message.includes("redefine property") &&
        event.message.includes("ethereum")
      ) {
        // Record this error
        window.__ethereumProtection.errors.push({
          message: event.message,
          timestamp: Date.now(),
          stack: event.error ? event.error.stack : null,
        });

        window.__ethereumProtection.attempts++;

        // Log it
        originalConsole.warn(
          "Caught attempt to redefine ethereum property:",
          event.message
        );

        // Prevent default error behavior
        event.preventDefault();

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

        return false;
      }
      return true;
    },
    true
  );

  // Define a helper function to safely access ethereum that others can use
  window.getSafeEthereum = function () {
    // Always return the current ethereum value without trying to redefine it
    return window.ethereum;
  };

  console.log("Ethereum property protection initialized");
})();
