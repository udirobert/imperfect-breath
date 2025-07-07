/**
 * Dynamic import helper for Story Protocol SDK
 * 
 * This module provides a safe way to import the Story Protocol SDK,
 * preventing browser-side imports that would cause errors with Node.js-specific
 * modules like dotenv, fs, crypto, etc.
 */

// Type definitions from Story Protocol SDK
export interface StoryClient {
  ipAsset: {
    register: (params: any) => Promise<any>;
    get: (ipId: string) => Promise<any>;
    getByOwner: (owner: string) => Promise<any[]>;
  };
  license: {
    setTerms: (params: any) => Promise<any>;
  };
  // Add other interfaces as needed
}

let storySDK: any = null;
let isNode = false;

// Check if we're in a Node.js environment
try {
  isNode = typeof process !== 'undefined' && 
           process.versions != null && 
           process.versions.node != null;
} catch (e) {
  isNode = false;
}

/**
 * Get a mock Story Client for browser environments
 */
function getMockStoryClient(): StoryClient {
  console.warn('Using mock Story Protocol client in browser environment');
  
  return {
    ipAsset: {
      register: async () => ({ 
        txHash: '0xmocktxhash',
        success: false,
        error: 'Story Protocol SDK not available in browser' 
      }),
      get: async () => null,
      getByOwner: async () => []
    },
    license: {
      setTerms: async () => ({
        txHash: '0xmocklicensetxhash',
        success: false,
        error: 'Story Protocol SDK not available in browser'
      })
    }
  };
}

/**
 * Safely load the Story Protocol SDK
 * Returns the SDK in Node.js environment, and a mock in browser environment
 */
export async function loadStorySDK(): Promise<any> {
  if (isNode) {
    try {
      // Only import in Node.js environment
      if (!storySDK) {
        storySDK = await import('@story-protocol/core-sdk');
      }
      return storySDK;
    } catch (error) {
      console.error('Failed to load Story Protocol SDK:', error);
      return { StoryClient: getMockStoryClient };
    }
  } else {
    // In browser, return mock
    return { StoryClient: getMockStoryClient };
  }
}

/**
 * Create a new Story client instance
 * Returns a real client in Node.js environment, and a mock in browser environment
 */
export async function createStoryClient(config: any): Promise<StoryClient> {
  if (isNode) {
    const sdk = await loadStorySDK();
    return new sdk.StoryClient(config);
  } else {
    return getMockStoryClient();
  }
}

/**
 * Check if we're in a Node.js environment where Story Protocol SDK can be used
 */
export function canUseStorySDK(): boolean {
  return isNode;
}