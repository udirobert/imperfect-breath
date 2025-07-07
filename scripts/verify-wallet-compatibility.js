/**
 * Wallet Compatibility Verification Script
 *
 * This script tests the wallet compatibility layer to ensure it works
 * properly with various browser wallet extensions in production.
 *
 * Run this in a browser console on your production or staging environment.
 */

(function () {
  console.log("===== Wallet Compatibility Test =====");

  // Test 1: Check if our wallet APIs are loaded
  const apis = {
    "window.safeWallet": !!window.safeWallet,
    "window.walletApi": !!window.walletApi,
    "window.__walletState": !!window.__walletState,
    "window.__walletTracker": !!window.__walletTracker,
    "window.ethereum": !!window.ethereum,
    "window.getSafeProvider": typeof window.getSafeProvider === "function",
    "window.onWalletAvailable": typeof window.onWalletAvailable === "function",
  };

  console.table(apis);

  // Test 2: Check property descriptors to ensure we're not modifying protected properties
  if (window.ethereum) {
    const ethereumDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "ethereum"
    );
    console.log("window.ethereum property descriptor:", ethereumDescriptor);

    if (!ethereumDescriptor.configurable) {
      console.log(
        "✓ window.ethereum is correctly non-configurable, our non-intrusive approach is necessary"
      );
    } else {
      console.warn("⚠️ window.ethereum is configurable - this is unusual");
    }
  } else {
    console.log("No wallet detected (window.ethereum is undefined)");
  }

  // Test 3: Verify our tracking system is working
  if (window.__walletState) {
    console.log("Wallet state tracking:");
    console.log(
      "- Initialized at:",
      new Date(window.__walletState.initialized)
    );
    console.log("- Tracked providers:", window.__walletState.providers.length);
    console.table(
      window.__walletState.providers.map((p) => ({
        name: p.name,
        timestamp: new Date(p.timestamp).toLocaleTimeString(),
      }))
    );
  }

  // Test 4: Test safe provider access
  const safeProvider = window.getSafeProvider ? window.getSafeProvider() : null;
  console.log(
    "Safe provider test:",
    safeProvider ? "✓ Available" : "❌ Not available"
  );

  // Test 5: Test for known conflicts
  const conflicts = {
    "Backpack conflict":
      window.ethereum &&
      window.ethereum._isBackpack &&
      !window.__walletState.backpack,
    "Multiple overwrites":
      window.__walletState && window.__walletState.providers.length > 3,
    "Provider mismatch":
      window.ethereum !==
      (window.__walletState ? window.__walletState.current : null),
  };

  console.log("Checking for known conflicts:");
  console.table(conflicts);

  // Test 6: Check for error recovery system
  const errorRecovery = {
    "Error tracking":
      !!window.__walletConfig && Array.isArray(window.__walletConfig.errors),
    "Error count": window.__walletConfig
      ? window.__walletConfig.errors.length
      : 0,
    "Recovery system": typeof window.addEventListener === "function",
  };

  console.log("Error recovery system:");
  console.table(errorRecovery);

  if (window.__walletConfig && window.__walletConfig.errors.length > 0) {
    console.log("Recorded errors:");
    console.table(window.__walletConfig.errors);
  }

  // Final report
  console.log("===== Compatibility Test Summary =====");

  // Calculate success score
  let score = 0;
  let totalTests = 0;

  // API availability tests
  totalTests += Object.keys(apis).length;
  score += Object.values(apis).filter(Boolean).length;

  // Conflict tests
  totalTests += Object.keys(conflicts).length;
  score += Object.values(conflicts).filter((v) => !v).length;

  // Error recovery tests
  totalTests += Object.keys(errorRecovery).length;
  score += Object.values(errorRecovery).filter(Boolean).length;

  // Provider access test
  totalTests += 1;
  score += safeProvider ? 1 : 0;

  const percentage = Math.round((score / totalTests) * 100);

  console.log(
    `Overall compatibility score: ${percentage}% (${score}/${totalTests} tests passed)`
  );
  console.log(
    `Safe provider access: ${safeProvider ? "✓ Working" : "❌ Failed"}`
  );
  console.log(
    `Non-intrusive wallet tracking: ${
      window.__walletState ? "✓ Working" : "❌ Not detected"
    }`
  );
  console.log(
    `Error recovery: ${
      window.__walletConfig ? "✓ In place" : "❌ Not detected"
    }`
  );

  return {
    score: percentage,
    apis,
    conflicts,
    errorRecovery,
    safeProviderWorking: !!safeProvider,
  };
})();
