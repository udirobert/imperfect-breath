/**
 * Story Protocol Integration
 * CONSOLIDATED EXPORT POINT - Use these exports for all Story Protocol functionality
 *
 * Consolidation Plan:
 * 1. Use ConsolidatedStoryClient as the primary implementation
 * 2. Import from this file (src/lib/story) instead of individual client files
 * 3. Legacy client files will be deprecated and eventually removed
 */

// Re-export the consolidated client
export { ConsolidatedStoryClient } from './clients/consolidated-client';

// Re-export types
export * from './types';

// Export the singleton instance for direct use
import { ConsolidatedStoryClient } from './clients/consolidated-client';
export const storyClient = ConsolidatedStoryClient.getInstance(true); // Default to testnet

// Export legacy implementations (marked as deprecated)
// These will be removed in a future version
/**
 * @deprecated Use ConsolidatedStoryClient instead
 */
export { default as StoryBreathingClient } from './story-client';

/**
 * @deprecated Use the storyClient instance exported from this file
 */
// Import and re-export for backward compatibility
import {
  storyClient as legacyStoryClient,
  demoStoryIntegration,
  createStoryClientWithAccount
} from './storyClient';

// Re-export specific items we need for backward compatibility
export {
  demoStoryIntegration,
  createStoryClientWithAccount
};

// LicenseTerms is already exported from './types'

// Helper functions
export const formatIPAddress = (ipId: string): string => {
  if (!ipId) return '';
  return ipId.startsWith('0x') ? ipId : `0x${ipId}`;
};

export const getStoryExplorerUrl = (ipId: string, isTestnet = true): string => {
  const baseUrl = isTestnet ? 'https://aeneid.explorer.story.foundation' : 'https://explorer.story.foundation';
  return `${baseUrl}/ipa/${formatIPAddress(ipId)}`;
};
