/**
 * Marketplace Container Component
 * Main container that combines all marketplace components
 */

import React, { useState, useEffect, useMemo } from "react";
import { SearchBar } from "./SearchBar";
import { CategoryFilter } from "./CategoryFilter";
import { ResultsHeader } from "./ResultsHeader";
import { PatternCard } from "./PatternCard";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import {
  Loader2,
  RefreshCw,
  Heart,
  Brain,
  Target,
  Zap,
  Moon,
  Award,
} from "lucide-react";
import type { EnhancedCustomPattern } from "../../types/patterns";

interface MarketplaceContainerProps {
  patterns: EnhancedCustomPattern[];
  loading?: boolean;
  onPatternPlay: (pattern: EnhancedCustomPattern) => void;
  onPatternLike?: (patternId: string) => void;
  likedPatterns?: string[];
  onRefresh?: () => void;
}

export const MarketplaceContainer: React.FC<MarketplaceContainerProps> = ({
  patterns,
  loading = false,
  onPatternPlay,
  onPatternLike,
  likedPatterns = [],
  onRefresh,
}) => {
  // State for filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("popularity");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter and sort patterns
  const filteredAndSortedPatterns = useMemo(() => {
    let filtered = [...patterns];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pattern) =>
          pattern.name.toLowerCase().includes(query) ||
          pattern.description.toLowerCase().includes(query) ||
          pattern.instructorName.toLowerCase().includes(query) ||
          pattern.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((pattern) =>
        selectedCategories.includes(pattern.category)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "created_at":
          // Fallback to ID-based sorting since created_at may not be available
          comparison = a.id.localeCompare(b.id);
          break;
        case "duration":
          comparison = a.duration - b.duration;
          break;
        case "price":
          comparison = (a.access.price || 0) - (b.access.price || 0);
          break;
        case "rating":
          // Use properties available in EnhancedCustomPattern for rating comparison
          // Use primaryBenefits length as a proxy for quality/rating
          const aRatingProxy = a.primaryBenefits.length;
          const bRatingProxy = b.primaryBenefits.length;
          comparison = aRatingProxy - bRatingProxy;

          // If primaryBenefits are equal, sort by difficulty as secondary criteria
          if (comparison === 0) {
            const difficultyMap = { beginner: 0, intermediate: 1, advanced: 2 };
            comparison =
              (difficultyMap[a.difficulty] || 0) -
              (difficultyMap[b.difficulty] || 0);
          }
          break;
        case "popularity":
        default:
          // Use available properties as proxies for popularity
          // Instructor name length as a very basic proxy (in a real app, you'd use actual metrics)
          comparison = a.instructorName.length - b.instructorName.length;

          // Secondary sorting criteria
          if (comparison === 0) {
            comparison = a.name.localeCompare(b.name);
          }
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [patterns, searchQuery, selectedCategories, sortBy, sortOrder]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearchClear = () => {
    setSearchQuery("");
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCategoryClearAll = () => {
    setSelectedCategories([]);
  };

  const handleSortChange = (
    newSortBy: string,
    newSortOrder: "asc" | "desc"
  ) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Search Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Marketplace</h1>
          {onRefresh && (
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          )}
        </div>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          onClear={handleSearchClear}
          placeholder="Search patterns, instructors, techniques..."
        />
      </div>

      {/* Filters Section */}
      <Card>
        <CardContent className="pt-6">
          <CategoryFilter
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            onClearAll={handleCategoryClearAll}
            categories={[
              { id: "stress", name: "Stress Relief", icon: Heart },
              { id: "sleep", name: "Sleep", icon: Moon },
              { id: "energy", name: "Energy", icon: Zap },
              { id: "focus", name: "Focus", icon: Target },
              { id: "performance", name: "Performance", icon: Award },
            ]}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Results Header */}
      <ResultsHeader
        totalResults={filteredAndSortedPatterns.length}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
      />

      {/* Results Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading patterns...</p>
          </div>
        </div>
      ) : filteredAndSortedPatterns.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <div className="text-muted-foreground">
            <h3 className="text-lg font-medium">No patterns found</h3>
            <p>
              {searchQuery || selectedCategories.length > 0
                ? "Try adjusting your search or filters"
                : "No breathing patterns are available yet"}
            </p>
          </div>
          {(searchQuery || selectedCategories.length > 0) && (
            <div className="flex gap-2 justify-center">
              {searchQuery && (
                <Button variant="outline" onClick={handleSearchClear}>
                  Clear Search
                </Button>
              )}
              {selectedCategories.length > 0 && (
                <Button variant="outline" onClick={handleCategoryClearAll}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {filteredAndSortedPatterns.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              onPlay={onPatternPlay}
              onLike={onPatternLike}
              isLiked={likedPatterns.includes(pattern.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
