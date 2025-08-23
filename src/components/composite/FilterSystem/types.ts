/**
 * FilterSystem Types
 * Unified types for all filtering variants across marketplace, social, and session contexts
 */

export type FilterVariant = "marketplace" | "social" | "session" | "minimal";
export type FilterLayout = "horizontal" | "vertical" | "compact";

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
  icon?: React.ElementType;
  disabled?: boolean;
}

export interface CategoryFilter {
  categories: FilterOption[];
  selectedCategory?: string;
  onCategoryChange: (category: string) => void;
}

export interface QuickFilter {
  filters: FilterOption[];
  selectedFilters: string[];
  onFilterToggle: (filterId: string) => void;
  maxVisible?: number;
}

export interface SearchFilter {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
}

export interface SortOptions {
  options: FilterOption[];
  selectedSort: string;
  onSortChange: (sortBy: string) => void;
}

export interface FilterSystemConfig {
  variant: FilterVariant;
  layout: FilterLayout;
  showCategories: boolean;
  showQuickFilters: boolean;
  showSearch: boolean;
  showSort: boolean;
  showResultsCount: boolean;
  compactMode: boolean;
}

export interface FilterSystemProps {
  variant?: FilterVariant;
  layout?: FilterLayout;
  customConfig?: Partial<FilterSystemConfig>;
  className?: string;
  
  // Filter data
  categoryFilter?: CategoryFilter;
  quickFilter?: QuickFilter;
  searchFilter?: SearchFilter;
  sortOptions?: SortOptions;
  
  // Results info
  resultsCount?: number;
  totalCount?: number;
  isLoading?: boolean;
  
  // Callbacks
  onFiltersChange?: (filters: any) => void;
  onReset?: () => void;
}