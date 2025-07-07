import { createPublicClient, http, defineChain } from "viem";
import { config } from "../config/environment";

// Define Lens Chain
export const lensChain = defineChain({
  id: Number(config.lens.chainId) || 37111,
  name: "Lens Chain Testnet",
  network: "lens-testnet",
  nativeCurrency: {
    name: "GRASS",
    symbol: config.lens.currencySymbol || "GRASS",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [config.lens.rpcUrl || "https://rpc.testnet.lens.xyz"],
    },
    public: {
      http: [config.lens.rpcUrl || "https://rpc.testnet.lens.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Lens Explorer",
      url: config.lens.explorerUrl || "https://explorer.testnet.lens.xyz",
    },
  },
  testnet: config.lens.environment === "testnet",
});

// Define mainnet Lens Chain for completeness
export const lensChainMainnet = defineChain({
  id: 1389,
  name: "Lens Chain Mainnet",
  network: "lens-mainnet",
  nativeCurrency: {
    name: "GHO",
    symbol: "GHO",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.lens.xyz"],
    },
    public: {
      http: ["https://rpc.lens.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Lens Explorer",
      url: "https://explorer.lens.xyz",
    },
  },
  testnet: false,
});

// Create public client for Lens Protocol interactions
export const publicClient = createPublicClient({
  chain: config.lens.environment === "testnet" ? lensChain : lensChainMainnet,
  transport: http(),
});

// Legacy client name for backward compatibility
export const lensPublicClient = publicClient;

// Export for legacy compatibility
export default publicClient;
