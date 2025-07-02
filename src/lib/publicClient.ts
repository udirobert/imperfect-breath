import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";

// Create public client for Lens Protocol interactions
export const publicClient = createPublicClient({
  chain: polygon,
  transport: http(),
});

// Alternative clients for different chains if needed
export const polygonPublicClient = publicClient;

// Export for legacy compatibility
export default publicClient;
