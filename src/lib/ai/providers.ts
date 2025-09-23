/**
 * AI Providers and Pattern Types
 *
 * This file provides the necessary types for AI pattern generation and management.
 * It's a simplified version to resolve import errors.
 */

import type { EnhancedCustomPattern, CustomPattern } from "../../types/patterns";

// Re-export types from patterns.ts to avoid circular references
export type { CustomPattern, EnhancedCustomPattern };

// Export other necessary types
export type PatternWithStats = CustomPattern & {
  stats?: {
    likes?: number;
    downloads?: number;
    views?: number;
    shares?: number;
    comments?: number;
    bookmarks?: number;
  };
};