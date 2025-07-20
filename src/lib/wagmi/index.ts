import { http, createConfig, createStorage } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// Helper function to safely get the wallet provider
const getSafeProvider = () => {
  if (typeof window === "undefined") return undefined;

  // Use our safe wallet access methods
  if (window.getSafeProvider && typeof window.getSafeProvider === "function") {
    return window.getSafeProvider();
  }

  // Fallback to direct access if safe methods aren't available
  return window.ethereum;
};

// Function to log when a wallet connection is made - called externally
export const logWalletConnection = () => {
  console.log("Safe wallet connector connected");
  // Log wallet state for debugging
  if (typeof window !== "undefined" && window.__walletState) {
    const provider = getSafeProvider();
    if (provider) {
      window.__walletState.providers.push({
        name: "connector-connected",
        provider: provider,
        timestamp: Date.now(),
      });
    }
  }
};

// Create a custom connector that uses our safe wallet access methods
const createSafeInjectedConnector = () => {
  return injected({
    // Use the standard injected connector but with disconnect shimming
    shimDisconnect: true,
  });
};

// Configure wagmi with production-safe connectors
export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  // Use our safe injected connector
  connectors: [createSafeInjectedConnector()],
  // Use sessionStorage to persist state between page reloads - safely
  storage: createStorage({
    storage: typeof window !== "undefined" ? window.sessionStorage : undefined,
  }),
});

// Helper to track wallet errors for diagnostic purposes
const trackWalletError = (errorType: string, errorDetails: unknown) => {
  if (typeof window !== "undefined" && window.__walletState) {
    console.warn(`[Wallet Error]: ${errorType}`, errorDetails);
    // Only add to the providers array if it has the right structure
    try {
      window.__walletState.providers.push({
        name: `error-${errorType}`,
        provider: { error: String(errorDetails) },
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error("Error tracking wallet state:", e);
    }
  }
};

// Export safe wallet interface for use in the app
export const safeWallet = {
  getProvider: () => {
    if (typeof window === "undefined") return undefined;

    if (
      window.getSafeProvider &&
      typeof window.getSafeProvider === "function"
    ) {
      return window.getSafeProvider();
    }

    return window.ethereum;
  },

  isAvailable: () => {
    if (typeof window === "undefined") return false;

    // Check production patch API first
    if (
      window.walletApi &&
      typeof window.walletApi.isAvailable === "function"
    ) {
      return window.walletApi.isAvailable();
    }

    // Then check original safe wallet
    if (
      window.safeWallet &&
      typeof window.safeWallet.isAvailable === "function"
    ) {
      return window.safeWallet.isAvailable();
    }

    // Fallback to checking ethereum directly
    return !!window.ethereum;
  },

  // Safe request method that tries multiple provider paths
  request: async (method: string, params?: unknown) => {
    if (typeof window === "undefined") {
      trackWalletError("no-window", "Window not available");
      throw new Error("Window not available");
    }

    // Try production patch API first
    if (window.walletApi && typeof window.walletApi.request === "function") {
      try {
        return await window.walletApi.request(method, params as unknown[]);
      } catch (err) {
        trackWalletError("wallet-api-error", err);
        console.warn(
          "Error using production walletApi, trying alternatives:",
          err,
        );
        // Continue to fallbacks
      }
    }

    // Then try safeWallet
    if (window.safeWallet && typeof window.safeWallet.request === "function") {
      try {
        return await window.safeWallet.request(method, params as unknown[]);
      } catch (err) {
        trackWalletError("safe-wallet-error", err);
        console.warn("Error using safeWallet, trying direct ethereum:", err);
        // Continue to fallbacks
      }
    }

    // Finally try direct ethereum
    const provider = window.ethereum;
    if (provider && typeof provider.request === "function") {
      try {
        return await provider.request({ method, params });
      } catch (err) {
        trackWalletError("ethereum-error", err);
        throw err;
      }
    }

    trackWalletError("no-provider", "No wallet provider available");
    throw new Error("No wallet provider available");
  },
};

// Export Web3 utilities
export {
  getChainInfo,
  isLensChain,
  isFlowCompatible,
  getExplorerUrl,
  getChainCurrency,
  handleWalletError,
  logWalletState,
} from "./web3-utils";
