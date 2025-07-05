/**
 * Lens Protocol - Main Exports
 * Single source of truth for all Lens-related imports
 */

// Core client
export { LensBreathingClient as LensClient } from './lens-client';
export { default as LensGraphQLClient } from './lens-graphql-client';

// Contract configurations
export { LENS_HUB_CONTRACT_ADDRESS, LENS_HUB_ABI } from './config';

// Types
export type {
  LensAuthTokens,
  LensAccount,
  BreathingSession,
  SocialPost,
  SocialActionResult,
  CommunityStats,
  TrendingPattern,
  SocialContext,
  LensTimelineResponse,
  LensFollowersResponse,
} from './types';

// Main hook
export { useLens } from '../../hooks/useLens';
