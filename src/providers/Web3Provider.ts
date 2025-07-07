import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

// Create a public client for reading from the blockchain
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

// Add any additional configuration or clients as needed
// This is a minimal implementation to fix the import error in useComments.ts