/**
 * Lens Protocol V3 - Main Exports
 * Clean exports using existing working client
 * Follows DRY, CLEAN, ORGANISED, MODULAR principles
 */

// Working V3 client
export { lensClient, getAppAddress } from "./client";

// Configuration
export { environment, CLIENT_CONFIG } from "./config";

// Main hook - uses existing working client
export { useLens } from "../../hooks/useLens";

// Export custom types for Lens integration
export type {
  LensAccount,
  LensPost,
  SocialPost,
  SocialActionResult,
  BreathingSession,
  LensAuthTokens,
  CommunityStats,
  TrendingPattern,
} from "../../hooks/useLens";
