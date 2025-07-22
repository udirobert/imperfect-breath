import { createPublicClient, http, defineChain } from "viem";

// Define Lens Chain with hardcoded reliable defaults
export const lensChain = defineChain({
  id: 37111,
  name: "Lens Chain Testnet",
  network: "lens-testnet",
  nativeCurrency: {
    name: "GRASS",
    symbol: "GRASS",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.lens.xyz"],
    },
    public: {
      http: ["https://rpc.testnet.lens.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Lens Explorer",
      url: "https://explorer.testnet.lens.xyz",
    },
  },
  testnet: true,
});

// Define mainnet Lens Chain for completeness
export const lensChainMainnet = defineChain({
  id: 232,
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
  chain: lensChain,
  transport: http(),
});

// Modern default export
export default publicClient;
