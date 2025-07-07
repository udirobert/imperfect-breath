/**
 * Quick Filters Component
 * Common filter shortcuts for marketplace
 */

import React from "react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Star,
  DollarSign,
  Clock,
  Zap,
  Crown,
  Gift,
  Sparkles,
  TrendingUp,
  Video,
  Volume2,
} from "lucide-react";

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  active?: boolean;
}

interface QuickFiltersProps {
  filters: QuickFilter[];
  onFilterToggle: (filterId: string) => void;
  onClearAll: () => void;
  showCounts?: boolean;
}

const defaultFilters: QuickFilter[] = [
  { id: "free", label: "Free", icon: Gift, count: 45 },
  { id: "premium", label: "Premium", icon: Crown, count: 23 },
  { id: "highly-rated", label: "Top Rated", icon: Star, count: 34 },
  { id: "trending", label: "Trending", icon: TrendingUp, count: 12 },
  { id: "new", label: "New", icon: Sparkles, count: 8 },
  { id: "quick", label: "Quick (< 5 min)", icon: Clock, count: 28 },
  { id: "has-video", label: "With Video", icon: Video, count: 31 },
  { id: "has-audio", label: "With Audio", icon: Volume2, count: 42 },
];

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  filters = defaultFilters,
  onFilterToggle,
  onClearAll,
  showCounts = true,
}) => {
  const activeFilters = filters.filter((f) => f.active);
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Quick Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const IconComponent = filter.icon;

          return (
            <Button
              key={filter.id}
              variant={filter.active ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterToggle(filter.id)}
              className="flex items-center gap-2 h-8"
            >
              <IconComponent className="h-3 w-3" />
              <span className="text-xs">{filter.label}</span>
              {showCounts && filter.count && (
                <Badge
                  variant={filter.active ? "secondary" : "outline"}
                  className="ml-1 h-4 px-1 text-xs"
                >
                  {filter.count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Active filters:</span>
          <div className="flex flex-wrap gap-1">
            {activeFilters.map((filter) => (
              <Badge key={filter.id} variant="secondary" className="text-xs">
                {filter.label}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
