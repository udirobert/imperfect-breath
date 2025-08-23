/**
 * PatternCard Variant Configurations
 * Defines behavior for different contexts (marketplace, social, library, mobile)
 */

import type { PatternCardVariant, PatternCardSize, PatternCardConfig } from "./types";

// Default configurations for each variant
export const VARIANT_CONFIGS: Record<PatternCardVariant, PatternCardConfig> = {
  marketplace: {
    variant: "marketplace",
    size: "standard",
    showSocialActions: false,
    showPricing: true,
    showStats: true,
    showDescription: true,
    showTags: true,
    showCreator: true,
    actionButtonText: "Try Pattern",
    maxDescriptionLines: 2,
  },
  
  social: {
    variant: "social",
    size: "standard",
    showSocialActions: true,
    showPricing: false,
    showStats: true,
    showDescription: true,
    showTags: true,
    showCreator: true,
    actionButtonText: "Preview",
    maxDescriptionLines: 2,
  },
  
  library: {
    variant: "library",
    size: "compact",
    showSocialActions: false,
    showPricing: false,
    showStats: false,
    showDescription: true,
    showTags: false,
    showCreator: false,
    actionButtonText: "Start",
    maxDescriptionLines: 1,
  },
  
  mobile: {
    variant: "mobile",
    size: "compact",
    showSocialActions: true,
    showPricing: true,
    showStats: false,
    showDescription: true,
    showTags: false,
    showCreator: true,
    actionButtonText: "Play",
    maxDescriptionLines: 1,
  },
};

// Size-specific styling
export const SIZE_STYLES: Record<PatternCardSize, {
  cardHeight: string;
  headerPadding: string;
  contentPadding: string;
  titleSize: string;
  avatarSize: string;
}> = {
  compact: {
    cardHeight: "h-64",
    headerPadding: "pb-2",
    contentPadding: "pt-0 pb-3",
    titleSize: "text-base",
    avatarSize: "h-6 w-6",
  },
  
  standard: {
    cardHeight: "h-auto",
    headerPadding: "pb-3",
    contentPadding: "pt-0",
    titleSize: "text-lg",
    avatarSize: "h-10 w-10",
  },
  
  expanded: {
    cardHeight: "h-auto",
    headerPadding: "pb-4",
    contentPadding: "pt-0 pb-4",
    titleSize: "text-xl",
    avatarSize: "h-12 w-12",
  },
};

// Category icons mapping
export const CATEGORY_ICONS = {
  stress: "Heart",
  sleep: "Moon", 
  energy: "Zap",
  focus: "Target",
  performance: "Award",
  relaxation: "Heart",
  breathing: "Wind",
  meditation: "Brain",
} as const;

// Difficulty color mapping
export const DIFFICULTY_COLORS = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800", 
  advanced: "bg-red-100 text-red-800",
} as const;