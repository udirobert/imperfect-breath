import type { BlockchainConfig } from "@/types/blockchain";

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
  tomo: {
    projectId: getEnvVar("VITE_TOMO_PROJECT_ID", "demo_project_id"),
    apiKey: getEnvVar("VITE_TOMO_API_KEY", "demo_api_key"),
    network: getEnvVar("VITE_TOMO_NETWORK", "testnet") as "mainnet" | "testnet",
  },
  crossmint: {
    projectId: getEnvVar("VITE_CROSSMINT_PROJECT_ID", "demo_project_id"),
    apiKey: getEnvVar("VITE_CROSSMINT_API_KEY", "demo_api_key"),
    environment: getEnvVar("VITE_CROSSMINT_ENVIRONMENT", "staging") as
      | "staging"
      | "production",
  },
  storyProtocol: {
    apiKey: getEnvVar("VITE_STORY_PROTOCOL_API_KEY", "demo_api_key"),
    chainId: parseInt(getEnvVar("VITE_STORY_PROTOCOL_CHAIN_ID", "1")),
    contractAddress: getEnvVar(
      "VITE_STORY_PROTOCOL_CONTRACT_ADDRESS",
      "0x0000000000000000000000000000000000000000",
    ),
  },
};

// Network configurations
export const networkConfig = {
  mainnet: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/your-api-key",
    blockExplorer: "https://etherscan.io",
    currency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  testnet: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/your-api-key",
    blockExplorer: "https://sepolia.etherscan.io",
    currency: {
      name: "Sepolia Ether",
      symbol: "SEP",
      decimals: 18,
    },
  },
  polygon: {
    chainId: 137,
    name: "Polygon Mainnet",
    rpcUrl: "https://polygon-mainnet.g.alchemy.com/v2/your-api-key",
    blockExplorer: "https://polygonscan.com",
    currency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
  },
  mumbai: {
    chainId: 80001,
    name: "Mumbai Testnet",
    rpcUrl: "https://polygon-mumbai.g.alchemy.com/v2/your-api-key",
    blockExplorer: "https://mumbai.polygonscan.com",
    currency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
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
  enableTomoWallet: getEnvVar("VITE_ENABLE_TOMO_WALLET", "true") === "true",
  enableIPRegistration:
    getEnvVar("VITE_ENABLE_IP_REGISTRATION", "true") === "true",
  enableLicensing: getEnvVar("VITE_ENABLE_LICENSING", "true") === "true",
  enableMockMode: getEnvVar("VITE_ENABLE_MOCK_MODE", "true") === "true",
};

// API endpoints
export const apiEndpoints = {
  tomo: {
    auth: "https://api.tomo.com/auth",
    wallet: "https://api.tomo.com/wallet",
    user: "https://api.tomo.com/user",
  },
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
};

// Validation functions
export const validateConfig = (): boolean => {
  const requiredVars = [
    "VITE_TOMO_PROJECT_ID",
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
      network: blockchainConfig.tomo.network,
      environment: blockchainConfig.crossmint.environment,
      mockMode: featureFlags.enableMockMode,
    });

    return true;
  } catch (error) {
    console.error("❌ Failed to initialize blockchain configuration:", error);
    return false;
  }
};

// Export current network config
export const getCurrentNetworkConfig = () => {
  const network = blockchainConfig.tomo.network;
  return network === "mainnet" ? networkConfig.mainnet : networkConfig.testnet;
};

// Export current contract addresses
export const getCurrentContractAddresses = () => {
  const network = blockchainConfig.tomo.network;
  return network === "mainnet"
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
  return blockchainConfig.tomo.network === "mainnet" ? "Mainnet" : "Testnet";
};
