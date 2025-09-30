/**
 * Lens Protocol v3 Library Index
 *
 * Clean exports for the new Lens Protocol v3 implementation
 * - Exports the main API client
 * - Exports all type definitions
 * - Provides configuration utilities
 * - Simple, clean interface for the rest of the app
 */

// Main API client
export { lensAPI, publicClient } from "./client";

// All types
export type {
  Account,
  Post,
  BreathingSession,
  SocialActionResult,
  LensAuthTokens,
  CommunityStats,
  TrendingPattern,
  BreathingChallenge,
  BreathingPattern,
  Achievement,
  UserPreferences,
  Timeline,
  FeedPost,
  LensClient,
  LensError,
  LensResponse,
  PageInfo,
  PaginatedResponse,
  PostMetadata,
  LensSession,
  Maybe,
  Optional,
  RequiredFields,
} from "./types";

// Configuration
export {
  environment,
  currentNetwork,
  getAppAddress,
  CLIENT_CONFIG,
  GROVE_CONFIG,
  environmentInfo,
  validateEnvironment,
} from "./config";

// Session management utilities
export {
  isClientAuthenticated,
  getCurrentSession,
  getSessionClient,
  initializeSession,
  setSession,
  clearSession,
} from "./client";

// Error handling utilities
export const isLensError = (
  error: unknown,
): error is { message: string; code?: string; details?: unknown } => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
};

export const createLensError = (
  message: string,
  code?: string,
  details?: unknown,
): { message: string; code?: string; details?: unknown } => {
  return {
    message,
    code,
    details,
  };
};

// Helper functions for common operations
export const formatLensHandle = (username: string): string => {
  if (username.includes(".lens")) {
    return username;
  }
  return `${username}.lens`;
};

export const extractHandleFromFull = (fullHandle: string): string => {
  return fullHandle.replace(".lens", "");
};

export const isValidLensAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const shortenAddress = (address: string, chars = 4): string => {
  if (!isValidLensAddress(address)) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

// Content helpers
export const createSimpleMetadata = (content: string, tags?: string[]) => {
  return {
    content,
    tags: tags || [],
    locale: "en",
    createdAt: new Date().toISOString(),
  };
};

export const createBreathingSessionContent = (session: {
  patternName: string;
  duration: number;
  score?: number;
  cycles?: number;
  breathHoldTime?: number;
}): string => {
  const minutes = Math.round(session.duration / 60);
  let content = `🌬️ Just completed a ${session.patternName} breathing session!\n\n`;
  content += `⏱️ Duration: ${minutes} minute${minutes !== 1 ? "s" : ""}\n`;

  if (session.score) {
    content += `📊 Score: ${session.score}/100\n`;
  }

  if (session.cycles) {
    content += `🔄 Cycles: ${session.cycles}\n`;
  }

  if (session.breathHoldTime) {
    content += `💨 Max breath hold: ${session.breathHoldTime}s\n`;
  }

  content += `\n#breathing #mindfulness #wellness #${session.patternName.toLowerCase().replace(/\s+/g, "")}`;

  return content;
};

// Default export - the main API client
export { lensAPI as default } from "./client";
