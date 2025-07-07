/**
 * Lens Protocol Types
 * Aligns with Lens SDK v3 structure
 */

export interface BreathingSessionData {
  patternName: string;
  duration: number;  // in seconds
  score: number;     // 0-100
  cycles?: number;
  breathHoldTime?: number;
  flowNFTId?: string;
  insights?: string[];
  content?: string;
}

export interface SocialActionResult {
  success: boolean;
  hash?: string;
  error?: string;
}