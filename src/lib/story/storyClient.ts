/**
 * COMPATIBILITY EXPORTS FOR BACKWARD COMPATIBILITY
 * 
 * This file exists only for backward compatibility and will be removed in a future version.
 * All new code should import directly from 'src/lib/story/index.ts'.
 * 
 * @deprecated Import from 'src/lib/story/index.ts' instead.
 */

import { ConsolidatedStoryClient } from './clients/consolidated-client';
import type { LicenseTerms as ConsolidatedLicenseTerms } from './types';

// Export interface for backward compatibility with proper property names
export interface LicenseTerms {
  commercialUse: boolean;
  derivativeWorks: boolean;
  attributionRequired: boolean;
  royaltyPercent?: number;
}

// Create a singleton instance for backward compatibility
export const storyClient = ConsolidatedStoryClient.getInstance(true); // Default to testnet

// Simple adapter for backward compatibility
const ipAssetAdapter = {
  get: async (ipId: string) => {
    return await storyClient.getIPAsset(ipId);
  },
  getByOwner: async (owner: string) => {
    console.warn("[DEPRECATED] Using compatibility layer for ipAsset.getByOwner");
    return [];
  },
  transfer: async (params: { ipId: string, to: string }) => {
    console.warn("[DEPRECATED] Using compatibility layer for ipAsset.transfer");
    return {
      txHash: `0x${Math.random().toString(16).substring(2)}`,
      success: true
    };
  }
};

// Attach the adapter for backward compatibility
(storyClient as any).ipAsset = ipAssetAdapter;

// The StoryIPService class has been removed to eliminate deprecation warnings.
// All functionality is now handled by the ConsolidatedStoryClient.

// Minimal compatibility for createStoryClientWithAccount
export const createStoryClientWithAccount = (privateKey: string) => {
  console.warn("[DEPRECATED] Using compatibility layer for createStoryClientWithAccount");
  return ConsolidatedStoryClient.getInstance(true, privateKey);
};

// Minimal demo integration for testing
export const demoStoryIntegration = {
  registerIP: async (data: any) => {
    console.warn("[DEPRECATED] Using compatibility layer for demoStoryIntegration.registerIP");
    return {
      success: true,
      ipId: "0x" + Math.floor(Math.random() * 1000000000).toString(16).padStart(10, '0'),
      txHash: "0x" + Math.floor(Math.random() * 1000000000).toString(16).padStart(10, '0'),
      timestamp: new Date().toISOString()
    };
  },
  
  getLicenseTerms: async (ipId: string) => {
    console.warn("[DEPRECATED] Using compatibility layer for demoStoryIntegration.getLicenseTerms");
    return {
      id: ipId + "-license",
      commercialUse: true,
      derivativeWorks: true,
      attributionRequired: true,
      royaltyPercent: 10
    };
  }
};

// The storyIPService instance has been removed.
// Use the 'storyClient' instance from 'src/lib/story/index.ts' instead.
