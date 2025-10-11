/**
 * PatternCard Types
 * Unified types for all PatternCard variants
 */

import type { EnhancedCustomPattern } from "../../../types/patterns";
import type { CustomPattern } from "../../../types/patterns"; // CLEAN: Direct import from types

export type PatternCardVariant = "marketplace" | "social" | "library" | "mobile";
export type PatternCardSize = "compact" | "standard" | "expanded";

// Unified pattern type that combines all possible pattern properties
export interface UnifiedPattern {
  // Core required properties
  id: string;
  name: string;
  description: string;
  category?: "sleep" | "focus" | "performance" | "stress" | "energy" | string;
  difficulty: string;
  duration: number;
  creator: string;
  
  // Marketplace specific
  is_demo?: boolean;
  sessionCount?: number;
  instructorName?: string;
  instructorAvatar?: string;
  access?: {
    commercialUse?: boolean;
    price?: number;
  };
  
  // Social specific
  rating?: number;
  reviews?: number;
  downloads?: number;
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  bookmarks?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  featured?: boolean;
  creatorName?: string;
  creatorAvatar?: string;
  lastUpdated?: string;
  price?: number;
  currency?: string;
  licensed?: boolean;
  
  // Common properties
  tags?: string[];
  mediaContent?: {
    instructionalVideo?: boolean;
    audio?: boolean;
    video?: boolean;
    guidedAudio?: boolean;
    [key: string]: unknown;
  }
}

// Variant-specific configurations
export interface PatternCardConfig {
  variant: PatternCardVariant;
  size: PatternCardSize;
  showSocialActions: boolean;
  showPricing: boolean;
  showStats: boolean;
  showDescription: boolean;
  showTags: boolean;
  showCreator: boolean;
  actionButtonText: string;
  maxDescriptionLines: number;
}

export interface PatternCardProps {
  pattern: UnifiedPattern | Record<string, unknown>;
  variant?: PatternCardVariant;
  size?: PatternCardSize;
  customConfig?: Partial<PatternCardConfig>;
  className?: string;
  
  // Action handlers - context-aware with flexible types
  onPlay?: (pattern: UnifiedPattern | Record<string, unknown>) => void | Promise<void>;
  onPreview?: (pattern: UnifiedPattern | Record<string, unknown>) => void | Promise<void>;
  onLicense?: (pattern: UnifiedPattern | Record<string, unknown>) => void | Promise<void>;
  onLike?: (patternId: string) => void | Promise<void>;
  onShare?: (pattern: UnifiedPattern | Record<string, unknown>) => void | Promise<void>;
  onComment?: (patternId: string, comment: string) => void | Promise<void>;
  onBookmark?: (patternId: string) => void | Promise<void>;
  onReport?: (patternId: string, reason: string) => void | Promise<void>;
  
  // State
  isLiked?: boolean;
  isLoading?: boolean;
}