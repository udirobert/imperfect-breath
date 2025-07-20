/**
 * Lens Protocol v3 - Main Exports
 *
 * Clean, consolidated exports for Lens Protocol integration
 * Removes all duplications and provides a single source of truth
 */

// Core Client & API
export { lensClient, lensAPI } from "./client";
export type { LensV3API } from "./client";

// Configuration
export {
  environment,
  getAppAddress,
  currentNetwork,
  CLIENT_CONFIG,
  GROVE_CONFIG,
  environmentInfo,
  validateEnvironment,
} from "./config";

// All Types (consolidated)
export type {
  // Core Lens Types
  NativeLensAccount,
  NativeLensPost,
  NativeLensAccountMetadata,

  // Auth Types
  LensAuthTokens,
  LensAuthChallenge,
  LensAuthRequest,

  // Simplified App Types
  Account,
  Post,
  BreathingSession,
  SocialActionResult,
  CommunityStats,
  TrendingPattern,
  BreathingChallenge,
  BreathingPattern,

  // API Response Types
  LensTimelineResponse,
  LensFollowersResponse,
  LensExploreResponse,

  // Request Types
  PostRequest,
  CommentRequest,
  FollowRequest,
  UnfollowRequest,
  AccountRequest,
  ExplorePostsRequest,
  ChallengeRequest,

  // Content Types
  LensPostContent,
  BreathingSessionPost,
  LensTextOnlyMetadata,
  LensImageMetadata,

  // Utility Types
  LensError,
  LensClientConfig,
  SocialContext,
  UserPreferences,
  Achievement,
  LensEnvironment,
  PostOrderBy,
  ContentFocus,
  PrivacyLevel,
  DifficultyLevel,
  TrendDirection,
  AchievementRarity,
} from "./types";

// Type Guards
export {
  isAccount,
  isPost,
  isBreathingSession,
  isSocialActionResult,
} from "./types";

// Metadata Creation
export {
  createBreathingSessionMetadata,
  createTextPostMetadata,
  createImagePostMetadata,
  createLensPostMetadata,
  createChallengeMetadata,
  createAchievementMetadata,
  validateMetadata,
} from "./createLensPostMetadata";

// Storage Operations
export {
  uploadMetadataToGrove,
  uploadBreathingSessionToGrove,
  uploadToGrove,
  uploadFileToGrove,
  uploadWithFallback,
  checkGroveAvailability,
  estimateStorageCost,
  validateForGroveUpload,
  createFallbackDataUri,
} from "./uploadToGrove";

// Error Handling
export {
  LensAuthenticationError,
  LensApiError,
  LensSocialActionError,
  LensStorageError,
  LensRateLimitError,
  LensContentValidationError,
  isLensError,
  formatLensError,
} from "./errors";

// Session Management Utilities
export {
  isClientAuthenticated,
  getCurrentSession,
  getSessionClient,
  setSession,
  clearSession,
  initializeSession,
} from "./client";

// Constants
export {
  LENS_CHAIN_CONFIG,
  DEFAULT_APP_ADDRESSES,
  CONTENT_TYPES,
  FEATURES,
  API_ENDPOINTS,
  RATE_LIMITS,
  CACHE_CONFIG,
  ERROR_MESSAGES,
  DEFAULT_TAGS,
  VALIDATION,
  DEV_FLAGS,
} from "./config";
