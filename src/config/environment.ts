// Centralized environment configuration for multichain architecture

interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  flow: {
    accessNode: string;
    discoveryWallet: string;
    contractAddress: string;
    fungibleToken: string;
    flowToken: string;
  };
  lens: {
    environment: "testnet" | "mainnet";
    apiUrl: string;
    appAddress: string;
    rpcUrl: string;
    chainId: string;
    explorerUrl: string;
    currencySymbol: string;
  };
  ai: {
    geminiApiKey: string;
  };
  app: {
    name: string;
    description: string;
    url: string;
    icon: string;
  };
  development: {
    debugMode: boolean;
    enableAnalytics: boolean;
  };
}

// Validate critical environment variables (only throw for truly required ones)
const criticalEnvVars = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
] as const;

// Check for missing critical environment variables
const missingCriticalVars = criticalEnvVars.filter(
  (varName) => !import.meta.env[varName],
);

if (missingCriticalVars.length > 0) {
  console.error("Missing critical environment variables:", missingCriticalVars);
  throw new Error(
    `Missing critical environment variables: ${missingCriticalVars.join(", ")}`,
  );
}

// Warn about missing optional variables
const optionalEnvVars = [
  "VITE_FLOW_ACCESS_NODE",
  "VITE_FLOW_CONTRACT_ADDRESS",
  "VITE_LENS_API_URL",
  "VITE_GEMINI_API_KEY",
] as const;

const missingOptionalVars = optionalEnvVars.filter(
  (varName) => !import.meta.env[varName],
);

if (missingOptionalVars.length > 0) {
  console.warn(
    "Missing optional environment variables (using defaults):",
    missingOptionalVars,
  );
}

export const config: EnvironmentConfig = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL!,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
  },
  flow: {
    accessNode:
      import.meta.env.VITE_FLOW_ACCESS_NODE ||
      "https://rest-testnet.onflow.org",
    discoveryWallet:
      import.meta.env.VITE_FLOW_DISCOVERY_WALLET ||
      "https://fcl-discovery.onflow.org/testnet/authn",
    contractAddress:
      import.meta.env.VITE_FLOW_CONTRACT_ADDRESS || "0xf8d6e0586b0a20c7",
    fungibleToken:
      import.meta.env.VITE_FLOW_FUNGIBLE_TOKEN || "0x9a0766d93b6608b7",
    flowToken: import.meta.env.VITE_FLOW_FLOW_TOKEN || "0x7e60df042a9c0868",
  },
  lens: {
    environment:
      (import.meta.env.VITE_LENS_ENVIRONMENT as "testnet" | "mainnet") ||
      "testnet",
    apiUrl: import.meta.env.VITE_LENS_API_URL || "https://api.testnet.lens.xyz",
    appAddress:
      import.meta.env.VITE_LENS_APP_ADDRESS ||
      "0xC75A89145d765c396fd75CbD16380Eb184Bd2ca7", // Lens Chain Testnet default
    rpcUrl: import.meta.env.VITE_LENS_RPC_URL || "https://rpc.testnet.lens.xyz",
    chainId: import.meta.env.VITE_LENS_CHAIN_ID || "37111",
    explorerUrl:
      import.meta.env.VITE_LENS_EXPLORER_URL ||
      "https://explorer.testnet.lens.xyz",
    currencySymbol: import.meta.env.VITE_LENS_CURRENCY_SYMBOL || "GRASS",
  },
  ai: {
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || "Imperfect Breath",
    description:
      import.meta.env.VITE_APP_DESCRIPTION ||
      "Decentralized wellness platform for breathing patterns",
    url: import.meta.env.VITE_APP_URL || "https://imperfectbreath.com",
    icon:
      import.meta.env.VITE_APP_ICON || "https://imperfectbreath.com/icon.png",
  },
  development: {
    debugMode: import.meta.env.VITE_DEBUG_MODE === "true",
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS !== "false",
  },
} as const;

// Export individual configs for convenience
export const { supabase, flow, lens, ai, app, development } = config;

// Development helpers
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Logging helper that respects debug mode
export const debugLog = (...args: unknown[]) => {
  if (development.debugMode || isDevelopment) {
    console.log("[DEBUG]", ...args);
  }
};

export default config;
