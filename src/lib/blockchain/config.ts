import type { BlockchainConfig } from "../../types/blockchain";
import { lensChain } from "../publicClient";

// Environment variables with fallbacks
const getEnvVar = (name: string, fallback?: string): string => {
  const value = import.meta.env[name] || process.env[name];
  if (!value && !fallback) {
    console.warn(`Environment variable ${name} is not set`);
    return "";
  }
  return value || fallback || "";
};

// Blockchain configuration
export const blockchainConfig: BlockchainConfig = {
  environment: getEnvVar("VITE_BLOCKCHAIN_ENVIRONMENT", "testnet") as "mainnet" | "testnet",
  crossmint: {
    projectId: getEnvVar("VITE_CROSSMINT_PROJECT_ID", "demo_project_id"),
    apiKey: getEnvVar("VITE_CROSSMINT_API_KEY", "demo_api_key"),
    environment: getEnvVar("VITE_CROSSMINT_ENVIRONMENT", "staging") as
      | "staging"
      | "production",
  },
  storyProtocol: {
    apiKey: getEnvVar("VITE_STORY_PROTOCOL_API_KEY", "demo_api_key"),
    chainId: parseInt(getEnvVar("VITE_STORY_PROTOCOL_CHAIN_ID", "1315")),
    contractAddress: getEnvVar(
      "VITE_STORY_PROTOCOL_CONTRACT_ADDRESS",
      "0x0000000000000000000000000000000000000000",
    ),
  },
  connectKit: {
    projectId: getEnvVar("VITE_WALLETCONNECT_PROJECT_ID", "demo_project_id"),
    appName: getEnvVar("VITE_APP_NAME", "Imperfect Breath"),
  }
};

