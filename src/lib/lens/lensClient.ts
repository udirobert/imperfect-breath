/**
 * Lens V3 2025 Client - Simplified Implementation
 *
 * Clean, minimal wrapper around @lens-protocol/client
 * Following official 2025 patterns and best practices
 */

import { LensClient, development } from '@lens-protocol/client';
import { textOnly } from '@lens-protocol/metadata';

// Lens V3 Client instance
export const lensClient = new LensClient({
  environment: development, // Switch to production for mainnet
});

// Types for our app (minimal, extending official types)
export interface BreathingSessionData {
  patternName: string;
  duration: number;
  score?: number;
  breathHoldTime?: number;
  cycles?: number;
  insights?: string[];
}

export interface AuthResult {
  success: boolean;
  account?: any;
  error?: string;
}

export interface PostResult {
  success: boolean;
  hash?: string;
  postId?: string;
  error?: string;
