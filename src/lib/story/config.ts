/**
 * Story Protocol Client Configuration
 * Controls which client implementation to use
 */

import ConsolidatedStoryClient from './clients/consolidated-client';
import StoryProtocolApiClient from './clients/api-client';

/**
 * Client type enumeration
 */
export type ClientType = 'direct' | 'api';

// Client type constants
export const DIRECT_SDK: ClientType = 'direct';
export const API: ClientType = 'api';

/**
 * Current client type to use
 * In a browser environment, only API client is supported
 */
export const CURRENT_CLIENT_TYPE: ClientType = API;

/**
 * Get the appropriate Story Protocol client instance
 * @param isTestnet Whether to use testnet (default: true)
 * @returns Story Protocol client instance
 */
export function getStoryClient(isTestnet: boolean = true) {
  switch (CURRENT_CLIENT_TYPE) {
    case DIRECT_SDK:
      try {
        return ConsolidatedStoryClient.getInstance(isTestnet);
      } catch (error) {
        console.error('Failed to initialize direct SDK client, falling back to API client:', error);
        return StoryProtocolApiClient.getInstance(isTestnet);
      }
    
    case API:
    default:
      return StoryProtocolApiClient.getInstance(isTestnet);
  }
}

/**
 * API Configuration
 */
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_STORY_API_URL || 'http://localhost:3001/api'
};

// Export the client types as a namespace for compatibility with enum usage
export const ClientTypes = {
  DIRECT_SDK,
  API
};

export default {
  getStoryClient,
  CURRENT_CLIENT_TYPE,
  ClientTypes,
  API_CONFIG
};