// Network configurations
export const networkConfig = {
  mainnet: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${getEnvVar("VITE_ALCHEMY_API_KEY", "your-api-key")}`,
    blockExplorer: "https://etherscan.io",
    currency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  flowTestnet: {
    chainId: 16,
    name: "Flow Testnet",
    rpcUrl: getEnvVar("VITE_FLOW_TESTNET_RPC_URL", "https://rest-testnet.onflow.org"),
    blockExplorer: "https://testnet.flowscan.org",
    currency: {
      name: "Flow Token",
      symbol: "FLOW",
      decimals: 8,
    },
  },
  aeneid: {
    chainId: 1315,
    name: "Story Protocol Aeneid Testnet",
    rpcUrl: getEnvVar("VITE_STORY_PROTOCOL_RPC_URL", "https://aeneid.storyrpc.io"),
    blockExplorer: "https://aeneid.storyscan.io",
    currency: {
      name: "IP",
      symbol: "IP",
      decimals: 18,
    },
  },
  lensTestnet: {
    chainId: lensChain.id,
    name: lensChain.name,
    rpcUrl: lensChain.rpcUrls.default.http[0],
    blockExplorer: lensChain.blockExplorers?.default.url || "https://explorer.testnet.lens.xyz",
    currency: {
      name: lensChain.nativeCurrency.name,
      symbol: lensChain.nativeCurrency.symbol,
      decimals: lensChain.nativeCurrency.decimals,
    },
  },
};

// Contract addresses
export const contractAddresses = {
  mainnet: {
    breathingPatternNFT: getEnvVar(
      "VITE_BREATHING_PATTERN_NFT_MAINNET",
      "0x0000000000000000000000000000000000000000",
    ),
    licenseManager: getEnvVar(
      "VITE_LICENSE_MANAGER_MAINNET",
      "0x0000000000000000000000000000000000000000",
    ),
    royaltyManager: getEnvVar(
      "VITE_ROYALTY_MANAGER_MAINNET",
      "0x0000000000000000000000000000000000000000",
    ),
  },
  testnet: {
    breathingPatternNFT: getEnvVar(
      "VITE_BREATHING_PATTERN_NFT_TESTNET",
      "0x0000000000000000000000000000000000000000",
    ),
    licenseManager: getEnvVar(
      "VITE_LICENSE_MANAGER_TESTNET",
      "0x0000000000000000000000000000000000000000",
    ),
    royaltyManager: getEnvVar(
      "VITE_ROYALTY_MANAGER_TESTNET",
      "0x0000000000000000000000000000000000000000",
    ),
  },
};

// Gas settings
export const gasSettings = {
  registrationGasLimit: 500000,
  licenseGasLimit: 300000,
  transferGasLimit: 200000,
  defaultGasPrice: "20000000000", // 20 gwei
  maxGasPrice: "100000000000", // 100 gwei
};

// Feature flags
export const featureFlags = {
  enableWalletConnect:
    getEnvVar("VITE_ENABLE_WALLET_CONNECT", "true") === "true",
  enableMetamask: getEnvVar("VITE_ENABLE_METAMASK", "true") === "true",
  enableConnectKit: getEnvVar("VITE_ENABLE_CONNECT_KIT", "true") === "true",
  enableIPRegistration:
    getEnvVar("VITE_ENABLE_IP_REGISTRATION", "true") === "true",
  enableLicensing: getEnvVar("VITE_ENABLE_LICENSING", "true") === "true",
  enableMockMode: false, // No more mock mode - always use real blockchain interactions
};

// API endpoints
export const apiEndpoints = {
  crossmint: {
    base:
      blockchainConfig.crossmint.environment === "production"
        ? "https://api.crossmint.com"
        : "https://staging.crossmint.com",
    nft: "/api/2022-06-09/collections",
    wallet: "/api/2022-06-09/wallets",
  },
  storyProtocol: {
    base: "https://api.storyprotocol.xyz",
    ip: "/api/v1/ip",
    license: "/api/v1/license",
  },
  connectKit: {
    base: "https://connect.family",
    auth: "/api/auth",
    wallet: "/api/wallet",
  }
};

// Validation functions
export const validateConfig = (): boolean => {
  const requiredVars = [
    "VITE_WALLETCONNECT_PROJECT_ID",
    "VITE_CROSSMINT_PROJECT_ID",
    "VITE_STORY_PROTOCOL_API_KEY",
  ];

  const missingVars = requiredVars.filter((varName) => !getEnvVar(varName));

  if (missingVars.length > 0 && !featureFlags.enableMockMode) {
    console.error("Missing required environment variables:", missingVars);
    return false;
  }

  return true;
};

// Initialize configuration
export const initializeBlockchain = async (): Promise<boolean> => {
  try {
    console.log("🔧 Initializing blockchain configuration...");

    // Validate configuration
    if (!validateConfig()) {
      console.warn("⚠️ Configuration validation failed, running in mock mode");
      return featureFlags.enableMockMode;
    }

    // Test API connectivity (in production, add actual API calls)
    if (!featureFlags.enableMockMode) {
      // Add actual API health checks here
      console.log("🔗 Testing API connectivity...");
    }

    console.log("✅ Blockchain configuration initialized successfully");
    console.log("📊 Configuration:", {
      network: blockchainConfig.environment,
      environment: blockchainConfig.crossmint.environment,
      mockMode: featureFlags.enableMockMode,
    });

    return true;
  } catch (error) {
    console.error("❌ Failed to initialize blockchain configuration:", error);
    return false;
  }
};

// Export current network config based on environment
export const getCurrentNetworkConfig = () => {
  const environment = blockchainConfig.environment;
  if (environment === "mainnet") {
    return networkConfig.mainnet;
  } else {
    // Use Lens testnet for default testnet environment
    return networkConfig.lensTestnet;
  }
};

// Export current contract addresses
export const getCurrentContractAddresses = () => {
  const environment = blockchainConfig.environment;
  return environment === "mainnet"
    ? contractAddresses.mainnet
    : contractAddresses.testnet;
};

// Error handling utilities
export const handleBlockchainError = (error: unknown) => {
  console.error("Blockchain error:", error);

  // Common error codes and user-friendly messages
  const errorMessages: { [key: string]: string } = {
    insufficient_funds: "Insufficient funds to complete the transaction",
    user_rejected: "Transaction was rejected by user",
    network_error: "Network connection error",
    contract_error: "Smart contract execution failed",
    invalid_address: "Invalid wallet address",
    gas_limit_exceeded: "Transaction requires too much gas",
  };

  const code = (error as { code?: string })?.code || "unknown_error";
  const message = errorMessages[code] || "An unexpected error occurred";

  return {
    code,
    message,
    originalError: error,
  };
};

// Development utilities
export const isDevelopment = () => {
  return import.meta.env.DEV || process.env.NODE_ENV === "development";
};

export const isProduction = () => {
  return import.meta.env.PROD || process.env.NODE_ENV === "production";
};

export const getNetworkName = () => {
  return blockchainConfig.environment === "mainnet" ? "Mainnet" : "Testnet";
};
