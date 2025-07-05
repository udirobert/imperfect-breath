/**
 * Story Protocol - Main Exports
 * Single source of truth for all Story Protocol imports
 */

// Core client
export { default as ConsolidatedStoryClient } from './clients/story-client';

// Types
export type {
  StoryConfig,
  IPAsset,
  LicenseTerms,
  IPMetadata,
  BreathingPatternIP,
  IPRegistrationResult,
  LicenseRegistrationResult,
  DerivativeRegistrationResult,
  LicenseType,
  CommercialTerms,
  StoryState,
  StoryActions,
  StoryError,
} from './types';

// Helper functions
export {
  registerBreathingPattern,
  registerDerivativeBreathingPattern,
  createCommercialRemixTerms,
  isStoryConfigured,
  getStoryNetworkInfo,
} from './story-helpers';

// Main hook
export { useStory } from '../../hooks/useStory';

// Legacy client (for backward compatibility)
export { StoryBreathingClient } from './story-client';
