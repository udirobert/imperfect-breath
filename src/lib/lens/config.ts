/**
 * Lens Protocol V3 Configuration
 *
 * Clean V3-only configuration for Lens Chain mainnet.
 * Removes all V2 references and complex abstraction layers.
 */

import { mainnet, testnet } from "@lens-protocol/client";

// Environment detection
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

// Lens V3 Environment Configuration
export const environment = isProduction ? mainnet : testnet;

// Lens Chain Network Configuration
export const LENS_CHAIN_CONFIG = {
  mainnet: {
    chainId: 232,
    name: "Lens Chain Mainnet",
    rpc: "https://rpc.lens.xyz",
    currency: "GHO",
    explorer: "https://explorer.lens.xyz",
    apiUrl: "https://api.lens.xyz",
    groveEndpoint: "https://grove.lens.xyz",
  },
  testnet: {
    chainId: 37111,
    name: "Lens Chain Testnet",
    rpc: "https://rpc.testnet.lens.xyz",
    currency: "GRASS",
    explorer: "https://explorer.testnet.lens.xyz",
    apiUrl: "https://api.testnet.lens.xyz",
    groveEndpoint: "https://grove.testnet.lens.xyz",
  },
} as const;

// Current network based on environment
export const currentNetwork = isProduction
  ? LENS_CHAIN_CONFIG.mainnet
  : LENS_CHAIN_CONFIG.testnet;

// App Configuration
const LENS_APP_ADDRESS = import.meta.env.VITE_LENS_APP_ADDRESS;

// Default app addresses for different networks
export const DEFAULT_APP_ADDRESSES = {
  mainnet: "0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE",
  testnet: "0xC75A89145d765c396fd75CbD16380Eb184Bd2ca7",
} as const;

// Get the appropriate app address
export const getAppAddress = (): string => {
  // Use custom app address if provided
  if (LENS_APP_ADDRESS && LENS_APP_ADDRESS.startsWith("0x")) {
    return LENS_APP_ADDRESS;
  }

  // Fallback to default addresses
  return isProduction
    ? DEFAULT_APP_ADDRESSES.mainnet
    : DEFAULT_APP_ADDRESSES.testnet;
};

// Lens V3 Client Configuration
export const CLIENT_CONFIG = {
  environment,
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
} as const;

// Grove Storage Configuration
export const GROVE_CONFIG = {
  endpoint: currentNetwork.groveEndpoint,
  immutable: true, // Use immutable storage for posts
  chainId: currentNetwork.chainId,
} as const;

// Content Type Mappings for Lens V3 Metadata
export const CONTENT_TYPES = {
  text: "text",
  image: "image",
  video: "video",
  audio: "audio",
} as const;

// Lens V3 Feature Configuration
export const FEATURES = {
  gaslessTransactions: true,
  groveStorage: true,
  accountAbstraction: true,
  rulesEngine: false, // Disable for now
  advancedFeeds: true,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  graphql: currentNetwork.apiUrl,
  grove: currentNetwork.groveEndpoint,
  explorer: currentNetwork.explorer,
} as const;

// Rate Limiting Configuration
export const RATE_LIMITS = {
  postsPerHour: 10,
  followsPerHour: 50,
  likesPerHour: 100,
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  enabled: true,
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100, // Maximum cached items
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NOT_AUTHENTICATED: "Must be authenticated to perform this action",
  NETWORK_ERROR: "Network error occurred. Please try again.",
  INVALID_ADDRESS: "Invalid wallet address format",
  RATE_LIMITED: "Rate limit exceeded. Please wait before trying again.",
  UPLOAD_FAILED: "Failed to upload content to Grove storage",
  POST_FAILED: "Failed to create post on Lens Protocol",
  FOLLOW_FAILED: "Failed to follow account",
} as const;

// Default Tags for Content
export const DEFAULT_TAGS = {
  breathing: ["breathing", "wellness", "mindfulness"],
  meditation: ["meditation", "mindfulness", "peace"],
  pattern: ["breathing-pattern", "technique", "wellness"],
  session: ["breathing-session", "wellness", "completed"],
} as const;

// Validation Rules
export const VALIDATION = {
  minContentLength: 1,
  maxContentLength: 2000,
  maxTagLength: 50,
  maxTags: 10,
  maxImageSize: 10 * 1024 * 1024, // 10MB
  maxVideoSize: 100 * 1024 * 1024, // 100MB
  supportedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  supportedVideoTypes: ["video/mp4", "video/webm", "video/mov"],
} as const;

// Development flags
export const DEV_FLAGS = {
  enableLogging: isDevelopment,
  mockTransactions: false,
  skipValidation: false,
} as const;

// Export current environment info
export const environmentInfo = {
  isProduction,
  isDevelopment,
  network: currentNetwork,
  appAddress: getAppAddress(),
  features: FEATURES,
} as const;

// Utility function to validate environment
export const validateEnvironment = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check if app address is set
  if (!getAppAddress()) {
    errors.push("LENS_APP_ADDRESS not configured");
  }

  // Check network connectivity (basic validation)
  if (!currentNetwork.rpc || !currentNetwork.apiUrl) {
    errors.push("Network configuration incomplete");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Debug information (only in development)
if (isDevelopment) {
  console.log("🌿 Lens V3 Configuration:", {
    environment: environment === mainnet ? "mainnet" : "testnet",
    network: currentNetwork.name,
    appAddress: getAppAddress(),
    features: FEATURES,
  });
}
