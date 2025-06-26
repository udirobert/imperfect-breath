/**
 * Results Header Component
 * Shows result count, sorting options, and view controls
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Grid, List, TrendingUp, Star, Clock, DollarSign } from "lucide-react";

interface ResultsHeaderProps {
  totalResults: number;
  currentPage?: number;
  resultsPerPage?: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
  searchQuery?: string;
}

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  totalResults,
  currentPage = 1,
  resultsPerPage = 12,
  sortBy,
  sortOrder,
  onSortChange,
  viewMode = "grid",
  onViewModeChange,
  searchQuery,
}) => {
  const startResult = (currentPage - 1) * resultsPerPage + 1;
  const endResult = Math.min(currentPage * resultsPerPage, totalResults);

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split("-");
    onSortChange(newSortBy, newSortOrder as "asc" | "desc");
  };

  const getSortValue = () => `${sortBy}-${sortOrder}`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
      {/* Results Count and Search Info */}
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {totalResults > 0 ? (
            <>
              Showing {startResult}-{endResult} of{" "}
              {totalResults.toLocaleString()} patterns
              {searchQuery && <span> for "{searchQuery}"</span>}
            </>
          ) : (
            "No patterns found"
          )}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <Label htmlFor="sort-select" className="text-sm whitespace-nowrap">
            Sort by:
          </Label>
          <Select value={getSortValue()} onValueChange={handleSortChange}>
            <SelectTrigger className="w-40" id="sort-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity-desc">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Most Popular
                </div>
              </SelectItem>
              <SelectItem value="rating-desc">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Highest Rated
                </div>
              </SelectItem>
              <SelectItem value="created_at-desc">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Newest First
                </div>
              </SelectItem>
              <SelectItem value="created_at-asc">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Oldest First
                </div>
              </SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="duration-asc">Duration (Short)</SelectItem>
              <SelectItem value="duration-desc">Duration (Long)</SelectItem>
              <SelectItem value="price-asc">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price (Low-High)
                </div>
              </SelectItem>
              <SelectItem value="price-desc">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price (High-Low)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle */}
        {onViewModeChange && (
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
