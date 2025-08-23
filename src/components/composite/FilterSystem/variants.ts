/**
 * FilterSystem Variant Configurations
 * Predefined configurations for different use cases
 */

import type { FilterSystemConfig } from "./types";

export const FILTER_VARIANT_CONFIGS: Record<string, FilterSystemConfig> = {
  marketplace: {
    variant: "marketplace",
    layout: "horizontal",
    showCategories: true,
    showQuickFilters: true,
    showSearch: true,
    showSort: true,
    showResultsCount: true,
    compactMode: false,
  },
  
  social: {
    variant: "social",
    layout: "horizontal",
    showCategories: true,
    showQuickFilters: true,
    showSearch: true,
    showSort: true,
    showResultsCount: false,
    compactMode: false,
  },
  
  session: {
    variant: "session",
    layout: "compact",
    showCategories: true,
    showQuickFilters: false,
    showSearch: true,
    showSort: false,
    showResultsCount: false,
    compactMode: true,
  },
  
  minimal: {
    variant: "minimal",
    layout: "compact",
    showCategories: false,
    showQuickFilters: false,
    showSearch: true,
    showSort: false,
    showResultsCount: false,
    compactMode: true,
  },
};

export const LAYOUT_STYLES = {
  horizontal: "flex flex-row items-center gap-4 flex-wrap",
  vertical: "flex flex-col gap-4",
  compact: "flex flex-row items-center gap-2",
};

export const VARIANT_STYLES = {
  marketplace: "bg-white border rounded-lg p-4 shadow-sm",
  social: "bg-gray-50 border rounded-lg p-3",
  session: "bg-transparent p-2",
  minimal: "bg-transparent p-1",
};