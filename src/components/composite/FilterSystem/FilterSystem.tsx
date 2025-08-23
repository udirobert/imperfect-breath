/**
 * FilterSystem Composite Component
 *
 * Unified filtering system that consolidates CategoryFilter, QuickFilters,
 * and SearchBar into a single, configurable component with variants.
 *
 * FOLLOWS BLUEPRINT: Enhancement-first methodology - replaces multiple
 * filter components with a single, variant-based solution.
 */

import React, { useMemo, useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Card, CardContent } from "../../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  SortAsc,
  RotateCcw,
  Loader2,
} from "lucide-react";

import type { FilterSystemProps } from "./types";
import {
  FILTER_VARIANT_CONFIGS,
  LAYOUT_STYLES,
  VARIANT_STYLES,
} from "./variants";

export const FilterSystem: React.FC<FilterSystemProps> = ({
  variant = "marketplace",
  layout,
  customConfig,
  className = "",
  categoryFilter,
  quickFilter,
  searchFilter,
  sortOptions,
  resultsCount,
  totalCount,
  isLoading = false,
  onFiltersChange,
  onReset,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Merge configuration
  const config = useMemo(
    () => ({
      ...FILTER_VARIANT_CONFIGS[variant],
      layout: layout || FILTER_VARIANT_CONFIGS[variant].layout,
      ...customConfig,
    }),
    [variant, layout, customConfig]
  );

  // Determine if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      (categoryFilter?.selectedCategory &&
        categoryFilter.selectedCategory !== "all") ||
      (quickFilter?.selectedFilters &&
        quickFilter.selectedFilters.length > 0) ||
      (searchFilter?.query && searchFilter.query.trim().length > 0) ||
      (sortOptions?.selectedSort && sortOptions.selectedSort !== "default")
    );
  }, [categoryFilter, quickFilter, searchFilter, sortOptions]);

  // Handle filter reset
  const handleReset = () => {
    categoryFilter?.onCategoryChange?.("all");
    quickFilter?.selectedFilters?.forEach((filterId) => {
      quickFilter.onFilterToggle(filterId);
    });
    searchFilter?.onQueryChange?.("");
    sortOptions?.onSortChange?.("default");
    onReset?.();
  };

  // Render category filter
  const renderCategoryFilter = () => {
    if (!config.showCategories || !categoryFilter) return null;

    return (
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <Select
          value={categoryFilter.selectedCategory || "all"}
          onValueChange={categoryFilter.onCategoryChange}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryFilter.categories.map((category) => (
              <SelectItem
                key={category.id}
                value={category.value}
                disabled={category.disabled}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{category.label}</span>
                  {category.count !== undefined && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {category.count}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  // Render quick filters
  const renderQuickFilters = () => {
    if (!config.showQuickFilters || !quickFilter) return null;

    const visibleFilters = quickFilter.maxVisible
      ? quickFilter.filters.slice(0, quickFilter.maxVisible)
      : quickFilter.filters;

    return (
      <div className="flex items-center gap-2 flex-wrap">
        {visibleFilters.map((filter) => {
          const isSelected = quickFilter.selectedFilters.includes(filter.id);
          const Icon = filter.icon;

          return (
            <Button
              key={filter.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => quickFilter.onFilterToggle(filter.id)}
              disabled={filter.disabled}
              className="h-8 text-xs"
            >
              {Icon && <Icon className="w-3 h-3 mr-1" />}
              {filter.label}
              {filter.count !== undefined && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {filter.count}
                </Badge>
              )}
            </Button>
          );
        })}

        {quickFilter.filters.length > (quickFilter.maxVisible || 999) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="h-8 text-xs"
          >
            <ChevronDown
              className={`w-3 h-3 mr-1 transition-transform ${
                showAdvanced ? "rotate-180" : ""
              }`}
            />
            More
          </Button>
        )}
      </div>
    );
  };

  // Render search filter
  const renderSearchFilter = () => {
    if (!config.showSearch || !searchFilter) return null;

    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            value={searchFilter.query}
            onChange={(e) => searchFilter.onQueryChange(e.target.value)}
            placeholder={searchFilter.placeholder || "Search..."}
            className="pl-10 w-64"
          />
          {searchFilter.query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => searchFilter.onQueryChange("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Render sort options
  const renderSortOptions = () => {
    if (!config.showSort || !sortOptions) return null;

    return (
      <div className="flex items-center gap-2">
        <SortAsc className="w-4 h-4 text-gray-500" />
        <Select
          value={sortOptions.selectedSort}
          onValueChange={sortOptions.onSortChange}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.options.map((option) => (
              <SelectItem key={option.id} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  // Render results count
  const renderResultsCount = () => {
    if (!config.showResultsCount || resultsCount === undefined) return null;

    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            <span>
              {resultsCount} of {totalCount || resultsCount} results
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-6 px-2 text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            )}
          </>
        )}
      </div>
    );
  };

  // Render advanced filters (expanded quick filters)
  const renderAdvancedFilters = () => {
    if (!showAdvanced || !quickFilter || !quickFilter.maxVisible) return null;

    const advancedFilters = quickFilter.filters.slice(quickFilter.maxVisible);

    return (
      <div className="flex items-center gap-2 flex-wrap mt-2 pt-2 border-t">
        {advancedFilters.map((filter) => {
          const isSelected = quickFilter.selectedFilters.includes(filter.id);
          const Icon = filter.icon;

          return (
            <Button
              key={filter.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => quickFilter.onFilterToggle(filter.id)}
              disabled={filter.disabled}
              className="h-8 text-xs"
            >
              {Icon && <Icon className="w-3 h-3 mr-1" />}
              {filter.label}
              {filter.count !== undefined && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {filter.count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    );
  };

  const containerClass = `${VARIANT_STYLES[variant]} ${className}`;
  const layoutClass = LAYOUT_STYLES[config.layout];

  if (config.compactMode) {
    return (
      <div className={`${containerClass} ${layoutClass}`}>
        {renderSearchFilter()}
        {renderCategoryFilter()}
        {renderResultsCount()}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className={layoutClass}>
          {renderCategoryFilter()}
          {renderQuickFilters()}
          {renderSearchFilter()}
          {renderSortOptions()}
          {renderResultsCount()}
        </div>
        {renderAdvancedFilters()}
      </CardContent>
    </Card>
  );
};
