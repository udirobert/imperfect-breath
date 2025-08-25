/**
 * AI Providers and Pattern Types
 * 
 * This file provides the necessary types for AI pattern generation and management.
 * It's a simplified version to resolve import errors.
 */

import type { EnhancedCustomPattern } from "../../types/patterns";

// Export the CustomPattern type as an alias to EnhancedCustomPattern
export type CustomPattern = EnhancedCustomPattern;

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